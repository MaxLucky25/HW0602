import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';

export class GetAllBlogsQuery {
  constructor(public readonly queryParams: GetBlogsQueryParams) {}
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsQueryUseCase
  implements IQueryHandler<GetAllBlogsQuery, PaginatedViewDto<BlogViewDto[]>>
{
  constructor(private blogQueryRepository: BlogQueryRepository) {}

  async execute(
    query: GetAllBlogsQuery,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogQueryRepository.getAll(query.queryParams);
  }
}
