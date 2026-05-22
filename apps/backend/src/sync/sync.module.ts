import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../prisma/redis.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [PrismaModule, RedisModule, PredictionsModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
