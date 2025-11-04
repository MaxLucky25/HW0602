import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentSortBy } from './comment-sort-by';
import { IsEnum } from 'class-validator';

export class GetCommentsQueryParams extends BaseQueryParams {
  @IsEnum(CommentSortBy)
  sortBy = CommentSortBy.createdAt;
}
