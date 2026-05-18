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
import { PredictionsService } from './predictions.service';
import { SavePredictionsDto, UpdateMatchScoreDto } from './dto/save-predictions.dto';

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  getPredictions(@Request() req: any) {
    return this.predictionsService.getPredictions(req.user.id);
  }

  @Post()
  savePredictions(@Body() dto: SavePredictionsDto, @Request() req: any) {
    return this.predictionsService.savePredictions(req.user.id, dto);
  }

  @Post('matches/:id/score')
  updateMatchScore(
    @Param('id') id: string,
    @Body() dto: UpdateMatchScoreDto,
    @Request() req: any,
  ) {
    return this.predictionsService.updateMatchScore(req.user.id, id, dto.homeScore, dto.awayScore);
  }
}
