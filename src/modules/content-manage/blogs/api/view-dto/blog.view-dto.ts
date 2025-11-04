import { RawBlogRow } from '../../../../../core/database/types/sql.types';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  static mapToView(blog: RawBlogRow): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.website_url;
    dto.createdAt = new Date(blog.created_at).toISOString();
    dto.isMembership = blog.is_membership;

    return dto;
  }
}
