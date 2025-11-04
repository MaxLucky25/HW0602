import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../input-dto/comment-like.domain.dto';

export class ExtendedLikesInfoViewDto {
  @ApiProperty({
    description: 'Total likes for parent item',
    example: 42,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Total dislikes for parent item',
    example: 5,
  })
  dislikesCount: number;

  @ApiProperty({
    description: 'Send None if you want to unlike\\dislike',
    enum: LikeStatus,
    example: LikeStatus.Like,
  })
  myStatus: LikeStatus;
}
