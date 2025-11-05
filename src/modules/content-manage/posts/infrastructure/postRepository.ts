import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { RawPostRow } from '../../../../core/database/types/sql.types';
import { randomUUID } from 'crypto';
import {
  CreatePostDomainDto,
  FindPostByIdDto,
} from '../domain/dto/post.domain.dto';

@Injectable()
export class PostRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(
    dto: FindPostByIdDto,
  ): Promise<(RawPostRow & { blog_name: string }) | null> {
    const query = `
      SELECT p.*, b.name as blog_name
      FROM posts p
      JOIN blogs b ON p.blog_id = b.id
      WHERE p.id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL
    `;
    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(query, [dto.id]);
    return result.rows[0] || null;
  }

  async findOrNotFoundFail(
    id: FindPostByIdDto,
  ): Promise<RawPostRow & { blog_name: string }> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    return post;
  }

  async createPost(
    dto: CreatePostDomainDto,
  ): Promise<RawPostRow & { blog_name: string }> {
    const postId = randomUUID();
    const query = `
      WITH inserted_post AS (
        INSERT INTO posts (
          id, title, short_description, content, blog_id,
          created_at, deleted_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), $6
        )
        RETURNING *
      )
      SELECT p.*, b.name as blog_name
      FROM inserted_post p
      JOIN blogs b ON p.blog_id = b.id
    `;
    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(query, [
      postId,
      dto.title,
      dto.shortDescription,
      dto.content,
      dto.blogId,
      null, // deleted_at
    ]);
    return result.rows[0];
  }

  async updatePost(
    id: string,
    dto: CreatePostDomainDto,
  ): Promise<RawPostRow & { blog_name: string }> {
    const query = `
      WITH updated_post AS (
        UPDATE posts 
        SET title = $2, short_description = $3, content = $4, blog_id = $5
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      )
      SELECT p.*, b.name as blog_name
      FROM updated_post p
      JOIN blogs b ON p.blog_id = b.id
    `;
    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(query, [id, dto.title, dto.shortDescription, dto.content, dto.blogId]);
    return result.rows[0];
  }

  async deletePost(
    id: string,
  ): Promise<(RawPostRow & { blog_name: string }) | null> {
    const query = `
      WITH deleted_post AS (
        UPDATE posts 
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      )
      SELECT p.*, b.name as blog_name
      FROM deleted_post p
      JOIN blogs b ON p.blog_id = b.id
    `;
    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(query, [id]);

    return result.rows[0] || null;
  }
}
