import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';

export class GetPostByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdUseCase
  implements IQueryHandler<GetPostByIdQuery, PostViewDto>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(query: GetPostByIdQuery): Promise<PostViewDto> {
    // 1. Получаем пост из БД
    const post = await this.postQueryRepository.getByIdNotFoundFail(
      query.id,
      query.userId,
    );

    // 2. Получаем лайки для поста
    const extendedLikesInfo =
      await this.postQueryRepository.getExtendedLikesInfo(
        query.id,
        query.userId,
      );

    // 3. Объединяем данные
    return PostViewDto.mapToView(post, extendedLikesInfo);
  }
}
