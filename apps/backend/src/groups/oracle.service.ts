import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { SaveOracleDto } from './dto/save-oracle.dto';

@Injectable()
export class OracleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Buscar palpites e times agrupados ────────────────────────────────────
  async getOracleData(groupId: string, userId: string) {
    // 1. Validar se o grupo existe e o usuário participa dele
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    if (group.members.length === 0) {
      throw new ForbiddenException('Você não faz parte deste grupo de bolão');
    }

    // 2. Buscar todos os times que estão em grupos (A, B, C...)
    const teams = await this.prisma.team.findMany({
      where: {
        group: { not: null },
      },
      select: {
        code: true,
        name: true,
        flag: true,
        group: true,
      },
    });

    // 3. Buscar previsões já salvas pelo usuário neste grupo de bolão
    const savedPredictions = await this.prisma.oraclePrediction.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const predictionMap = new Map<string, string[]>();
    savedPredictions.forEach((p) => {
      predictionMap.set(p.groupName, p.teamOrder.split(','));
    });

    // 4. Agrupar os times por grupo e aplicar a ordenação
    const grouped: Record<string, any[]> = {};

    teams.forEach((t) => {
      const gName = t.group!;
      if (!grouped[gName]) {
        grouped[gName] = [];
      }
      grouped[gName].push(t);
    });

    // Ordenar cada grupo com base no palpite salvo, ou manter a ordem padrão se não houver palpite
    Object.keys(grouped).forEach((gName) => {
      const savedOrder = predictionMap.get(gName);
      if (savedOrder && savedOrder.length > 0) {
        // Ordenar os times baseando-se no índice que ocupam na string de palpites
        grouped[gName].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.code);
          const indexB = savedOrder.indexOf(b.code);
          // Se algum time não estiver no palpite por segurança, vai pro fim
          const finalIndexA = indexA === -1 ? 99 : indexA;
          const finalIndexB = indexB === -1 ? 99 : indexB;
          return finalIndexA - finalIndexB;
        });
      } else {
        // Sem palpites salvos: ordenar alfabeticamente
        grouped[gName].sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    // 5. Verificar se a fase de grupos terminou e calcular a classificação real
    const pendingGroupMatches = await this.prisma.match.count({
      where: {
        stage: { startsWith: 'Fase de Grupos' },
        status: 'PENDING',
      },
    });
    const isGroupStageFinished = pendingGroupMatches === 0;

    const sortedStandings: Record<string, any[]> = {};
    if (isGroupStageFinished) {
      const matches = await this.prisma.match.findMany({
        where: { stage: { startsWith: 'Fase de Grupos' } },
        include: { homeTeam: true, awayTeam: true },
      });

      const allTeams = await this.prisma.team.findMany({
        where: { group: { not: null } },
      });

      const standingsMap: Record<string, Record<string, any>> = {};

      allTeams.forEach((t) => {
        const g = t.group!;
        if (!standingsMap[g]) {
          standingsMap[g] = {};
        }
        standingsMap[g][t.code] = {
          code: t.code,
          name: t.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0,
        };
      });

      matches.forEach((m) => {
        if (m.status !== 'FINISHED' || !m.homeTeam || !m.awayTeam) return;
        const g = m.homeTeam.group!;
        const home = standingsMap[g]?.[m.homeTeam.code];
        const away = standingsMap[g]?.[m.awayTeam.code];

        if (!home || !away) return;

        home.played += 1;
        away.played += 1;

        const hs = m.homeScore ?? 0;
        const as = m.awayScore ?? 0;

        home.gf += hs;
        home.ga += as;
        away.gf += as;
        away.ga += hs;

        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;

        if (hs > as) {
          home.won += 1;
          home.points += 3;
          away.lost += 1;
        } else if (hs < as) {
          away.won += 1;
          away.points += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          home.points += 1;
          away.drawn += 1;
          away.points += 1;
        }
      });

      Object.keys(standingsMap).forEach((g) => {
        const list = Object.values(standingsMap[g]);
        list.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          if (b.gf !== a.gf) return b.gf - a.gf;
          return a.name.localeCompare(b.name);
        });
        sortedStandings[g] = list;
      });
    }

    // 6. Enriquecer os times ordenados com as informações de pontuação real do Oráculo
    const enrichedGrouped: Record<string, any[]> = {};
    Object.keys(grouped).forEach((gName) => {
      const teamsList = grouped[gName];
      const actualList = sortedStandings[gName];

      enrichedGrouped[gName] = teamsList.map((team, index) => {
        let pointsEarned = 0;
        let realPosition = null;

        if (isGroupStageFinished && actualList) {
          realPosition = actualList.findIndex((t) => t.code === team.code) + 1;
          if (index < 4 && team.code === actualList[index].code) {
            pointsEarned = 3;
          }
        }

        return {
          ...team,
          pointsEarned,
          realPosition,
          isPredictedCorrectly: realPosition === (index + 1),
        };
      });
    });

    return {
      groups: enrichedGrouped,
      hasPredictions: savedPredictions.length > 0,
      isGroupStageFinished,
    };
  }

  // ─── Salvar palpites do Oráculo ──────────────────────────────────────────
  async saveOracleData(groupId: string, userId: string, dto: SaveOracleDto) {
    // 1. Validar se o usuário é membro do grupo
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo de bolão');
    }

    // 1.5. Validar prazo de envio do Oráculo (até o início do primeiro jogo da fase de grupos)
    const firstGroupMatch = await this.prisma.match.findFirst({
      where: { stage: { startsWith: 'Fase de Grupos' } },
      orderBy: { date: 'asc' },
    });

    if (firstGroupMatch) {
      const now = new Date();
      const firstMatchDate = new Date(firstGroupMatch.date);
      if (now >= firstMatchDate) {
        throw new ForbiddenException('O Oráculo está fechado. Palpites só podiam ser enviados até o início do primeiro jogo da fase de grupos.');
      }
    }

    // 2. Gravar os palpites para cada grupo
    for (const pred of dto.groupPredictions) {
      if (!pred.groupName || !pred.teamOrder || pred.teamOrder.length === 0) {
        continue;
      }

      await this.prisma.oraclePrediction.upsert({
        where: {
          userId_groupId_groupName: {
            userId,
            groupId,
            groupName: pred.groupName,
          },
        },
        update: {
          teamOrder: pred.teamOrder.join(','),
        },
        create: {
          userId,
          groupId,
          groupName: pred.groupName,
          teamOrder: pred.teamOrder.join(','),
        },
      });
    }

    // 3. Invalida o cache do grupo para que a classificação recalcule o Oráculo imediatamente
    await this.redis.del(`group:details:${groupId}`);

    return { message: 'Palpites do Oráculo salvos com sucesso!' };
  }
}
