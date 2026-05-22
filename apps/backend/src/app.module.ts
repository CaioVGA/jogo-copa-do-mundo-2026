import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './prisma/redis.module';
import { MailModule } from './mail/mail.module';
import { GroupsModule } from './groups/groups.module';
import { PredictionsModule } from './predictions/predictions.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    PredictionsModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
