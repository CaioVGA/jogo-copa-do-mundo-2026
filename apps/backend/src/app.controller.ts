import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
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
      },
    });
  }
}
