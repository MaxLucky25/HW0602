import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { CreateBlogDomainDto } from '../dto/blog.domain.dto';
import { randomUUID } from 'crypto';

@Entity('blogs')
export class Blog {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ name: 'website_url' })
  websiteUrl: string;

  @Column({ name: 'is_membership', default: false })
  isMembership: boolean;

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
   * Статический метод для создания нового блога
   */
  static create(dto: CreateBlogDomainDto): Blog {
    const blog = new Blog();
    blog.id = randomUUID();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;
    blog.deletedAt = null;
    // createdAt установится автоматически через @CreateDateColumn

    return blog;
  }

  /**
   * Обновить данные блога
   */
  update(dto: CreateBlogDomainDto): void {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  /**
   * Выполнить мягкое удаление (soft delete)
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }
}
