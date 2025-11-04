import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { TableInfo, TruncateResult } from '../../core/database/types/sql.types';

@Injectable()
export class TestingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllTables(): Promise<string[]> {
    const result = await this.databaseService.query<TableInfo>(`
      -- language=SQL
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    return result.rows.map((row: TableInfo) => row.table_name);
  }

  async clearAllTables(): Promise<void> {
    const tables = await this.getAllTables();

    if (tables.length === 0) {
      return;
    }

    const promises = tables.map((table) =>
      this.databaseService.query<TruncateResult>(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`,
      ),
    );

    await Promise.all(promises);
  }
}
