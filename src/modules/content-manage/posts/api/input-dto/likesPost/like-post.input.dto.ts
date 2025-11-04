import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from './like-status.enum';

export class LikePostInputDto {
  @ApiProperty({
    description: 'Send None if you want to unlike\\dislike',
    enum: LikeStatus,
    example: LikeStatus.Like,
  })
  @IsEnum(LikeStatus, {
    message: 'likeStatus must be one of: None, Like, Dislike',
  })
  likeStatus: LikeStatus;
}
