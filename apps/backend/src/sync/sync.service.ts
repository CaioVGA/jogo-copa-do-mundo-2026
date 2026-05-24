import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from '../predictions/predictions.service';
import { RedisService } from '../prisma/redis.service';

@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SyncService');
  private isPollingActive = false;
  private pollingTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly predictionsService: PredictionsService,
    private readonly redis: RedisService,
  ) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('Limpando cache de detalhes de grupos para evitar dados obsoletos pós-inicialização...');
      await this.redis.delByPattern('group:details:*');
    } catch (err) {
      this.logger.error('Erro ao limpar cache de grupos na inicialização:', err);
    }
    this.startPolling();
  }

  startPolling() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    this.logger.log('Iniciando rotina de polling da API de Sincronização (intervalo de 5 minutos)...');
    this.poll();
  }

  stopPolling() {
    this.isPollingActive = false;
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
  }

  private async poll() {
    try {
      await this.syncScores(false); // Sincronização automática respeitando a janela de otimização
    } catch (err) {
      this.logger.error('Erro durante o polling automático de placares:', err);
    }

    if (this.isPollingActive) {
      const minutes = Number(this.config.get<string>('API_FOOTBALL_POLLING_MINUTES')) || 5;
      const intervalMs = minutes * 60 * 1000;
      this.pollingTimeout = setTimeout(() => this.poll(), intervalMs);
    }
  }

  /**
   * Retorna o status atual da integração da API.
   */
  async getSyncStatus() {
    const totalMatches = await this.prisma.match.count();
    const mappedMatches = await this.prisma.match.count({
      where: { apiFixtureId: { not: null } },
    });
    const pendingMatches = totalMatches - mappedMatches;

    const apiKey = this.config.get<string>('API_FOOTBALL_KEY');
    const apiConfigured = !!apiKey && apiKey !== 'your-api-key-here';

    // Teste rápido de conectividade se configurado
    let apiStatus = 'Configuração pendente';
    if (apiConfigured) {
      if (apiKey.toLowerCase().startsWith('mock')) {
        apiStatus = 'Conectado (Modo Simulado / Mock)';
      } else {
        try {
          const url = this.config.get<string>('API_FOOTBALL_URL') || 'https://api.football-data.org/v4';
          const response = await fetch(`${url}/competitions/WC`, {
            headers: {
              'X-Auth-Token': apiKey,
            },
          });
          const data = await response.json();
          if (response.ok && !data.errorCode) {
            apiStatus = 'Conectado com sucesso';
          } else {
            apiStatus = `Erro na API: ${data.message || JSON.stringify(data)}`;
          }
        } catch (err) {
          apiStatus = `Falha de conexão: ${err.message}`;
        }
      }
    }

    return {
      totalMatches,
      mappedMatches,
      pendingMatches,
      apiConfigured,
      apiStatus,
    };
  }

  /**
   * Mapeia automaticamente as partidas do banco local com as partidas da API-Football.
   * Utiliza códigos de equipes (ex: BRA vs ARG) e datas próximas (tolerância de 24h).
   */
  async mapMatches() {
    const apiKey = this.config.get<string>('API_FOOTBALL_KEY');
    if (!apiKey || apiKey === 'your-api-key-here') {
      throw new Error('Chave da API se sincronização não configurada no arquivo de ambiente');
    }

    if (apiKey.toLowerCase().startsWith('mock')) {
      this.logger.log('Modo de simulação ativo: Mapeando partidas locais...');

      // Reseta os jogos e os pontos anteriores para permitir múltiplos testes limpos
      await this.prisma.match.updateMany({
        data: {
          homeScore: null,
          awayScore: null,
          status: 'PENDING',
        },
      });

      await this.prisma.matchPrediction.updateMany({
        data: {
          points: 0,
        },
      });

      const unmappedMatches = await this.prisma.match.findMany({
        where: {
          apiFixtureId: null,
          homeTeamId: { not: null },
          awayTeamId: { not: null },
        },
      });

      let mappedCount = 0;
      for (let i = 0; i < unmappedMatches.length; i++) {
        const match = unmappedMatches[i];
        await this.prisma.match.update({
          where: { id: match.id },
          data: {
            apiFixtureId: 999000 + i,
          },
        });
        mappedCount++;
      }

      await this.redis.delByPattern('group:details:*');

      return {
        success: true,
        message: `${mappedCount} partidas foram mapeadas com sucesso (Modo Simulado e Resetado).`,
        mappedCount,
      };
    }

    // Carrega todas as partidas locais que ainda não possuem mapeamento
    // E onde ambos os times estão definidos
    const unmappedMatches = await this.prisma.match.findMany({
      where: {
        apiFixtureId: null,
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (unmappedMatches.length === 0) {
      return { success: true, message: 'Nenhuma partida elegível para mapeamento.', mappedCount: 0 };
    }

    const apiUrl = this.config.get<string>('API_FOOTBALL_URL') || 'https://api.football-data.org/v4';
    const season = this.config.get<string>('API_FOOTBALL_SEASON') || '2026';
    const url = `${apiUrl}/competitions/WC/matches?season=${season}`;
    this.logger.log(`Buscando fixtures de football-data.org em: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || JSON.stringify(errorData);
      } catch {}
      throw new Error(`Erro na API externa (football-data.org): ${errorMsg}`);
    }

    const apiData = await response.json();
    const fixtures = (apiData.matches || []) as any[];
    let mappedCount = 0;

    for (const match of unmappedMatches) {
      if (!match.homeTeam || !match.awayTeam) continue;

      const homeCode = match.homeTeam.code;
      const awayCode = match.awayTeam.code;

      // Procura nas fixtures da API por um jogo com esses mesmos dois times
      // Se a temporada for a real (2026), comparamos proximidade de data (24h)
      // Se for outra temporada (ex: 2022 para testes de API-Football Free), apenas comparamos os times
      const matchedFixture = fixtures.find((f: any) => {
        const apiHomeCode = f.homeTeam?.tla;
        const apiAwayCode = f.awayTeam?.tla;
        if (!apiHomeCode || !apiAwayCode) return false;

        const teamsMatch =
          (apiHomeCode === homeCode && apiAwayCode === awayCode) ||
          (apiHomeCode === awayCode && apiAwayCode === homeCode);

        if (!teamsMatch) return false;

        if (season === '2026') {
          // Compara data da fixture (UTC) com data local (UTC)
          const matchTime = new Date(match.date).getTime();
          const fixtureTime = new Date(f.utcDate).getTime();
          const diffHours = Math.abs(matchTime - fixtureTime) / (1000 * 60 * 60);

          return diffHours < 24; // Diferença menor que 24 horas
        }

        return true;
      });

      if (matchedFixture) {
        await this.prisma.match.update({
          where: { id: match.id },
          data: {
            apiFixtureId: matchedFixture.id,
          },
        });
        mappedCount++;
        this.logger.log(`Partida [${match.homeTeam.name} vs ${match.awayTeam.name}] mapeada com sucesso para o Fixture ID ${matchedFixture.id}`);
      }
    }

    return {
      success: true,
      message: `${mappedCount} partidas foram mapeadas com sucesso.`,
      mappedCount,
    };
  }

  /**
   * Sincroniza os placares e status de partidas mapeadas da API-Football.
   * @param forceIgnoreWindow Se true, ignora a janela de otimização de requests e faz a chamada HTTP obrigatoriamente.
   */
  async syncScores(forceIgnoreWindow = false) {
    const apiKey = this.config.get<string>('API_FOOTBALL_KEY');
    if (!apiKey || apiKey === 'your-api-key-here') {
      this.logger.warn('Sincronização abortada: chave da API de sincronização não configurada no arquivo de ambiente');
      return { success: false, message: 'Chave da API não configurada', updatedCount: 0 };
    }

    if (apiKey.toLowerCase().startsWith('mock')) {
      this.logger.log('Modo de simulação ativo: Sincronizando placares simulados...');

      const activeMatches = await this.prisma.match.findMany({
        where: {
          apiFixtureId: { not: null },
          status: { not: 'FINISHED' },
        },
      });

      if (activeMatches.length === 0) {
        return { success: true, message: 'Nenhuma partida ativa simulada para atualizar.', updatedCount: 0 };
      }

      let updatedCount = 0;
      // Para simular estados variados no painel:
      // - O primeiro jogo ativo vira LIVE com placar 2-1
      // - O segundo jogo ativo vira FINISHED com placar 1-0 (calculando pontos)
      // - O terceiro jogo ativo vira LIVE com placar 0-0
      // - O resto permanece PENDING (ignora)
      for (let i = 0; i < activeMatches.length; i++) {
        const localMatch = activeMatches[i];
        let newStatus = 'PENDING';
        let homeScore = 0;
        let awayScore = 0;

        if (i === 0) {
          newStatus = 'LIVE';
          homeScore = 2;
          awayScore = 1;
        } else if (i === 1) {
          newStatus = 'FINISHED';
          homeScore = 1;
          awayScore = 0;
        } else if (i === 2) {
          newStatus = 'LIVE';
          homeScore = 0;
          awayScore = 0;
        } else {
          continue;
        }

        const scoreChanged = homeScore !== localMatch.homeScore || awayScore !== localMatch.awayScore;
        const statusChanged = newStatus !== localMatch.status;

        if (scoreChanged || statusChanged) {
          await this.predictionsService.syncMatchScore(localMatch.id, homeScore, awayScore, newStatus);

          // Se a Final terminou (modo mock), tenta computar pontos de premiações
          if (newStatus === 'FINISHED' && localMatch.stage === 'Final') {
            await this.checkAndComputeAwards();
          }

          updatedCount++;
        }
      }

      await this.redis.delByPattern('group:details:*');

      return {
        success: true,
        message: `${updatedCount} partidas atualizadas com sucesso (Modo Simulado).`,
        updatedCount,
      };
    }

    // 1. Otimização de quota: verifica se há jogos acontecendo agora ou em breve
    if (!forceIgnoreWindow) {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 3.5 * 60 * 60 * 1000); // 3.5 horas atrás
      const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos no futuro

      const activeOrUpcomingMatchCount = await this.prisma.match.count({
        where: {
          OR: [
            { status: 'LIVE' },
            {
              status: 'PENDING',
              date: {
                gte: windowStart,
                lte: windowEnd,
              },
            },
          ],
        },
      });

      if (activeOrUpcomingMatchCount === 0) {
        this.logger.log('Otimização de Quota: Nenhuma partida ao vivo ou nos próximos 15 minutos. Pulando requisição externa.');
        return { success: true, message: 'Pulado por otimização (nenhum jogo ativo ou próximo).', updatedCount: 0 };
      }
    }

    // Busca todas as partidas locais mapeadas e não finalizadas
    const activeMatches = await this.prisma.match.findMany({
      where: {
        apiFixtureId: { not: null },
        status: { not: 'FINISHED' },
      },
    });

    if (activeMatches.length === 0) {
      return { success: true, message: 'Nenhuma partida ativa mapeada para atualizar.', updatedCount: 0 };
    }

    // Busca as fixtures da API para atualizar placares
    const apiUrl = this.config.get<string>('API_FOOTBALL_URL') || 'https://api.football-data.org/v4';
    const season = this.config.get<string>('API_FOOTBALL_SEASON') || '2026';
    const url = `${apiUrl}/competitions/WC/matches?season=${season}`;
    
    this.logger.log(`Buscando placares de football-data.org em: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || JSON.stringify(errorData);
      } catch {}
      throw new Error(`Erro na API externa de placares (football-data.org): ${errorMsg}`);
    }

    const apiData = await response.json();
    const fixtures = (apiData.matches || []) as any[];
    let updatedCount = 0;

    for (const f of fixtures) {
      const fixtureId = f.id;
      const status = f.status;
      
      const goalsHome = f.score?.fullTime?.home;
      const goalsAway = f.score?.fullTime?.away;

      const localMatch = activeMatches.find((m) => m.apiFixtureId === fixtureId);
      if (!localMatch) continue;

      let newStatus = 'PENDING';
      
      // Mapeamento de status do football-data.org
      // SCHEDULED, TIMED -> PENDING
      // IN_PLAY, PAUSED -> LIVE
      // FINISHED -> FINISHED
      if (status === 'FINISHED') {
        newStatus = 'FINISHED';
      } else if (['IN_PLAY', 'PAUSED'].includes(status)) {
        newStatus = 'LIVE';
      } else {
        newStatus = 'PENDING';
      }

      // Se o placar mudou ou o status mudou, atualiza
      const scoreChanged = (goalsHome !== null && goalsHome !== undefined && goalsHome !== localMatch.homeScore) || 
                          (goalsAway !== null && goalsAway !== undefined && goalsAway !== localMatch.awayScore);
      const statusChanged = newStatus !== localMatch.status;

      if (scoreChanged || statusChanged) {
        const homeScore = goalsHome ?? 0;
        const awayScore = goalsAway ?? 0;

        this.logger.log(`Atualizando partida local ${localMatch.id} (Fixture ${fixtureId}): status ${localMatch.status} -> ${newStatus}, placar ${localMatch.homeScore}-${localMatch.awayScore} -> ${homeScore}-${awayScore}`);
        
        await this.predictionsService.syncMatchScore(localMatch.id, homeScore, awayScore, newStatus);

        // Se a Final terminou, tenta computar pontos de premiações
        if (newStatus === 'FINISHED' && localMatch.stage === 'Final') {
          await this.checkAndComputeAwards();
        }

        updatedCount++;
      }
    }

    return {
      success: true,
      message: `${updatedCount} partidas atualizadas com sucesso.`,
      updatedCount,
    };
  }

  /**
   * Verifica grupos que têm resultados de premiações definidos e a Final foi finalizada;
   * computa os pontos de premiações independentemente por grupo.
   */
  private async checkAndComputeAwards() {
    try {
      // Verifica se a Final já terminou
      const finalMatch = await this.prisma.match.findFirst({
        where: {
          stage: 'Final',
          status: 'FINISHED',
        },
      });

      if (!finalMatch) {
        return; // A Final ainda não terminou
      }

      // Busca todos os grupos que têm pelo menos um resultado definido e não foram computados
      const groups = await this.prisma.group.findMany({
        where: {
          awardsComputed: false,
          NOT: {
            AND: [
              { topScorerResult: null },
              { assistLeaderResult: null },
              { bestPlayerResult: null },
            ],
          },
        },
        include: {
          members: {
            select: {
              id: true,
              topScorer: true,
              assistLeader: true,
              bestPlayer: true,
              awardsPoints: true,
            },
          },
        },
      });

      if (groups.length === 0) {
        return; // Nenhum grupo com resultados pendentes de computação
      }

      this.logger.log(`Final encerrada. Calculando premiações para ${groups.length} grupos...`);

      const AWARD_POINTS = 15;
      let totalUpdated = 0;

      for (const group of groups) {
        let groupUpdated = 0;

        for (const member of group.members) {
          let points = 0;

          if (
            group.topScorerResult &&
            member.topScorer &&
            member.topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase()
          ) {
            points += AWARD_POINTS;
          }

          if (
            group.assistLeaderResult &&
            member.assistLeader &&
            member.assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase()
          ) {
            points += AWARD_POINTS;
          }

          if (
            group.bestPlayerResult &&
            member.bestPlayer &&
            member.bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase()
          ) {
            points += AWARD_POINTS;
          }

          if (points !== member.awardsPoints) {
            await this.prisma.groupMember.update({
              where: { id: member.id },
              data: { awardsPoints: points },
            });
            groupUpdated++;
          }
        }

        await this.prisma.group.update({
          where: { id: group.id },
          data: { awardsComputed: true },
        });

        await this.redis.del(`group:details:${group.id}`);

        totalUpdated += groupUpdated;
        this.logger.log(`Grupo "${group.name}": ${groupUpdated} membros atualizados.`);
      }

      this.logger.log(`Premiações calculadas: ${groups.length} grupos, ${totalUpdated} membros atualizados.`);
    } catch (err) {
      this.logger.error('Erro ao calcular pontos de premiações:', err);
    }
  }
}
