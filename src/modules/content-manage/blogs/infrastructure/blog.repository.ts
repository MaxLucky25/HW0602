import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreateBlogDomainDto,
  FindByIdDto,
} from '../api/input-dto/blog.domain.dto';
import { RawBlogRow } from '../../../../core/database/types/sql.types';
import { randomUUID } from 'crypto';

@Injectable()
export class BlogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(dto: FindByIdDto): Promise<RawBlogRow | null> {
    const query = ` 
      SELECT * FROM blogs 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.databaseService.query<RawBlogRow>(query, [
      dto.id,
    ]);
    return result.rows[0] || null;
  }

  async findOrNotFoundFail(id: FindByIdDto): Promise<RawBlogRow> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        field: 'Blog',
      });
    }

    return blog;
  }

  async createBlog(dto: CreateBlogDomainDto): Promise<RawBlogRow> {
    const blogId = randomUUID();
    const query = `
      INSERT INTO blogs (
        id, name, description, website_url, is_membership,
        created_at, deleted_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), $6
      )
      RETURNING *
    `;
    const result = await this.databaseService.query<RawBlogRow>(query, [
      blogId,
      dto.name,
      dto.description,
      dto.websiteUrl,
      false, // is_membership
      null, // deleted_at
    ]);
    return result.rows[0];
  }

  async updateBlog(id: string, dto: CreateBlogDomainDto): Promise<RawBlogRow> {
    const query = `
      UPDATE blogs 
      SET name = $2, description = $3, website_url = $4
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.databaseService.query<RawBlogRow>(query, [
      id,
      dto.name,
      dto.description,
      dto.websiteUrl,
    ]);
    return result.rows[0];
  }

  async deleteBlog(id: string): Promise<RawBlogRow> {
    const query = `
      UPDATE blogs 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.databaseService.query<RawBlogRow>(query, [id]);
    return result.rows[0];
  }
}
