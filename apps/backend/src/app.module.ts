import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { AdminModule } from './admin/admin.module';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validateEnv(env: Record<string, string | undefined>) {
  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must have at least 32 characters');
  }
  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parsePositiveInt(process.env.THROTTLE_TTL_MS, 60_000),
          limit: parsePositiveInt(process.env.THROTTLE_LIMIT, 120),
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    PredictionsModule,
    SyncModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
