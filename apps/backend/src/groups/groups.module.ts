import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PredictionsService } from '../predictions/predictions.service';

@Module({
  imports: [PrismaModule],
  controllers: [GroupsController, OracleController],
  providers: [GroupsService, OracleService, PredictionsService],
})
export class GroupsModule {}
