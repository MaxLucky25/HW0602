import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { GetAllPostsForBlogQuery } from '../../posts/application/query-usecases/get-all-posts-for-blog.usecase';
import { GetBlogByIdQuery } from '../application/query-usecase/get-blog.usecase';
import { GetAllBlogsQuery } from '../application/query-usecase/get-all-blogs.usecase';
import { OptionalJwtAuthGuard } from '../../../auth-manage/guards/bearer/optional-jwt-auth-guard';
import { ExtractUserIdForJwtOptionalGuard } from '../../../auth-manage/guards/decorators/param/extract-user-id-for-jwt-optional-guard.decorator';

@ApiTags('blogs')
@Controller('blogs')
export class PublicBlogsController {
  constructor(private queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get all blogs' })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiResponse({ status: 200, description: 'List of blogs' })
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    // Логирование для отладки
    console.log('=== GET /blogs ===');
    console.log('Raw query params:', query);
    console.log('Query type:', typeof query);
    console.log('Query keys:', Object.keys(query));
    console.log('Query values:', {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      searchNameTerm: query.searchNameTerm,
    });
    console.log('==================');

    return this.queryBus.execute(new GetAllBlogsQuery(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog by id' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 200, description: 'Blog found' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.queryBus.execute(new GetBlogByIdQuery(id));
  }

  @Get(':id/posts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get posts for a blog' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiResponse({ status: 200, description: 'List of blog posts' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
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
}
