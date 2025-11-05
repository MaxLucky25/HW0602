import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogSortBy } from '../../api/input-dto/blog-sort-by';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly repository: Repository<Blog>,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
        field: 'blog',
      });
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const searchNameTerm = query.searchNameTerm;

    // Создаем QueryBuilder
    const queryBuilder = this.repository.createQueryBuilder('blog');

    // Базовое условие: только не удаленные блоги
    queryBuilder.where({ deletedAt: IsNull() });

    // Если есть поисковый термин, добавляем фильтр
    if (searchNameTerm) {
      queryBuilder.andWhere('blog.name ILIKE :nameTerm', {
        nameTerm: `%${searchNameTerm}%`,
      });
    }

    // Маппинг полей для сортировки
    const orderBy =
      query.sortBy === BlogSortBy.CreateAt ? 'createdAt' : query.sortBy;
    const direction = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(`blog.${orderBy}`, direction);

    // Применяем пагинацию
    const limit = query.pageSize;
    const offset = query.calculateSkip();
    queryBuilder.limit(limit).offset(offset);

    // Получаем данные и общее количество
    const [blogs, totalCount] = await queryBuilder.getManyAndCount();

    const items = blogs.map((blog) => BlogViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
