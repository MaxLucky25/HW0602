import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  postContentConstraints,
  postShortDescriptionConstraints,
  postTitleConstraints,
} from './post-constraints';
import { IsString } from 'class-validator';

export class UpdatePostInputDto {
  @ApiProperty({ example: 'Post title', description: 'Title of the post' })
  @IsStringWithTrim(
    postTitleConstraints.minLength,
    postTitleConstraints.maxLength,
  )
  title: string;

  @ApiProperty({
    example: 'Short description',
    description: 'Short description of the post',
  })
  @IsStringWithTrim(
    postShortDescriptionConstraints.minLength,
    postShortDescriptionConstraints.maxLength,
  )
  shortDescription: string;

  @ApiProperty({ example: 'Main content', description: 'Content of the post' })
  @IsStringWithTrim(
    postContentConstraints.minLength,
    postContentConstraints.maxLength,
  )
  content: string;

  @ApiProperty({ example: 'blogId123', description: 'Blog ID' })
  @IsString()
  blogId: string;
}
