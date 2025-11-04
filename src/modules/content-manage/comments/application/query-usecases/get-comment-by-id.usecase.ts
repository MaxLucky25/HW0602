import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CommentQueryRepository } from '../../infrastructure/query/comment.query-repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';

export class GetCommentByIdQuery {
  constructor(
    public readonly commentId: string,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdUseCase
  implements IQueryHandler<GetCommentByIdQuery, CommentViewDto>
{
  constructor(private commentQueryRepository: CommentQueryRepository) {}

  async execute(query: GetCommentByIdQuery): Promise<CommentViewDto> {
    const comment = await this.commentQueryRepository.getByIdNotFoundFail(
      query.commentId,
      query.userId,
    );

    const likesInfo = await this.commentQueryRepository.getExtendedLikesInfo(
      comment.id,
      query.userId,
    );

    return CommentViewDto.mapToView(comment, likesInfo);
  }
}
