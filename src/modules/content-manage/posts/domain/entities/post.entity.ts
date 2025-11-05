import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Blog } from '../../../blogs/domain/entities/blog.entity';
import { CreatePostDomainDto } from '../dto/post.domain.dto';
import { randomUUID } from 'crypto';

@Entity('posts')
export class Post {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'short_description' })
  shortDescription: string;

  @Column()
  content: string;

  @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @Column({ name: 'blog_id' })
  blogId: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date | null;

  /**
   * Статический метод для создания нового поста
   */
  static create(dto: CreatePostDomainDto): Post {
    const post = new Post();
    post.id = randomUUID();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.deletedAt = null;

    return post;
  }

  /**
   * Обновить данные поста
   */
  update(dto: CreatePostDomainDto): void {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;
  }

  /**
   * Выполнить мягкое удаление (soft delete)
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }
}
