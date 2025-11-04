import { FindByIdDto } from '../../api/input-dto/blog.domain.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';

export class DeleteBlogCommand {
  constructor(public blogId: FindByIdDto) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private blogRepository: BlogRepository) {}
  async execute(command: DeleteBlogCommand): Promise<void> {
    // Проверяем, что блог существует
    await this.blogRepository.findOrNotFoundFail({
      id: command.blogId.id,
    });

    // Удаляем блог через новый метод репозитория
    await this.blogRepository.deleteBlog(command.blogId.id);
  }
}
