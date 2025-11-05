import { UpdateBlogInputDto } from '../../api/input-dto/update-blog.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { FindByIdDto } from '../../domain/dto/blog.domain.dto';

export class UpdateBlogCommand {
  constructor(
    public readonly blogId: FindByIdDto,
    public readonly dto: UpdateBlogInputDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    // Проверяем, что блог существует
    await this.blogRepository.findOrNotFoundFail({
      id: command.blogId.id,
    });

    // Обновляем блог через новый метод репозитория
    await this.blogRepository.updateBlog(command.blogId.id, {
      name: command.dto.name,
      description: command.dto.description,
      websiteUrl: command.dto.websiteUrl,
    });
  }
}
