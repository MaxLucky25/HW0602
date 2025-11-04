import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../input-dto/likesPost/like-status.enum';
import { LikeDetailsViewDto } from './like-details.view-dto';

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

  @ApiProperty({
    description: 'Last 3 likes (status "Like")',
    type: [LikeDetailsViewDto],
    example: [
      {
        addedAt: '2024-01-15T10:30:00.000Z',
        userId: '507f1f77bcf86cd799439011',
        login: 'john_doe',
      },
      {
        addedAt: '2024-01-15T09:15:00.000Z',
        userId: '507f1f77bcf86cd799439012',
        login: 'jane_smith',
      },
    ],
  })
  newestLikes: LikeDetailsViewDto[];
}
