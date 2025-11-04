import { FindPostByIdDto } from '../../api/input-dto/post.domain.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeletePostForBlogCommand {
  constructor(
    public readonly id: FindPostByIdDto,
    public readonly blogId: string,
  ) {}
}

@CommandHandler(DeletePostForBlogCommand)
export class DeletePostForBlogUseCase
  implements ICommandHandler<DeletePostForBlogCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute(command: DeletePostForBlogCommand): Promise<void> {
    // Сначала проверяем, что пост существует
    const post = await this.postRepository.findById(command.id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    // Проверяем, что пост принадлежит указанному блогу
    if (post.blog_id !== command.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found in this blog',
        field: 'Post',
      });
    }

    // Удаляем пост (теперь мы знаем, что он существует и принадлежит нужному блогу)
    await this.postRepository.deletePost(command.id.id);
  }
}
