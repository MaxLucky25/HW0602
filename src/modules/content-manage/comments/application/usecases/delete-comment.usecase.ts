import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(private commentRepository: CommentRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail({
      id: command.commentId,
    });

    // Проверяем, что пользователь является автором комментария
    if (comment.commentator_id !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only delete your own comments',
        field: 'Comment',
      });
    }

    await this.commentRepository.deleteComment(command.commentId);
  }
}
