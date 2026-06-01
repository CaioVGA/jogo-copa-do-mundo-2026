import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './prisma/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('teams')
  async getTeams() {
    return this.prisma.team.findMany({
      select: {
        code: true,
        name: true,
        flag: true,
        group: true,
      },
    });
  }

  @Get('players')
  async getPlayers() {
    const cacheKey = 'all_players';
    const cachedPlayers = await this.redis.get(cacheKey);
    if (cachedPlayers) {
      return cachedPlayers;
    }

    const players = await this.prisma.player.findMany({
      include: {
        team: {
          select: {
            name: true,
            code: true,
            flag: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Cache para 24 horas (86400 segundos)
    await this.redis.set(cacheKey, players, 86400);

    return players;
  }
}
