import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOracleDto } from './dto/save-oracle.dto';

@Injectable()
export class OracleService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      groups: grouped,
      hasPredictions: savedPredictions.length > 0,
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

    return { message: 'Palpites do Oráculo salvos com sucesso!' };
  }
}
