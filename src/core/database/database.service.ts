import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false, // Для Neon
      },
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();
    try {
      return client.query(text, params);
    } finally {
      client.release();
    }
  }
}
