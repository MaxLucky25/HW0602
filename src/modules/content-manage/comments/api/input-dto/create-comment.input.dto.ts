import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateCommentInputDto {
  @IsString()
  @IsNotEmpty()
  @Length(20, 300)
  content: string;
}
