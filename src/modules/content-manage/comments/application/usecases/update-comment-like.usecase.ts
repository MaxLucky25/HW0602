import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LikeCommentInputDto } from '../../api/input-dto/like-comment.input.dto';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { CommentLikeRepository } from '../../infrastructure/comment-like.repository';
import { LikeStatus } from '../../api/input-dto/comment-like.domain.dto';

export class UpdateCommentLikeCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly dto: LikeCommentInputDto,
  ) {}
}

@CommandHandler(UpdateCommentLikeCommand)
@Injectable()
export class UpdateCommentLikeUseCase
  implements ICommandHandler<UpdateCommentLikeCommand, void>
{
  constructor(
    private commentLikeRepository: CommentLikeRepository,
    private commentRepository: CommentRepository,
  ) {}

  async execute(command: UpdateCommentLikeCommand): Promise<void> {
    const { commentId, userId, dto } = command;

    // Валидация: проверяем существование комментария
    await this.commentRepository.findOrNotFoundFail({ id: commentId });

    if (dto.likeStatus === LikeStatus.None) {
      await this.removeUserReaction(commentId, userId);
      return;
    }

    const existingReaction = await this.commentLikeRepository.findUserReaction({
      userId,
      commentId,
    });

    if (existingReaction) {
      await this.commentLikeRepository.updateReactionStatus({
        userId,
        commentId,
        newStatus: dto.likeStatus,
      });
    } else {
      await this.commentLikeRepository.createReaction({
        userId,
        commentId,
        status: dto.likeStatus,
      });
    }
  }

  /**
   * Удаляет реакцию пользователя на комментарий
   */
  private async removeUserReaction(
    commentId: string,
    userId: string,
  ): Promise<void> {
    await this.commentLikeRepository.removeReaction({
      userId,
      commentId,
    });
  }
}
