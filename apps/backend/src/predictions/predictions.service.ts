import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { SavePredictionsDto } from './dto/save-predictions.dto';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMatches() {
    const matches = await this.prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: 'asc' },
    });

    const grouped: Record<string, any[]> = {};

    matches.forEach((match) => {
      const mappedMatch = {
        id: match.id,
        date: match.date,
        stadium: match.stadium,
        city: match.city,
        stage: match.stage,
        status: match.status,
        realHomeScore: match.homeScore,
        realAwayScore: match.awayScore,
        predictedHomeScore: null,
        predictedAwayScore: null,
        pointsEarned: 0,
        homeTeam: match.homeTeam
          ? { name: match.homeTeam.name, code: match.homeTeam.code, flag: match.homeTeam.flag, group: match.homeTeam.group }
          : { name: match.homeTeamName || 'TBD', code: 'TBD', flag: null, group: null },
        awayTeam: match.awayTeam
          ? { name: match.awayTeam.name, code: match.awayTeam.code, flag: match.awayTeam.flag, group: match.awayTeam.group }
          : { name: match.awayTeamName || 'TBD', code: 'TBD', flag: null, group: null },
      };

      let groupName = match.stage || 'Fase Final';
      if (match.stage && match.stage.startsWith('Fase de Grupos') && match.homeTeam?.group) {
        groupName = `Grupo ${match.homeTeam.group}`;
      }

      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(mappedMatch);
    });

    return grouped;
  }

  async getPredictions(userId: string, groupId: string) {
    // 0. Verify user is member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo.');
    }

    // 1. Fetch all matches with teams
    const matches = await this.prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 2. Fetch all predictions by this user in this group
    const userPredictions = await this.prisma.matchPrediction.findMany({
      where: { userId, groupId },
    });

    // Create a map for fast lookup
    const predictionMap = new Map<string, typeof userPredictions[0]>();
    userPredictions.forEach((p) => {
      predictionMap.set(p.matchId, p);
    });

    // 3. Map matches with predictions and group them by group letter
    const grouped: Record<string, any[]> = {};

    matches.forEach((match) => {
      const pred = predictionMap.get(match.id);
      const mappedMatch = {
        id: match.id,
        date: match.date,
        stadium: match.stadium,
        city: match.city,
        stage: match.stage,
        status: match.status,
        realHomeScore: match.homeScore,
        realAwayScore: match.awayScore,
        predictedHomeScore: pred ? pred.homeScore : null,
        predictedAwayScore: pred ? pred.awayScore : null,
        pointsEarned: pred ? pred.points : 0,
        homeTeam: match.homeTeam ? {
          name: match.homeTeam.name,
          code: match.homeTeam.code,
          flag: match.homeTeam.flag,
          group: match.homeTeam.group,
        } : {
          name: match.homeTeamName || 'TBD',
          code: 'TBD',
          flag: null,
          group: null,
        },
        awayTeam: match.awayTeam ? {
          name: match.awayTeam.name,
          code: match.awayTeam.code,
          flag: match.awayTeam.flag,
          group: match.awayTeam.group,
        } : {
          name: match.awayTeamName || 'TBD',
          code: 'TBD',
          flag: null,
          group: null,
        },
      };

      // Determine group name
      let groupName = match.stage || 'Fase Final';
      if (match.stage && match.stage.startsWith('Fase de Grupos') && match.homeTeam?.group) {
        groupName = `Grupo ${match.homeTeam.group}`;
      }

      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(mappedMatch);
    });

    return grouped;
  }

  async savePredictions(userId: string, dto: SavePredictionsDto) {
    const { groupId } = dto;
    const now = new Date();

    // 0. Verify user is member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo.');
    }

    for (const pred of dto.predictions) {
      // Find match and verify if it exists and is open for predictions
      const match = await this.prisma.match.findUnique({
        where: { id: pred.matchId },
      });

      if (!match) {
        throw new BadRequestException(`Partida com ID ${pred.matchId} não encontrada.`);
      }

      // Security rule: block predictions if the match has already started
      if (new Date(match.date) <= now || match.status !== 'PENDING') {
        throw new ForbiddenException(
          `Não é permitido palpitar na partida entre ${match.homeTeamName || 'Time A'} e ${
            match.awayTeamName || 'Time B'
          } pois ela já iniciou ou foi encerrada.`
        );
      }

      // Upsert prediction scoped to group
      await this.prisma.matchPrediction.upsert({
        where: {
          userId_matchId_groupId: {
            userId,
            matchId: pred.matchId,
            groupId,
          },
        },
        update: {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
        create: {
          userId,
          matchId: pred.matchId,
          groupId,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
      });
    }

    // Invalida cache do grupo específico para atualizar o ranking em tempo real
    await this.redis.del(`group:details:${groupId}`);

    return { success: true, message: 'Palpites salvos com sucesso!' };
  }

  private calculatePredictionPoints(
    realHome: number,
    realAway: number,
    predHome: number,
    predAway: number,
  ): number {
    const exactMatch = (predHome === realHome) && (predAway === realAway);
    if (exactMatch) {
      return 5;
    }

    const realWinner = realHome > realAway ? 1 : realHome < realAway ? -1 : 0;
    const predWinner = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;

    if (realWinner === predWinner) {
      const matchedHomeGoals = predHome === realHome;
      const matchedAwayGoals = predAway === realAway;
      if (matchedHomeGoals || matchedAwayGoals) {
        return 4;
      } else {
        return 3;
      }
    } else {
      const matchedHomeGoals = predHome === realHome;
      const matchedAwayGoals = predAway === realAway;
      if (matchedHomeGoals || matchedAwayGoals) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  async updateMatchScore(userId: string, matchId: string, homeScore: number, awayScore: number) {
    // 1. Verify if user is an ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem atualizar o placar das partidas.');
    }

    // 2. Find and update match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('Partida não encontrada.');
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status: 'FINISHED',
      },
    });

    // 3. Score ALL predictions for this match across all groups
    const predictions = await this.prisma.matchPrediction.findMany({
      where: { matchId },
    });

    for (const pred of predictions) {
      const points = this.calculatePredictionPoints(homeScore, awayScore, pred.homeScore, pred.awayScore);
      await this.prisma.matchPrediction.update({
        where: { id: pred.id },
        data: { points },
      });
    }

    // Invalida todos os caches de grupos globalmente porque os placares e pontuações mudaram
    await this.redis.delByPattern('group:details:*');

    return { success: true, message: 'Placar atualizado e pontos calculados com sucesso!' };
  }
}
