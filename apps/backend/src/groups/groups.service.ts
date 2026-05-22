import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Geração de código único ──────────────────────────────────────────────
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;
    do {
      code = this.generateInviteCode();
      const found = await this.prisma.group.findUnique({ where: { inviteCode: code } });
      exists = !!found;
    } while (exists);
    return code;
  }

  // ─── Criar grupo ──────────────────────────────────────────────────────────
  async create(dto: CreateGroupDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.role !== 'ADMIN') {
      const ownedGroupsCount = await this.prisma.group.count({
        where: { ownerId: userId },
      });

      if (ownedGroupsCount >= 3) {
        throw new ForbiddenException(
          'Limite excedido. Usuários normais podem criar no máximo 3 grupos.',
        );
      }
    }

    const inviteCode = await this.generateUniqueCode();

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        inviteCode,
        ownerId: userId,
        members: {
          create: { userId },
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        _count: { select: { members: true } },
      },
    });

    return group;
  }

  // ─── Listar grupos do usuário ─────────────────────────────────────────────
  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, name: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const owned: typeof memberships[0]['group'][] = [];
    const joined: typeof memberships[0]['group'][] = [];

    for (const m of memberships) {
      if (m.group.ownerId === userId) {
        owned.push(m.group);
      } else {
        joined.push(m.group);
      }
    }

    return { owned, joined };
  }

  // ─── Buscar grupo por código (preview) ────────────────────────────────────
  async lookupByCode(code: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: code.toUpperCase() },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado com este código');

    const alreadyMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    return {
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      maxMembers: group.maxMembers,
      memberCount: group._count.members,
      owner: group.owner,
      isFull: group._count.members >= group.maxMembers,
      alreadyMember: !!alreadyMember,
    };
  }

  // ─── Entrar em grupo pelo código ──────────────────────────────────────────
  async join(dto: JoinGroupDto, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: dto.code.toUpperCase() },
      include: { _count: { select: { members: true } } },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado com este código');

    const alreadyMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (alreadyMember) throw new ConflictException('Você já faz parte deste grupo');

    if (group._count.members >= group.maxMembers) {
      throw new BadRequestException('Este grupo já atingiu o limite máximo de participantes');
    }

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId },
    });

    await this.redis.del(`group:details:${group.id}`);

    return { message: 'Você entrou no grupo com sucesso!', groupId: group.id, groupName: group.name };
  }

  // ─── Buscar detalhes de um grupo por ID ───────────────────────────────────
  async getGroupById(groupId: string, userId: string) {
    const cacheKey = `group:details:${groupId}`;
    const cachedGroup = await this.redis.get<any>(cacheKey);
    if (cachedGroup) {
      const isMember = cachedGroup.members.some((m: any) => m.userId === userId);
      if (!isMember) throw new ForbiddenException('Você não faz parte deste grupo');
      return cachedGroup;
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Você não faz parte deste grupo');

    // 1. Check if group stage is completely finished
    const pendingGroupMatches = await this.prisma.match.count({
      where: {
        stage: { startsWith: 'Fase de Grupos' },
        status: 'PENDING',
      },
    });
    const isGroupStageFinished = pendingGroupMatches === 0;

    let sortedStandings: Record<string, any[]> = {};
    let bestThirdTeams = new Set<string>();
    let qualifiedTeams = new Set<string>();

    if (isGroupStageFinished) {
      // 1.1 Fetch all matches of group stage
      const matches = await this.prisma.match.findMany({
        where: { stage: { startsWith: 'Fase de Grupos' } },
        include: { homeTeam: true, awayTeam: true },
      });

      // 1.2 Fetch all teams
      const teams = await this.prisma.team.findMany({
        where: { group: { not: null } },
      });

      // 1.3 Group standings map
      const standingsMap: Record<string, Record<string, any>> = {};

      teams.forEach((t) => {
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

      // Collect 3rd placed teams
      const thirdPlacedTeams: any[] = [];
      Object.keys(sortedStandings).forEach((g) => {
        const list = sortedStandings[g];
        if (list.length >= 3) {
          thirdPlacedTeams.push(list[2]);
        }
      });

      // Sort third placed teams to find the 8 best
      thirdPlacedTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
      });

      thirdPlacedTeams.slice(0, 8).forEach((t) => bestThirdTeams.add(t.code));

      // Build qualified teams set
      Object.keys(sortedStandings).forEach((g) => {
        const list = sortedStandings[g];
        if (list.length >= 1) qualifiedTeams.add(list[0].code);
        if (list.length >= 2) qualifiedTeams.add(list[1].code);
      });
      bestThirdTeams.forEach((code) => qualifiedTeams.add(code));
    }

    // 2. Calcula os pontos reais acumulados para cada membro baseado em suas predições e Oráculo
    const membersWithPoints = await Promise.all(
      group.members.map(async (member) => {
        const pointsAggregate = await this.prisma.matchPrediction.aggregate({
          where: { userId: member.userId, groupId },
          _sum: { points: true },
        });

        let oraclePoints = 0;
        if (isGroupStageFinished) {
          // Calculate Oracle points for this user in this group
          const oraclePredictions = await this.prisma.oraclePrediction.findMany({
            where: { groupId, userId: member.userId },
          });

          oraclePredictions.forEach((pred) => {
            const gKey = pred.groupName.replace('Grupo ', '');
            const actualList = sortedStandings[gKey];
            if (!actualList || actualList.length < 4) return;

            const predList = pred.teamOrder.split(',');
            if (predList.length < 4) return;

            // 1st place prediction
            if (predList[0] === actualList[0].code) {
              oraclePoints += 3;
            }

            // 2nd place prediction
            if (predList[1] === actualList[1].code) {
              oraclePoints += 3;
            }

            // 3rd place prediction
            if (predList[2] === actualList[2].code) {
              oraclePoints += 3;
            }

            // 4th place prediction
            if (predList[3] === actualList[3].code) {
              oraclePoints += 3;
            }
          });
        }

        const matchPoints = pointsAggregate._sum.points || 0;

        return {
          ...member,
          points: matchPoints + oraclePoints,
          matchPoints,
          oraclePoints,
        };
      }),
    );

    // Sort members by points desc, then by name asc
    membersWithPoints.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.user.name.localeCompare(b.user.name);
    });

    // Busca todas as previsões de jogos feitas pelos membros do grupo
    const memberIds = group.members.map((m) => m.userId);
    const predictions = await this.prisma.matchPrediction.findMany({
      where: { userId: { in: memberIds }, groupId },
      select: {
        userId: true,
        matchId: true,
        homeScore: true,
        awayScore: true,
        points: true,
        user: { select: { name: true } },
      },
    });

    const result = {
      ...group,
      isGroupStageFinished,
      members: membersWithPoints,
      predictions,
    };

    await this.redis.set(cacheKey, result, 3600); // cache de 1 hora

    return result;
  }

  // ─── Sair de um grupo ─────────────────────────────────────────────────────
  async leave(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    if (group.ownerId === userId) {
      throw new ForbiddenException(
        'O criador do grupo não pode sair. Delete o grupo para encerrá-lo.',
      );
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new NotFoundException('Você não faz parte deste grupo');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    await this.redis.del(`group:details:${groupId}`);

    return { message: 'Você saiu do grupo com sucesso' };
  }

  // ─── Deletar grupo (somente dono) ─────────────────────────────────────────
  async deleteGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    if (group.ownerId !== userId) throw new ForbiddenException('Apenas o criador pode deletar o grupo');

    await this.prisma.group.delete({ where: { id: groupId } });
    await this.redis.del(`group:details:${groupId}`);

    return { message: 'Grupo deletado com sucesso' };
  }

  // ─── Remover membro (somente dono) ──────────────────────────────────────────
  async removeMember(groupId: string, memberId: string, ownerId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    if (group.ownerId !== ownerId) {
      throw new ForbiddenException('Apenas o criador do grupo pode remover membros');
    }
    if (memberId === ownerId) {
      throw new BadRequestException('Você não pode se remover do grupo. Delete o grupo para encerrá-lo.');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
    });
    if (!membership) throw new NotFoundException('O usuário não faz parte deste grupo');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberId } },
    });

    await this.redis.del(`group:details:${groupId}`);

    return { message: 'Membro removido com sucesso' };
  }
}
