import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

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
        members: { include: { user: { select: { id: true, name: true } } } },
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

    return { message: 'Você entrou no grupo com sucesso!', groupId: group.id, groupName: group.name };
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

    return { message: 'Você saiu do grupo com sucesso' };
  }

  // ─── Deletar grupo (somente dono) ─────────────────────────────────────────
  async deleteGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    if (group.ownerId !== userId) throw new ForbiddenException('Apenas o criador pode deletar o grupo');

    await this.prisma.group.delete({ where: { id: groupId } });
    return { message: 'Grupo deletado com sucesso' };
  }
}
