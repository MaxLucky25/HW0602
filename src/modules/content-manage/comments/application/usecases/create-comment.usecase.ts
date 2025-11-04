import { CreateCommentInputDto } from '../../api/input-dto/create-comment.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PostRepository } from '../../../posts/infrastructure/postRepository';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/extended-likes-info.view-dto';
import { LikeStatus } from '../../api/input-dto/comment-like.domain.dto';

export class CreateCommentCommand {
  constructor(
    public readonly dto: CreateCommentInputDto,
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, CommentViewDto>
{
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentViewDto> {
    // Проверяем, что пост существует
    await this.postRepository.findOrNotFoundFail({
      id: command.postId,
    });

    const comment = await this.commentRepository.createComment({
      content: command.dto.content,
      postId: command.postId,
      commentatorId: command.userId,
    });

    // Для нового комментария лайков еще нет, используем пустую структуру
    const extendedLikesInfo: ExtendedLikesInfoViewDto = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
    };

    return CommentViewDto.mapToView(comment, extendedLikesInfo);
  }
}
