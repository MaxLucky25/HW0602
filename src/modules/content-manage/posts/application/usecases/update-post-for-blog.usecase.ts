import { UpdatePostForBlogInputDto } from '../../api/input-dto/update-post-for-blog.input.dto';
import { FindPostByIdDto } from '../../api/input-dto/post.domain.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdatePostForBlogCommand {
  constructor(
    public readonly id: FindPostByIdDto,
    public readonly blogId: string,
    public readonly dto: UpdatePostForBlogInputDto,
  ) {}
}

@CommandHandler(UpdatePostForBlogCommand)
export class UpdatePostForBlogUseCase
  implements ICommandHandler<UpdatePostForBlogCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute(command: UpdatePostForBlogCommand): Promise<void> {
    // Проверяем, что пост существует и принадлежит указанному блогу
    const post = await this.postRepository.findById(command.id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    if (post.blog_id !== command.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found in this blog',
        field: 'Post',
      });
    }

    // Обновляем пост через новый метод репозитория
    await this.postRepository.updatePost(command.id.id, {
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.blogId,
    });
  }
}
