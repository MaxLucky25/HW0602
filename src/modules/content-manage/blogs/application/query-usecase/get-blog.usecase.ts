import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';

export class GetBlogByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdUseCase
  implements IQueryHandler<GetBlogByIdQuery, BlogViewDto>
{
  constructor(private blogQueryRepository: BlogQueryRepository) {}

  async execute(query: GetBlogByIdQuery): Promise<BlogViewDto> {
    return this.blogQueryRepository.getByIdOrNotFoundFail(query.id);
  }
}
