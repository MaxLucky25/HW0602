import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../../core/database/database.service';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { RawPostRow } from '../../../../../core/database/types/sql.types';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/likesPost/extended-likes-info.view-dto';
import { LikeStatus } from '../../api/input-dto/likesPost/like-status.enum';
import { POST_SORT_FIELD_MAP } from '../../api/input-dto/post-sort-by';
import { LikeDetailsViewDto } from '../../api/view-dto/likesPost/like-details.view-dto';

@Injectable()
export class PostQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getByIdNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<RawPostRow & { blog_name: string }> {
    const query = `
      SELECT p.*, b.name as blog_name
      FROM posts p
      JOIN blogs b ON p.blog_id = b.id
      WHERE p.id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL 
    `;
    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(query, [id]);

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    return result.rows[0]; // Возвращаем только данные из БД
  }

  async getAllPost(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<(RawPostRow & { blog_name: string })[]> {
    return this.getPosts(query, userId);
  }

  async getAllPostForBlog(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<(RawPostRow & { blog_name: string })[]> {
    return this.getPosts(query, userId, blogId);
  }

  private async getPosts(
    query: GetPostsQueryParams,
    userId?: string,
    blogId?: string,
  ): Promise<(RawPostRow & { blog_name: string })[]> {
    const { whereConditions, queryParams } = this.buildWhereConditions(
      query.searchTitleTerm || undefined,
      blogId,
    );

    const orderBy = POST_SORT_FIELD_MAP[query.sortBy];
    const direction = query.sortDirection.toUpperCase();
    const limit = query.pageSize;
    const offset = query.calculateSkip();

    const postsQuery = `
      SELECT p.*, b.name as blog_name
      FROM posts p
      JOIN blogs b ON p.blog_id = b.id
      ${whereConditions}
      ORDER BY ${orderBy} ${direction}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const postsQueryParams = [...queryParams, limit, offset];

    const result = await this.databaseService.query<
      RawPostRow & { blog_name: string }
    >(postsQuery, postsQueryParams);

    return result.rows; // Возвращаем только данные из БД
  }

  async getTotalCount(
    query: GetPostsQueryParams,
    blogId?: string,
  ): Promise<number> {
    const { whereConditions, queryParams } = this.buildWhereConditions(
      query.searchTitleTerm || undefined,
      blogId,
    );

    const countQuery = `
      SELECT COUNT(*)
      FROM posts p
      JOIN blogs b ON p.blog_id = b.id
      ${whereConditions}
    `;

    const result = await this.databaseService.query<{ count: string }>(
      countQuery,
      queryParams,
    );

    return parseInt(result.rows[0].count);
  }

  private buildWhereConditions(
    searchTitleTerm?: string,
    blogId?: string,
  ): { whereConditions: string; queryParams: (string | number)[] } {
    const conditions = ['p.deleted_at IS NULL', 'b.deleted_at IS NULL'];

    const queryParams: (string | number)[] = [];

    if (blogId) {
      conditions.push('p.blog_id = $1');
      queryParams.push(blogId);
    }

    if (searchTitleTerm) {
      const paramIndex = queryParams.length + 1;
      conditions.push(`p.title ILIKE $${paramIndex}`);
      queryParams.push(`%${searchTitleTerm}%`);
    }

    return {
      whereConditions: `WHERE ${conditions.join(' AND ')}`,
      queryParams,
    };
  }

  /**
   * Получает лайки для списка постов одним batch запросом
   */
  async getLikesForPosts(
    postIds: string[],
    userId?: string,
  ): Promise<Map<string, ExtendedLikesInfoViewDto>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const query = `
      SELECT 
        p.id as post_id,
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(like_counts.dislikes_count, 0) as dislikes_count,
        COALESCE(user_like.status, 'None') as my_status,
        COALESCE(newest_likes.newest_likes, '[]'::json) as newest_likes
      FROM posts p
      LEFT JOIN (
        SELECT 
          post_id,
          COUNT(CASE WHEN status = 'Like' THEN 1 END) as likes_count,
          COUNT(CASE WHEN status = 'Dislike' THEN 1 END) as dislikes_count
        FROM post_likes 
        WHERE post_id = ANY($1)
        GROUP BY post_id
      ) like_counts ON p.id = like_counts.post_id
      LEFT JOIN post_likes user_like ON p.id = user_like.post_id AND user_like.user_id = $2
      LEFT JOIN (
        SELECT 
          post_id,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'addedAt', added_at,
              'userId', user_id,
              'login', u.login
            ) ORDER BY added_at DESC
          ) as newest_likes
        FROM post_likes pl
        JOIN users u ON pl.user_id = u.id
        WHERE pl.status = 'Like' AND pl.post_id = ANY($1)
        GROUP BY post_id
      ) newest_likes ON p.id = newest_likes.post_id
      WHERE p.id = ANY($1) AND p.deleted_at IS NULL
    `;

    const result = await this.databaseService.query<{
      post_id: string;
      likes_count: number;
      dislikes_count: number;
      my_status: string;
      newest_likes: Array<{
        addedAt: string;
        userId: string;
        login: string;
      }>;
    }>(query, [postIds, userId || null]);

    const likesMap = new Map<string, ExtendedLikesInfoViewDto>();

    for (const row of result.rows) {
      const newestLikes: LikeDetailsViewDto[] = row.newest_likes
        .slice(0, 3)
        .map((like) => ({
          addedAt: like.addedAt,
          userId: like.userId,
          login: like.login,
        }));

      likesMap.set(row.post_id, {
        likesCount: Number(row.likes_count),
        dislikesCount: Number(row.dislikes_count),
        myStatus: row.my_status as LikeStatus,
        newestLikes,
      });
    }

    return likesMap;
  }

  /**
   * Получает расширенную информацию о лайках поста
   */
  async getExtendedLikesInfo(
    postId: string,
    userId?: string,
  ): Promise<ExtendedLikesInfoViewDto> {
    const query = `
      SELECT 
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(like_counts.dislikes_count, 0) as dislikes_count,
        COALESCE(user_like.status, 'None') as my_status,
        COALESCE(newest_likes.newest_likes, '[]'::json) as newest_likes
      FROM posts p
      LEFT JOIN (
        SELECT 
          post_id,
          COUNT(CASE WHEN status = 'Like' THEN 1 END) as likes_count,
          COUNT(CASE WHEN status = 'Dislike' THEN 1 END) as dislikes_count
        FROM post_likes 
        WHERE post_id = $1
        GROUP BY post_id
      ) like_counts ON p.id = like_counts.post_id
      LEFT JOIN post_likes user_like ON p.id = user_like.post_id AND user_like.user_id = $2
      LEFT JOIN (
        SELECT 
          post_id,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'addedAt', added_at,
              'userId', user_id,
              'login', u.login
            ) ORDER BY added_at DESC
          ) as newest_likes
        FROM post_likes pl
        JOIN users u ON pl.user_id = u.id
        WHERE pl.status = 'Like' AND pl.post_id = $1
        GROUP BY post_id
      ) newest_likes ON p.id = newest_likes.post_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;

    const result = await this.databaseService.query<{
      likes_count: number;
      dislikes_count: number;
      my_status: string;
      newest_likes: Array<{
        addedAt: string;
        userId: string;
        login: string;
      }>;
    }>(query, [postId, userId || null]);

    const row = result.rows[0];
    const newestLikes: LikeDetailsViewDto[] = row.newest_likes
      .slice(0, 3)
      .map((like) => ({
        addedAt: like.addedAt,
        userId: like.userId,
        login: like.login,
      }));

    return {
      likesCount: Number(row.likes_count),
      dislikesCount: Number(row.dislikes_count),
      myStatus: row.my_status as LikeStatus,
      newestLikes,
    };
  }
}
