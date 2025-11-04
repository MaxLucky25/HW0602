import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../../core/database/database.service';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogSortBy } from '../../api/input-dto/blog-sort-by';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { RawBlogRow } from '../../../../../core/database/types/sql.types';

@Injectable()
export class BlogQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const query = `
      SELECT * FROM blogs 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.databaseService.query<RawBlogRow>(query, [id]);

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
        field: 'blog',
      });
    }

    return BlogViewDto.mapToView(result.rows[0]);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const searchNameTerm = query.searchNameTerm || null;

    // Маппинг полей для PostgresSQL
    const orderBy =
      query.sortBy === BlogSortBy.CreateAt ? 'created_at' : query.sortBy;
    const direction = query.sortDirection.toUpperCase();

    const limit = query.pageSize;
    const offset = query.calculateSkip();

    // Строим WHERE условия динамически
    let whereConditions = 'WHERE deleted_at IS NULL';
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (searchNameTerm) {
      whereConditions += ` AND name ILIKE $${paramIndex}`;
      queryParams.push(`%${searchNameTerm}%`);
      paramIndex++;
    }

    const blogsQuery = `
      SELECT * FROM blogs 
      ${whereConditions}
      ORDER BY ${orderBy} ${direction}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM blogs 
      ${whereConditions}
    `;

    // Добавляем limit и offset к параметрам для blogsQuery
    const blogsQueryParams = [...queryParams, limit, offset];

    const [blogsResult, countResult] = await Promise.all([
      this.databaseService.query<RawBlogRow>(blogsQuery, blogsQueryParams),
      this.databaseService.query<{ count: string }>(countQuery, queryParams),
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const items = blogsResult.rows.map((blog) => BlogViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
