import { RawPostRow } from '../../../../../core/database/types/sql.types';
import { ExtendedLikesInfoViewDto } from './likesPost/extended-likes-info.view-dto';
import { Post } from '../../domain/entities/post.entity';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  /**
   * Маппинг Post entity в PostViewDto
   */
  static mapToView(
    post: Post,
    extendedLikesInfo: ExtendedLikesInfoViewDto,
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post.id;
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blog.name;
    dto.createdAt = post.createdAt.toISOString();
    dto.extendedLikesInfo = extendedLikesInfo;

    return dto;
  }

  /**
   * @deprecated Используйте mapToView с Post entity. Будет удалено после полной миграции.
   * Маппинг RawPostRow в PostViewDto (для обратной совместимости)
   */
  static mapToViewFromRaw(
    post: RawPostRow & { blog_name: string },
    extendedLikesInfo: ExtendedLikesInfoViewDto,
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post.id;
    dto.title = post.title;
    dto.shortDescription = post.short_description;
    dto.content = post.content;
    dto.blogId = post.blog_id;
    dto.blogName = post.blog_name;
    dto.createdAt = post.created_at.toISOString();
    dto.extendedLikesInfo = extendedLikesInfo;

    return dto;
  }
}
