import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { RawPostLikeRow } from '../../../../core/database/types/sql.types';
import {
  CreatePostLikeDomainDto,
  FindPostLikeDto,
  UpdatePostLikeStatusDto,
} from '../api/input-dto/likesPost/post-like.domain.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PostLikeRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createReaction(dto: CreatePostLikeDomainDto): Promise<RawPostLikeRow> {
    const id = randomUUID();

    const query = `
      INSERT INTO post_likes (id, user_id, post_id, status, added_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await this.databaseService.query<RawPostLikeRow>(query, [
      id,
      dto.userId,
      dto.postId,
      dto.status,
    ]);

    return result.rows[0];
  }

  async findUserReaction(dto: FindPostLikeDto): Promise<RawPostLikeRow | null> {
    const query = `
      SELECT * FROM post_likes 
      WHERE user_id = $1 AND post_id = $2
    `;

    const result = await this.databaseService.query<RawPostLikeRow>(query, [
      dto.userId,
      dto.postId,
    ]);

    return result.rows[0] || null;
  }

  async updateReactionStatus(
    dto: UpdatePostLikeStatusDto,
  ): Promise<RawPostLikeRow | null> {
    const query = `
      UPDATE post_likes 
      SET status = $3, added_at = NOW()
      WHERE user_id = $1 AND post_id = $2
      RETURNING *
    `;

    const result = await this.databaseService.query<RawPostLikeRow>(query, [
      dto.userId,
      dto.postId,
      dto.newStatus,
    ]);

    return result.rows[0] || null;
  }

  async removeReaction(dto: FindPostLikeDto): Promise<boolean> {
    const query = `
      DELETE FROM post_likes 
      WHERE user_id = $1 AND post_id = $2
    `;

    const result = await this.databaseService.query(query, [
      dto.userId,
      dto.postId,
    ]);

    return (result.rowCount || 0) > 0;
  }
}
