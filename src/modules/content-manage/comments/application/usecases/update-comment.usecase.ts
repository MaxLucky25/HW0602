import { UpdateCommentInputDto } from '../../api/input-dto/update-comment.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly dto: UpdateCommentInputDto,
    public readonly userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(private commentRepository: CommentRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail({
      id: command.commentId,
    });

    // Проверяем, что пользователь является автором комментария
    if (comment.commentator_id !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only edit your own comments',
        field: 'Comment',
      });
    }

    await this.commentRepository.updateComment(command.commentId, {
      content: command.dto.content,
    });
  }
}
