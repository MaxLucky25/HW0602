import { IsEnum } from 'class-validator';
import { LikeStatus } from './comment-like.domain.dto';

export class LikeCommentInputDto {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
