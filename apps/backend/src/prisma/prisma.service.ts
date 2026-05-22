import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const host = configService.get<string>('POSTGRES_HOST') || 'localhost';
    const user = configService.get<string>('POSTGRES_USER') || 'copa2026';
    const password = configService.get<string>('POSTGRES_PASSWORD') || 'postgres';
    const db = configService.get<string>('POSTGRES_DB') || 'copa2026';
    const port = configService.get<string>('POSTGRES_PORT') || '5432';

    const databaseUrl =
      configService.get<string>('DATABASE_URL') ||
      `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (this.pool) {
      await this.pool.end();
    }
  }
}

