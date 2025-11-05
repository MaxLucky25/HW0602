import { BlogIdDto } from '../../domain/dto/post.domain.dto';
import { CreatePostForBlogInputDto } from '../../api/input-dto/create-post-for-blog.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostRepository } from '../../infrastructure/postRepository';
import { BlogRepository } from '../../../blogs/infrastructure/blog.repository';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/likesPost/extended-likes-info.view-dto';
import { LikeStatus } from '../../api/input-dto/likesPost/like-status.enum';

export class CreatePostForBlogCommand {
  constructor(
    public readonly id: BlogIdDto,
    public readonly dto: CreatePostForBlogInputDto,
    public readonly userId?: string,
  ) {}
}

@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogUseCase
  implements ICommandHandler<CreatePostForBlogCommand, PostViewDto>
{
  constructor(
    private blogRepository: BlogRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostForBlogCommand): Promise<PostViewDto> {
    await this.blogRepository.findOrNotFoundFail({
      id: command.id.blogId,
    });

    const post = await this.postRepository.createPost({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.id.blogId,
    });

    // Для нового поста лайков еще нет, используем пустую структуру
    const extendedLikesInfo: ExtendedLikesInfoViewDto = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };

    return PostViewDto.mapToView(post, extendedLikesInfo);
  }
}
