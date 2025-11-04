import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { descriptionConstraints, nameConstraints } from './blog-constraints';
import { IsString, IsUrl } from 'class-validator';

export class CreateBlogInputDto {
  @ApiProperty({ example: 'My Blog', description: 'Blog name' })
  @IsStringWithTrim(nameConstraints.minLength, nameConstraints.maxLength)
  name: string;

  @ApiProperty({
    example: 'Blog description',
    description: 'Description of the blog',
  })
  @IsStringWithTrim(
    descriptionConstraints.minLength,
    descriptionConstraints.maxLength,
  )
  description: string;

  @ApiProperty({ example: 'https://site.com', description: 'Blog website URL' })
  @IsString()
  @IsUrl()
  websiteUrl: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation date',
    required: false,
  })
  createdAt: Date;

  @ApiProperty({ example: false, description: 'Is membership only?' })
  isMembership: boolean;
}
