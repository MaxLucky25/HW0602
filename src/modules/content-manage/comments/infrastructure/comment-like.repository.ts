import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { RawCommentLikeRow } from '../../../../core/database/types/sql.types';
import { randomUUID } from 'crypto';
import {
  CreateCommentLikeDomainDto,
  FindCommentLikeDto,
  UpdateCommentLikeStatusDto,
} from '../api/input-dto/comment-like.domain.dto';

@Injectable()
export class CommentLikeRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserReaction(
    dto: FindCommentLikeDto,
  ): Promise<RawCommentLikeRow | null> {
    const query = `
      SELECT * FROM comment_likes 
      WHERE user_id = $1 AND comment_id = $2
    `;
    const result = await this.databaseService.query<RawCommentLikeRow>(query, [
      dto.userId,
      dto.commentId,
    ]);
    return result.rows[0] || null;
  }

  async createReaction(
    dto: CreateCommentLikeDomainDto,
  ): Promise<RawCommentLikeRow> {
    const id = randomUUID();
    const query = `
      INSERT INTO comment_likes (id, user_id, comment_id, status, added_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await this.databaseService.query<RawCommentLikeRow>(query, [
      id,
      dto.userId,
      dto.commentId,
      dto.status,
    ]);
    return result.rows[0];
  }

  async updateReactionStatus(
    dto: UpdateCommentLikeStatusDto,
  ): Promise<RawCommentLikeRow | null> {
    const query = `
      UPDATE comment_likes 
      SET status = $3, added_at = NOW()
      WHERE user_id = $1 AND comment_id = $2
      RETURNING *
    `;
    const result = await this.databaseService.query<RawCommentLikeRow>(query, [
      dto.userId,
      dto.commentId,
      dto.newStatus,
    ]);
    return result.rows[0] || null;
  }

  async removeReaction(dto: FindCommentLikeDto): Promise<boolean> {
    const query = `
      DELETE FROM comment_likes 
      WHERE user_id = $1 AND comment_id = $2
    `;
    const result = await this.databaseService.query(query, [
      dto.userId,
      dto.commentId,
    ]);
    return (result.rowCount || 0) > 0;
  }
}
