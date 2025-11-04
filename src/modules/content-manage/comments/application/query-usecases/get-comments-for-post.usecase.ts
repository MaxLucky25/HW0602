import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CommentQueryRepository } from '../../infrastructure/query/comment.query-repository';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PostQueryRepository } from '../../../posts/infrastructure/query/post.query-repository';

export class GetCommentsForPostQuery {
  constructor(
    public readonly postId: string,
    public readonly query: GetCommentsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetCommentsForPostQuery)
export class GetCommentsForPostUseCase
  implements
    IQueryHandler<GetCommentsForPostQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(
    private commentQueryRepository: CommentQueryRepository,
    private postQueryRepository: PostQueryRepository,
  ) {}

  async execute(
    query: GetCommentsForPostQuery,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // 0. Проверяем, что пост существует (возвращает 404, если нет)
    await this.postQueryRepository.getByIdNotFoundFail(
      query.postId,
      query.userId,
    );

    // 1. Получаем комментарии из БД
    const comments = await this.commentQueryRepository.getCommentsForPost(
      query.postId,
      query.query,
      query.userId,
    );

    // 2. Получаем общее количество комментариев
    const totalCount = await this.commentQueryRepository.getTotalCountForPost(
      query.postId,
    );

    // 3. Получаем лайки для всех комментариев
    const commentIds = comments.map((comment) => comment.id);
    const likesMap = await this.commentQueryRepository.getLikesForComments(
      commentIds,
      query.userId,
    );

    // 4. Логика объединения данных
    const items = comments.map((comment) => {
      const extendedLikesInfo = likesMap.get(comment.id)!;
      return CommentViewDto.mapToView(comment, extendedLikesInfo);
    });

    // 5. Возвращаем пагинированный результат
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.query.pageNumber,
      size: query.query.pageSize,
    });
  }
}
