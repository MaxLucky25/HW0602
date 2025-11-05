import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../../core/database/database.service';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { RawCommentRow } from '../../../../../core/database/types/sql.types';
import { LikeStatus } from '../../api/input-dto/comment-like.domain.dto';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/extended-likes-info.view-dto';
import { COMMENT_SORT_FIELD_MAP } from '../../api/input-dto/comment-sort-by';
import { FindPostByIdDto } from '../../../posts/domain/dto/post.domain.dto';

@Injectable()
export class CommentQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getByIdNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<RawCommentRow & { commentator_login: string }> {
    const query = `
      SELECT c.*, u.login as commentator_login
      FROM comments c
      JOIN users u ON c.commentator_id = u.id
      JOIN posts p ON c.post_id = p.id
      JOIN blogs b ON p.blog_id = b.id
      WHERE c.id = $1 AND c.deleted_at IS NULL AND p.deleted_at IS NULL AND b.deleted_at IS NULL
    `;
    const result = await this.databaseService.query<
      RawCommentRow & { commentator_login: string }
    >(query, [id]);

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'Comment',
      });
    }

    return result.rows[0];
  }

  async getCommentsForPost(
    postId: FindPostByIdDto,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<(RawCommentRow & { commentator_login: string })[]> {
    const orderBy = COMMENT_SORT_FIELD_MAP[query.sortBy];
    const direction = query.sortDirection.toUpperCase();
    const limit = query.pageSize;
    const offset = query.calculateSkip();

    const sqlQuery = `
      SELECT c.*, u.login as commentator_login
      FROM comments c
      JOIN users u ON c.commentator_id = u.id
      JOIN posts p ON c.post_id = p.id
      JOIN blogs b ON p.blog_id = b.id
      WHERE c.post_id = $1 AND c.deleted_at IS NULL AND p.deleted_at IS NULL AND b.deleted_at IS NULL
      ORDER BY ${orderBy} ${direction}
      LIMIT $2 OFFSET $3
    `;

    const result = await this.databaseService.query<
      RawCommentRow & { commentator_login: string }
    >(sqlQuery, [postId, limit, offset]);

    return result.rows;
  }

  async getTotalCountForPost(postId: FindPostByIdDto): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      JOIN blogs b ON p.blog_id = b.id
      WHERE c.post_id = $1 AND c.deleted_at IS NULL AND p.deleted_at IS NULL AND b.deleted_at IS NULL
    `;
    const result = await this.databaseService.query<{ total: string }>(query, [
      postId,
    ]);
    return parseInt(result.rows[0].total, 10);
  }

  async getLikesForComments(
    commentIds: string[],
    userId?: string,
  ): Promise<Map<string, ExtendedLikesInfoViewDto>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const query = `
      SELECT 
        c.id as comment_id,
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(like_counts.dislikes_count, 0) as dislikes_count,
        COALESCE(user_like.status, 'None') as my_status
      FROM comments c
      LEFT JOIN (
        SELECT 
          comment_id,
          COUNT(CASE WHEN status = 'Like' THEN 1 END) as likes_count,
          COUNT(CASE WHEN status = 'Dislike' THEN 1 END) as dislikes_count
        FROM comment_likes 
        WHERE comment_id = ANY($1)
        GROUP BY comment_id
      ) like_counts ON c.id = like_counts.comment_id
      LEFT JOIN comment_likes user_like ON c.id = user_like.comment_id AND user_like.user_id = $2
      WHERE c.id = ANY($1) AND c.deleted_at IS NULL
    `;

    const result = await this.databaseService.query<{
      comment_id: string;
      likes_count: number;
      dislikes_count: number;
      my_status: string;
    }>(query, [commentIds, userId || null]);

    const likesMap = new Map<string, ExtendedLikesInfoViewDto>();

    for (const row of result.rows) {
      likesMap.set(row.comment_id, {
        likesCount: Number(row.likes_count),
        dislikesCount: Number(row.dislikes_count),
        myStatus: row.my_status as LikeStatus,
      });
    }

    return likesMap;
  }

  async getExtendedLikesInfo(
    commentId: string,
    userId?: string,
  ): Promise<ExtendedLikesInfoViewDto> {
    const likesMap = await this.getLikesForComments([commentId], userId);
    const likesInfo = likesMap.get(commentId);

    if (!likesInfo) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'Comment',
      });
    }

    return likesInfo;
  }
}
