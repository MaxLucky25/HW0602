import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreatePostDomainDto,
  FindPostByIdDto,
} from '../domain/dto/post.domain.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../domain/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  async findById(dto: FindPostByIdDto): Promise<Post | null> {
    return await this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.id = :id', { id: dto.id })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('blog.deletedAt IS NULL')
      .getOne();
  }

  async findOrNotFoundFail(id: FindPostByIdDto): Promise<Post> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    return post;
  }

  async createPost(dto: CreatePostDomainDto): Promise<Post> {
    const post = Post.create(dto);
    await this.repository.save(post);
    return await this.findOrNotFoundFail({ id: post.id });
  }

  async updatePost(id: string, dto: CreatePostDomainDto): Promise<Post> {
    const post = await this.findOrNotFoundFail({ id: id });
    post.update(dto);
    return await this.repository.save(post);
  }

  async deletePost(id: string): Promise<Post | null> {
    const post = await this.findById({ id: id });
    if (!post) {
      return null;
    }
    post.softDelete();
    return await this.repository.save(post);
  }
}
