import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post.view-dto';

export class GetAllPostsForBlogQuery {
  constructor(
    public readonly blogId: string,
    public readonly queryParams: GetPostsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetAllPostsForBlogQuery)
export class GetPostsForBlogUseCase
  implements
    IQueryHandler<GetAllPostsForBlogQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(
    query: GetAllPostsForBlogQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    // 1. Получаем посты и общее количество из БД одним запросом
    const [posts, totalCount] =
      await this.postQueryRepository.getAllPostForBlog(
        query.blogId,
        query.queryParams,
        query.userId,
      );

    // 2. Получаем лайки для всех постов
    const postIds = posts.map((post) => post.id);
    const likesMap = await this.postQueryRepository.getLikesForPosts(
      postIds,
      query.userId,
    );

    // 3. Логика объединения данных
    const items = posts.map((post) => {
      const extendedLikesInfo = likesMap.get(post.id)!;
      return PostViewDto.mapToView(post, extendedLikesInfo);
    });

    // 4. Возвращаем пагинированный результат
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.queryParams.pageNumber,
      size: query.queryParams.pageSize,
    });
  }
}
