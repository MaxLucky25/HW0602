import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../../core/database/database.service';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/likesPost/extended-likes-info.view-dto';
import { LikeStatus } from '../../api/input-dto/likesPost/like-status.enum';
import { PostSortBy } from '../../api/input-dto/post-sort-by';
import { LikeDetailsViewDto } from '../../api/view-dto/likesPost/like-details.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../../domain/entities/post.entity';
import { Repository } from 'typeorm';
import { FindPostByIdDto } from '../../domain/dto/post.domain.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostQueryRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  async getByIdNotFoundFail(
    dto: FindPostByIdDto,
    userId?: string,
  ): Promise<Post> {
    const post = await this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.id=:id', { id: dto.id })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('blog.deletedAt IS NULL')
      .getOne();

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    return post;
  }

  async getAllPost(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<[Post[], number]> {
    return this.getPosts(query, userId);
  }

  async getAllPostForBlog(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<[Post[], number]> {
    return this.getPosts(query, userId, blogId);
  }

  private async getPosts(
    query: GetPostsQueryParams,
    userId?: string,
    blogId?: string,
  ): Promise<[Post[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.deletedAt IS NULL')
      .andWhere('blog.deletedAt IS NULL');

    // Фильтр по blogId
    if (blogId) {
      queryBuilder.andWhere('post.blogId = :blogId', { blogId });
    }

    // Поиск по названию
    if (query.searchTitleTerm) {
      queryBuilder.andWhere('post.title ILIKE :titleTerm', {
        titleTerm: `%${query.searchTitleTerm}%`,
      });
    }

    // Сортировка
    // BlogName маппится на blog.name, остальные поля используются напрямую из enum
    const orderByField =
      query.sortBy === PostSortBy.BlogName
        ? 'blog.name'
        : `post.${query.sortBy}`;
    const direction = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(orderByField, direction);

    // Пагинация
    const limit = query.pageSize;
    const offset = query.calculateSkip();
    queryBuilder.limit(limit).offset(offset);

    // Получаем данные и общее количество одним запросом
    return await queryBuilder.getManyAndCount();
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
    postId: FindPostByIdDto,
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
    }>(query, [postId.id, userId || null]);

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

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
