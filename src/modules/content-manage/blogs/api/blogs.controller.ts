import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input.dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePostForBlogInputDto } from '../../posts/api/input-dto/create-post-for-blog.input.dto';
import { UpdatePostForBlogInputDto } from '../../posts/api/input-dto/update-post-for-blog.input.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostForBlogCommand } from '../../posts/application/usecases/create-post-for-blog.usecase';
import { GetAllPostsForBlogQuery } from '../../posts/application/query-usecases/get-all-posts-for-blog.usecase';
import { UpdatePostForBlogCommand } from '../../posts/application/usecases/update-post-for-blog.usecase';
import { DeletePostForBlogCommand } from '../../posts/application/usecases/delete-post-for-blog.usecase';
import { CreateBlogCommand } from '../application/usecase/create-blog.usecase';
import { UpdateBlogCommand } from '../application/usecase/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecase/delete-blog.usecase';
import { GetBlogByIdQuery } from '../application/query-usecase/get-blog.usecase';
import { GetAllBlogsQuery } from '../application/query-usecase/get-all-blogs.usecase';
import { BasicAuthGuard } from '../../../auth-manage/guards/basic/basic-auth.guard';
import { OptionalJwtAuthGuard } from '../../../auth-manage/guards/bearer/optional-jwt-auth-guard';
import { ExtractUserIdForJwtOptionalGuard } from '../../../auth-manage/guards/decorators/param/extract-user-id-for-jwt-optional-guard.decorator';

@ApiTags('sa/blogs')
@Controller('sa/blogs')
export class BlogsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get blog by id' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 200, description: 'Blog found' })
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.queryBus.execute(new GetBlogByIdQuery(id));
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get all blogs' })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiResponse({ status: 200, description: 'List of blogs' })
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute(new GetAllBlogsQuery(query));
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a blog' })
  @ApiBody({ type: CreateBlogInputDto })
  @ApiResponse({ status: 201, description: 'Blog created' })
  async create(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    return this.commandBus.execute(new CreateBlogCommand(body));
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Update a blog' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiBody({ type: UpdateBlogInputDto })
  @ApiResponse({ status: 204, description: 'Blog updated' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand({ id }, body));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Delete a blog' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 204, description: 'Blog deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand({ id }));
  }

  @Get(':id/posts')
  @UseGuards(OptionalJwtAuthGuard, BasicAuthGuard)
  @ApiOperation({ summary: 'Get posts for a blog' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 200, description: 'List of blog posts' })
  async getPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    @ExtractUserIdForJwtOptionalGuard() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.getById(id);
    return this.queryBus.execute(
      new GetAllPostsForBlogQuery(id, query, userId),
    );
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create post for a blog' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiBody({ type: CreatePostForBlogInputDto })
  @ApiResponse({ status: 201, description: 'Post created' })
  async createPostForBlog(
    @Param('id') blogId: string,
    @Body() body: CreatePostForBlogInputDto,
  ): Promise<PostViewDto | null> {
    return this.commandBus.execute(
      new CreatePostForBlogCommand({ blogId }, body),
    );
  }

  @Put(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Update post by id' })
  @ApiParam({ name: 'blogId', description: 'Blog ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: UpdatePostForBlogInputDto })
  @ApiResponse({ status: 204, description: 'Post updated' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() body: UpdatePostForBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostForBlogCommand({ id: postId }, blogId, body),
    );
  }

  @Delete(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Delete post by id' })
  @ApiParam({ name: 'blogId', description: 'Blog ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeletePostForBlogCommand({ id: postId }, blogId),
    );
  }
}
