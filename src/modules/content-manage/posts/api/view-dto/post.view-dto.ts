import { RawPostRow } from '../../../../../core/database/types/sql.types';
import { ExtendedLikesInfoViewDto } from './likesPost/extended-likes-info.view-dto';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  static mapToView(
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
