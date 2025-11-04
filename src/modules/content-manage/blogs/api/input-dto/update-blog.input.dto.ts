import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { descriptionConstraints, nameConstraints } from './blog-constraints';

export class UpdateBlogInputDto {
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
  @IsUrl()
  @IsString()
  websiteUrl: string;
}
