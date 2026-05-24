import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { PredictionsService } from '../predictions/predictions.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SavePredictionsDto } from '../predictions/dto/save-predictions.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly predictionsService: PredictionsService,
  ) {}

  // POST /api/groups
  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req: any) {
    return this.groupsService.create(dto, req.user.id);
  }

  // GET /api/groups/my
  @Get('my')
  getMyGroups(@Request() req: any) {
    return this.groupsService.getMyGroups(req.user.id);
  }

  // GET /api/groups/lookup?code=XXXXXXXX
  @Get('lookup')
  lookupByCode(@Query('code') code: string, @Request() req: any) {
    return this.groupsService.lookupByCode(code, req.user.id);
  }

  // POST /api/groups/join
  @Post('join')
  join(@Body() dto: JoinGroupDto, @Request() req: any) {
    return this.groupsService.join(dto, req.user.id);
  }

  // GET /api/groups/:id/predictions  ← NEW: group-scoped predictions
  @Get(':id/predictions')
  getPredictions(@Param('id') groupId: string, @Request() req: any) {
    return this.predictionsService.getPredictions(req.user.id, groupId);
  }

  // POST /api/groups/:id/predictions  ← NEW: save group-scoped predictions
  @Post(':id/predictions')
  savePredictions(
    @Param('id') groupId: string,
    @Body() dto: SavePredictionsDto,
    @Request() req: any,
  ) {
    // Ensure the groupId from the URL is used (ignore body groupId if different)
    dto.groupId = groupId;
    return this.predictionsService.savePredictions(req.user.id, dto);
  }

  // DELETE /api/groups/:id/leave
  @Delete(':id/leave')
  leave(@Param('id') groupId: string, @Request() req: any) {
    return this.groupsService.leave(groupId, req.user.id);
  }

  // GET /api/groups/:id
  @Get(':id')
  getGroupById(@Param('id') groupId: string, @Request() req: any) {
    return this.groupsService.getGroupById(groupId, req.user.id);
  }

  // DELETE /api/groups/:id
  @Delete(':id')
  deleteGroup(@Param('id') groupId: string, @Request() req: any) {
    return this.groupsService.deleteGroup(groupId, req.user.id);
  }

  // DELETE /api/groups/:id/members/:memberId
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
    @Request() req: any
  ) {
    return this.groupsService.removeMember(groupId, memberId, req.user.id);
  }

  // PUT /api/groups/:id
  @Put(':id')
  updateGroup(
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Request() req: any,
  ) {
    return this.groupsService.updateGroup(groupId, dto, req.user.id);
  }

  // PATCH /api/groups/:id/members/:memberId/paid
  @Patch(':id/members/:memberId/paid')
  toggleMemberPaid(
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
    @Body('paid') paid: boolean,
    @Request() req: any,
  ) {
    return this.groupsService.toggleMemberPaid(groupId, memberId, paid, req.user.id);
  }

  // PUT /api/groups/:id/predictions/awards
  @Put(':id/predictions/awards')
  saveIndividualAwards(
    @Param('id') groupId: string,
    @Body() dto: { topScorer?: string; assistLeader?: string; bestPlayer?: string },
    @Request() req: any,
  ) {
    return this.groupsService.saveIndividualAwards(groupId, req.user.id, dto);
  }
}
