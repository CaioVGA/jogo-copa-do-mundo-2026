import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavePredictionsDto } from './dto/save-predictions.dto';

@Injectable()
export class PredictionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPredictions(userId: string) {
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

    // 2. Fetch all predictions by this user
    const userPredictions = await this.prisma.matchPrediction.findMany({
      where: { userId },
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
      let groupName = 'Fase Final';
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
    const now = new Date();

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

      // Upsert prediction
      await this.prisma.matchPrediction.upsert({
        where: {
          userId_matchId: {
            userId,
            matchId: pred.matchId,
          },
        },
        update: {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
        create: {
          userId,
          matchId: pred.matchId,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
      });
    }

    return { success: true, message: 'Palpites salvos com sucesso!' };
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

    // 3. Fetch all predictions for this match and update points
    const predictions = await this.prisma.matchPrediction.findMany({
      where: { matchId },
    });

    for (const pred of predictions) {
      let points = 0;
      const predHome = pred.homeScore;
      const predAway = pred.awayScore;

      const exactMatch = (predHome === homeScore) && (predAway === awayScore);
      if (exactMatch) {
        points = 3;
      } else {
        const realWinner = homeScore > awayScore ? 1 : homeScore < awayScore ? -1 : 0;
        const predWinner = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
        if (realWinner === predWinner) {
          points = 1;
        }
      }

      await this.prisma.matchPrediction.update({
        where: { id: pred.id },
        data: { points },
      });
    }

    return { success: true, message: 'Placar atualizado e pontos calculados com sucesso!' };
  }
}
