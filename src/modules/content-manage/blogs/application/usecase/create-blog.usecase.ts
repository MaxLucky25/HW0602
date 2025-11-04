import { CreateBlogInputDto } from '../../api/input-dto/create-blog.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { BlogRepository } from '../../infrastructure/blog.repository';

export class CreateBlogCommand {
  constructor(public readonly dto: CreateBlogInputDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, BlogViewDto>
{
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: CreateBlogCommand): Promise<BlogViewDto> {
    const blog = await this.blogRepository.createBlog({
      name: command.dto.name,
      description: command.dto.description,
      websiteUrl: command.dto.websiteUrl,
    });
    return BlogViewDto.mapToView(blog);
  }
}
