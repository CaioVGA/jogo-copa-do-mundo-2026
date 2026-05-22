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
import { UpdateMatchScoreDto } from './dto/save-predictions.dto';

// NOTE: GET /groups/:groupId/predictions and POST /groups/:groupId/predictions
// are now handled in GroupsController to keep the routing clean and group-scoped.
// This controller keeps the admin score update endpoint and the public matches endpoint.

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  // GET /api/predictions/matches — returns all matches grouped by stage, no personal predictions
  // Used by the dashboard for standings tables and match calendar
  @Get('matches')
  getMatches() {
    return this.predictionsService.getMatches();
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
