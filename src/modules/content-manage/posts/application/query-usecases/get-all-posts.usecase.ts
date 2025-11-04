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
    // 1. Получаем посты из БД
    const posts = await this.postQueryRepository.getAllPost(
      query.queryParams,
      query.userId,
    );

    // 2. Получаем общее количество постов
    const totalCount = await this.postQueryRepository.getTotalCount(
      query.queryParams,
    );

    // 3. Получаем лайки для всех постов
    const postIds = posts.map((post) => post.id);
    const likesMap = await this.postQueryRepository.getLikesForPosts(
      postIds,
      query.userId,
    );

    // 4. Логика объединения данных (перенесена из Repository)
    const items = posts.map((post) => {
      const extendedLikesInfo = likesMap.get(post.id)!;
      return PostViewDto.mapToView(post, extendedLikesInfo);
    });

    // 5. Возвращаем пагинированный результат
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.queryParams.pageNumber,
      size: query.queryParams.pageSize,
    });
  }
}
