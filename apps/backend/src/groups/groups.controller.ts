import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

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
}
