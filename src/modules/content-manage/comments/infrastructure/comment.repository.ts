import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { RawCommentRow } from '../../../../core/database/types/sql.types';
import { randomUUID } from 'crypto';
import {
  CreateCommentDomainDto,
  FindCommentByIdDto,
} from '../api/input-dto/comment.domain.dto';

@Injectable()
export class CommentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(dto: FindCommentByIdDto): Promise<RawCommentRow | null> {
    const query = `
      SELECT * FROM comments 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.databaseService.query<RawCommentRow>(query, [
      dto.id,
    ]);
    return result.rows[0] || null;
  }

  async findOrNotFoundFail(id: FindCommentByIdDto): Promise<RawCommentRow> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'Comment',
      });
    }

    return comment;
  }

  async createComment(
    dto: CreateCommentDomainDto,
  ): Promise<RawCommentRow & { commentator_login: string }> {
    const commentId = randomUUID();
    const query = `
      WITH inserted_comment AS (
        INSERT INTO comments (
          id, content, post_id, commentator_id,
          created_at, deleted_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
      )
      SELECT c.*, u.login as commentator_login
      FROM inserted_comment c
      JOIN users u ON c.commentator_id = u.id
    `;
    const result = await this.databaseService.query<
      RawCommentRow & { commentator_login: string }
    >(query, [
      commentId,
      dto.content,
      dto.postId,
      dto.commentatorId,
      null, // deleted_at
    ]);
    return result.rows[0];
  }

  async updateComment(
    id: string,
    dto: { content: string },
  ): Promise<RawCommentRow> {
    const query = `
      UPDATE comments 
      SET content = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.databaseService.query<RawCommentRow>(query, [
      id,
      dto.content,
    ]);
    return result.rows[0];
  }

  async deleteComment(id: string): Promise<RawCommentRow> {
    const query = `
      UPDATE comments 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.databaseService.query<RawCommentRow>(query, [id]);
    return result.rows[0];
  }
}
