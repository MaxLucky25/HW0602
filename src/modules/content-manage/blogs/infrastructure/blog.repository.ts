import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Blog } from '../domain/entities/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreateBlogDomainDto,
  FindByIdDto,
} from '../domain/dto/blog.domain.dto';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly repository: Repository<Blog>,
  ) {}

  async findById(dto: FindByIdDto): Promise<Blog | null> {
    return await this.repository.findOne({
      where: { id: dto.id, deletedAt: IsNull() },
    });
  }

  async findOrNotFoundFail(id: FindByIdDto): Promise<Blog> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        field: 'Blog',
      });
    }

    return blog;
  }

  async createBlog(dto: CreateBlogDomainDto): Promise<Blog> {
    // Используем статический метод Entity для создания
    const blog = Blog.create(dto);

    return await this.repository.save(blog);
  }

  async updateBlog(id: string, dto: CreateBlogDomainDto): Promise<Blog> {
    const blog = await this.findOrNotFoundFail({ id });
    blog.update(dto);
    return await this.repository.save(blog);
  }

  async deleteBlog(id: string): Promise<Blog> {
    const blog = await this.findOrNotFoundFail({ id });
    blog.softDelete();
    return await this.repository.save(blog);
  }
}
