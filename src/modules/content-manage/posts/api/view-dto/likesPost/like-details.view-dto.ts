import { ApiProperty } from '@nestjs/swagger';

export class LikeDetailsViewDto {
  @ApiProperty({
    description: 'Details about single like',
    example: '2024-01-15T10:30:00.000Z',
  })
  addedAt: string;

  @ApiProperty({
    description: 'User ID who made the like',
    example: '507f1f77bcf86cd799439011',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'User login who made the like',
    example: 'john_doe',
    nullable: true,
  })
  login: string | null;
}
