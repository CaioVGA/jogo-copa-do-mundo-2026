import { Controller, Get, Post, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('admin/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem gerenciar a sincronização da API.');
    }
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    this.checkAdmin(req);
    return this.syncService.getSyncStatus();
  }

  @Post('map')
  async mapMatches(@Request() req: any) {
    this.checkAdmin(req);
    return this.syncService.mapMatches();
  }

  @Post('scores')
  async syncScores(@Request() req: any) {
    this.checkAdmin(req);
    return this.syncService.syncScores(true); // Força sincronização independente da janela de otimização
  }
}
