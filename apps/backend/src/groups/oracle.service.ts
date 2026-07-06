import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { SaveOracleDto } from './dto/save-oracle.dto';
import { getMatchKickoffTimestamp, isMatchLockedByKickoff } from '../common/utils/match-time';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOracleData(groupId: string, userId: string) {
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

    const teams = await this.prisma.team.findMany({
      where: {
        group: { not: null },
      },
      select: {
        id: true,
        code: true,
        name: true,
        flag: true,
        group: true,
      },
    });

    const savedPredictions = await this.prisma.oraclePrediction.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const knockoutPredictionsRaw = await this.prisma.oracleKnockoutPrediction.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const predictionMap = new Map<string, string[]>();
    savedPredictions.forEach((p) => {
      predictionMap.set(p.groupName, p.teamOrder.split(','));
    });

    const knockoutPredictions: Record<string, string> = {};
    knockoutPredictionsRaw.forEach((kp) => {
      knockoutPredictions[kp.matchId] = kp.predictedWinner;
    });

    const grouped: Record<string, any[]> = {};

    teams.forEach((t) => {
      const gName = t.group!;
      if (!grouped[gName]) {
        grouped[gName] = [];
      }
      grouped[gName].push(t);
    });

    Object.keys(grouped).forEach((gName) => {
      const savedOrder = predictionMap.get(gName);
      if (savedOrder && savedOrder.length > 0) {
        grouped[gName].sort((a, b) => {
          let indexA = savedOrder.indexOf(a.code);
          if (indexA === -1) indexA = savedOrder.indexOf(a.id);
          
          let indexB = savedOrder.indexOf(b.code);
          if (indexB === -1) indexB = savedOrder.indexOf(b.id);
          
          const finalIndexA = indexA === -1 ? 99 : indexA;
          const finalIndexB = indexB === -1 ? 99 : indexB;
          return finalIndexA - finalIndexB;
        });
      } else {
        grouped[gName].sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    const pendingGroupMatches = await this.prisma.match.count({
      where: {
        stage: { startsWith: 'Fase de Grupos' },
        status: { not: 'FINISHED' },
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

    const knockoutStages = [
      'Dezesseisavos de Final',
      'Oitavas de Final',
      'Quartas de Final',
      'Semifinais',
      'Terceiro Lugar',
      'Final'
    ];
    
    const knockoutDeadlines: Record<string, string> = {};
    const knockoutMatches = await this.prisma.match.findMany({
      where: { stage: { in: knockoutStages } },
      select: { stage: true, date: true },
      orderBy: { date: 'asc' }
    });

    for (const stage of knockoutStages) {
      const match = knockoutMatches.find(m => m.stage === stage);
      if (match) {
        knockoutDeadlines[stage] = match.date.toISOString();
      }
    }

    return {
      groups: enrichedGrouped,
      hasPredictions: savedPredictions.length > 0 || knockoutPredictionsRaw.length > 0,
      isGroupStageFinished,
      knockoutPredictions,
      knockoutDeadlines,
    };
  }

  async saveOracleData(groupId: string, userId: string, dto: SaveOracleDto) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo de bolão');
    }

    const now = new Date();

    // Buscando o primeiro jogo da fase de grupos
    const firstGroupMatch = await this.prisma.match.findFirst({
      where: { stage: { startsWith: 'Fase de Grupos' } },
      orderBy: { date: 'asc' },
    });
    const oracleGroupsDeadline = firstGroupMatch
      ? getMatchKickoffTimestamp(firstGroupMatch.date)
      : new Date('2026-06-11T16:00:00-03:00').getTime();

    // Buscando os deadlines de cada fase para validação granular
    const knockoutStages = [
      'Dezesseisavos de Final',
      'Oitavas de Final',
      'Quartas de Final',
      'Semifinais',
      'Terceiro Lugar',
      'Final'
    ];
    
    const knockoutDeadlines: Record<string, Date> = {};
    const knockoutMatchesList = await this.prisma.match.findMany({
      where: { stage: { in: knockoutStages } },
      select: { stage: true, date: true },
      orderBy: { date: 'asc' }
    });

    for (const stage of knockoutStages) {
      const match = knockoutMatchesList.find(m => m.stage === stage);
      if (match) {
        knockoutDeadlines[stage] = new Date(getMatchKickoffTimestamp(match.date));
      }
    }

    const isGroupsClosed = now.getTime() >= oracleGroupsDeadline;

    // Removemos o throw global de isKnockoutClosed para que seja validado por fase
    // if (isGroupsClosed && isKnockoutClosed) {
    //   throw new ForbiddenException('O Oráculo está totalmente fechado.');
    // }

    // 2. Gravar os palpites para cada grupo (apenas se o prazo de grupos estiver aberto)
    if (!isGroupsClosed && dto.groupPredictions) {
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
    }

    // 3. Gravar os palpites do mata-mata (validando por partida)
    if (dto.knockoutPredictions) {
      const matchIds = dto.knockoutPredictions.map(p => p.matchId);
      const matchesInfo = await this.prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: { id: true, stage: true, date: true, status: true }
      });

      const matchInfoMap = new Map(matchesInfo.map((m) => [m.id, m] as const));
      const existingPredictions = await this.prisma.oracleKnockoutPrediction.findMany({
        where: {
          userId,
          groupId,
          matchId: { in: matchIds }
        },
        select: { matchId: true, predictedWinner: true }
      });
      const existingPredictionsMap = new Map(existingPredictions.map((p) => [p.matchId, p.predictedWinner]));
      const blockedUpdates: Array<{ matchId: string; stage: string; attemptedWinner: string }> = [];
      const allowedUpdates: typeof dto.knockoutPredictions = [];

      for (const pred of dto.knockoutPredictions) {
        if (!pred.matchId || !pred.predictedWinner) continue;

        const matchInfo = matchInfoMap.get(pred.matchId);
        if (!matchInfo) continue;

        // Regra do Oráculo mata-mata: trava no apito inicial de cada confronto.
        if (isMatchLockedByKickoff(matchInfo.date, now)) {
          const previousWinner = existingPredictionsMap.get(pred.matchId);
          const isNoopUpdate = previousWinner === pred.predictedWinner;
          if (!isNoopUpdate) {
            blockedUpdates.push({
              matchId: pred.matchId,
              stage: matchInfo.stage,
              attemptedWinner: pred.predictedWinner
            });
          }
          continue;
        }
        allowedUpdates.push(pred);
      }

      if (blockedUpdates.length > 0) {
        this.logger.warn(
          `[ORACLE_KNOCKOUT_BLOCKED] userId=${userId} groupId=${groupId} blocked=${JSON.stringify(blockedUpdates)}`
        );
        throw new ForbiddenException(
          'Não foi possível salvar um ou mais palpites do mata-mata porque essas partidas já estão bloqueadas.'
        );
      }

      for (const pred of allowedUpdates) {
        await this.prisma.oracleKnockoutPrediction.upsert({
          where: {
            userId_groupId_matchId: {
              userId,
              groupId,
              matchId: pred.matchId,
            },
          },
          update: {
            predictedWinner: pred.predictedWinner,
          },
          create: {
            userId,
            groupId,
            matchId: pred.matchId,
            predictedWinner: pred.predictedWinner,
          },
        });
      }
    }

    if (dto.resetKnockout) {
      const lockedMatches = await this.prisma.match.findMany({
        where: { stage: { in: knockoutStages } },
        select: { id: true, date: true, status: true }
      });
      const lockedMatchIds = lockedMatches
        .filter((m) => isMatchLockedByKickoff(m.date, now))
        .map((m) => m.id);

      await this.prisma.oracleKnockoutPrediction.deleteMany({
        where: {
          userId,
          groupId,
          matchId: {
            notIn: lockedMatchIds
          }
        }
      });
    }

    // 3. Invalida o cache do grupo para que a classificação recalcule o Oráculo imediatamente
    await this.redis.del(`group:details:${groupId}`);

    return { message: 'Palpites do Oráculo salvos com sucesso!' };
  }
}
