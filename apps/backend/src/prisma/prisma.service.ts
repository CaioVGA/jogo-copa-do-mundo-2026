import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl =
      configService.get<string>('DATABASE_URL') ||
      'postgresql://copa2026:postgres@localhost:5432/copa2026?schema=public';
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

