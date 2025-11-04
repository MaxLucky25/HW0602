import { IsString, IsNotEmpty, Length } from 'class-validator';

export class UpdateCommentInputDto {
  @IsString()
  @IsNotEmpty()
  @Length(20, 300)
  content: string;
}
