import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';

const AWARD_POINTS = 15;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Verificar se o usuário é admin ────────────────────────────────────────
  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar os resultados das premiações.',
      );
    }
  }

  // ─── Obter resultados de premiações globais ─────────────────────────────────
  async getGlobalAwardResults(userId: string) {
    await this.assertAdmin(userId);

    // Find any group to read the results from (since they are all identical)
    const group = await this.prisma.group.findFirst({
      select: {
        topScorerResult: true,
        assistLeaderResult: true,
        bestPlayerResult: true,
      },
    });

    return group || {
      topScorerResult: null,
      assistLeaderResult: null,
      bestPlayerResult: null,
    };
  }

  // ─── Definir resultados de premiações globais ──────────────────────────────
  async setGlobalAwardResults(
    userId: string,
    dto: {
      topScorerResult?: string;
      assistLeaderResult?: string;
      bestPlayerResult?: string;
    },
  ) {
    await this.assertAdmin(userId);

    // Update ALL groups in the database globally
    await this.prisma.group.updateMany({
      data: {
        topScorerResult: dto.topScorerResult ?? null,
        assistLeaderResult: dto.assistLeaderResult ?? null,
        bestPlayerResult: dto.bestPlayerResult ?? null,
        awardsComputed: false, // Reset flag for all groups to allow recalculation
      },
    });

    // Invalidate the cache for all groups since they were all updated
    await this.redis.delByPattern('group:details:*');

    // Trigger points calculation for all groups automatically when results are saved!
    const calcResult = await this.computeAwardsForAllGroups();
    const autoComputed = true;
    const computedCount = calcResult.totalUpdated;

    return {
      message: `Resultados salvos e pontos calculados para todos os grupos (${computedCount} membros atualizados).`,
      results: {
        topScorerResult: dto.topScorerResult ?? null,
        assistLeaderResult: dto.assistLeaderResult ?? null,
        bestPlayerResult: dto.bestPlayerResult ?? null,
      },
      autoComputed,
      computedCount,
    };
  }

  // ─── Calcular pontos de premiações para TODOS os grupos ───────────────────
  async computeAwardsForAllGroups(userId?: string) {
    if (userId) {
      await this.assertAdmin(userId);
    }

    const groups = await this.prisma.group.findMany({
      where: {
        awardsComputed: false,
        NOT: {
          topScorerResult: null,
          assistLeaderResult: null,
          bestPlayerResult: null,
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

    let totalUpdated = 0;
    let groupsComputed = 0;

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
      groupsComputed++;
    }

    return {
      message: `Pontos de premiações calculados para ${groupsComputed} grupos (${totalUpdated} membros atualizados).`,
      groupsComputed,
      totalUpdated,
    };
  }
}
