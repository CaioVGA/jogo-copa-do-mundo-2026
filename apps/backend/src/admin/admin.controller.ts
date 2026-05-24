import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /api/admin/awards — resultados de premiações globais
  @Get('awards')
  getGlobalAwardResults(@Request() req: any) {
    return this.adminService.getGlobalAwardResults(req.user.id);
  }

  // PUT /api/admin/awards — salvar resultados oficiais de premiações globais
  @Put('awards')
  setGlobalAwardResults(
    @Request() req: any,
    @Body()
    dto: {
      topScorerResult?: string;
      assistLeaderResult?: string;
      bestPlayerResult?: string;
    },
  ) {
    return this.adminService.setGlobalAwardResults(req.user.id, dto);
  }

  // POST /api/admin/awards/compute — calcular pontos de todos os grupos
  @Post('awards/compute')
  computeAllAwards(@Request() req: any) {
    return this.adminService.computeAwardsForAllGroups(req.user.id);
  }
}
