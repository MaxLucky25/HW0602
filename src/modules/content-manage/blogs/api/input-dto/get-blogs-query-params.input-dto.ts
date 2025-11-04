import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogSortBy } from './blog-sort-by';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsEnum(BlogSortBy)
  sortBy = BlogSortBy.CreateAt;
  @IsString()
  @IsOptional()
  searchNameTerm: string | null = null;
}
