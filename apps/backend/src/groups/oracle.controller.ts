import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OracleService } from './oracle.service';
import { SaveOracleDto } from './dto/save-oracle.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  // GET /api/groups/:id/oracle
  @Get(':id/oracle')
  getOracleData(@Param('id') groupId: string, @Request() req: any) {
    return this.oracleService.getOracleData(groupId, req.user.id);
  }

  // POST /api/groups/:id/oracle
  @Post(':id/oracle')
  saveOracleData(
    @Param('id') groupId: string,
    @Body() dto: SaveOracleDto,
    @Request() req: any,
  ) {
    return this.oracleService.saveOracleData(groupId, req.user.id, dto);
  }
}
