import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';

export class GetAllPostsQuery {
  constructor(
    public readonly queryParams: GetPostsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetAllPostsQuery)
export class GetAllPostsQueryUseCase
  implements IQueryHandler<GetAllPostsQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(
    query: GetAllPostsQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    // 1. Получаем посты и общее количество из БД одним запросом
    const [posts, totalCount] = await this.postQueryRepository.getAllPost(
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
