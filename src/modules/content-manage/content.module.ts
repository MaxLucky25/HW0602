import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { BlogsController } from './blogs/api/blogs.controller';
import { PostsController } from './posts/api/posts.controller';
import { PublicBlogsController } from './blogs/api/public-blogs.controller';
import { CommentsController } from './comments/api/comments.controller';

// Blog repositories
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogQueryRepository } from './blogs/infrastructure/query/blog.query-repository';

// Post repositories
import { PostRepository } from './posts/infrastructure/postRepository';
import { PostQueryRepository } from './posts/infrastructure/query/post.query-repository';
import { PostLikeRepository } from './posts/infrastructure/post-like.repository';
//
// Comment repositories
import { CommentRepository } from './comments/infrastructure/comment.repository';
import { CommentQueryRepository } from './comments/infrastructure/query/comment.query-repository';
import { CommentLikeRepository } from './comments/infrastructure/comment-like.repository';

// Blog use cases
import { CreateBlogUseCase } from './blogs/application/usecase/create-blog.usecase';
import { UpdateBlogUseCase } from './blogs/application/usecase/update-blog.usecase';
import { DeleteBlogUseCase } from './blogs/application/usecase/delete-blog.usecase';
import { GetBlogByIdUseCase } from './blogs/application/query-usecase/get-blog.usecase';
import { GetAllBlogsQueryUseCase } from './blogs/application/query-usecase/get-all-blogs.usecase';

// Post use cases
import { UpdatePostForBlogUseCase } from './posts/application/usecases/update-post-for-blog.usecase';
import { DeletePostForBlogUseCase } from './posts/application/usecases/delete-post-for-blog.usecase';
import { CreatePostForBlogUseCase } from './posts/application/usecases/create-post-for-blog.usecase';
import { GetPostByIdUseCase } from './posts/application/query-usecases/get-post-by-id.usecase';
import { GetAllPostsQueryUseCase } from './posts/application/query-usecases/get-all-posts.usecase';
import { GetPostsForBlogUseCase } from './posts/application/query-usecases/get-all-posts-for-blog.usecase';
import { UpdatePostLikeUseCase } from './posts/application/usecases/likesPost/update-post-like.usecase';
//
// Comment use cases
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
import { UpdateCommentUseCase } from './comments/application/usecases/update-comment.usecase';
import { DeleteCommentUseCase } from './comments/application/usecases/delete-comment.usecase';
import { UpdateCommentLikeUseCase } from './comments/application/usecases/update-comment-like.usecase';

// Comment query use cases
import { GetCommentByIdUseCase } from './comments/application/query-usecases/get-comment-by-id.usecase';
import { GetCommentsForPostUseCase } from './comments/application/query-usecases/get-comments-for-post.usecase';

const BlogCommandHandlers = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
];

const BlogQueryHandlers = [GetBlogByIdUseCase, GetAllBlogsQueryUseCase];

const PostCommandHandlers = [
  UpdatePostForBlogUseCase,
  DeletePostForBlogUseCase,
  CreatePostForBlogUseCase,
  UpdatePostLikeUseCase,
];

const CommentCommandHandlers = [
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  UpdateCommentLikeUseCase,
];

const PostQueryHandlers = [
  GetPostByIdUseCase,
  GetAllPostsQueryUseCase,
  GetPostsForBlogUseCase,
];

const CommentQueryHandlers = [GetCommentByIdUseCase, GetCommentsForPostUseCase];

const Repositories = [
  BlogRepository,
  BlogQueryRepository,
  PostRepository,
  PostQueryRepository,
  PostLikeRepository,
  CommentRepository,
  CommentQueryRepository,
  CommentLikeRepository,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...BlogCommandHandlers,
    ...BlogQueryHandlers,
    ...PostCommandHandlers,
    ...PostQueryHandlers,
    ...CommentCommandHandlers,
    ...CommentQueryHandlers,
    ...Repositories,
  ],
  controllers: [
    BlogsController,
    PostsController,
    PublicBlogsController,
    CommentsController,
  ],
  exports: [
    CreatePostForBlogUseCase,
    GetPostsForBlogUseCase,
    BlogRepository,
    BlogQueryRepository,
    PostRepository,
    PostQueryRepository,
  ],
})
export class ContentModule {}
