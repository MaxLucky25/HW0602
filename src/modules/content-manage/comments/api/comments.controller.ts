import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { UpdateCommentInputDto } from './input-dto/update-comment.input.dto';
import { LikeCommentInputDto } from './input-dto/like-comment.input.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { GetCommentByIdQuery } from '../application/query-usecases/get-comment-by-id.usecase';
import { UpdateCommentLikeCommand } from '../application/usecases/update-comment-like.usecase';
import { JwtAuthGuard } from '../../../auth-manage/guards/bearer/jwt-auth-guard';
import { OptionalJwtAuthGuard } from '../../../auth-manage/guards/bearer/optional-jwt-auth-guard';
import { ExtractUserForJwtGuard } from '../../../auth-manage/guards/decorators/param/extract-user-for-jwt-guard.decorator';
import { ExtractUserIdForJwtOptionalGuard } from '../../../auth-manage/guards/decorators/param/extract-user-id-for-jwt-optional-guard.decorator';
import { UserContextDto } from '../../../auth-manage/guards/dto/user-context.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment found' })
  async getById(
    @Param('id') id: string,
    @ExtractUserIdForJwtOptionalGuard() userId?: string,
  ): Promise<CommentViewDto> {
    return this.queryBus.execute(new GetCommentByIdQuery(id, userId));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentInputDto })
  @ApiResponse({ status: 204, description: 'Comment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentInputDto,
    @ExtractUserForJwtGuard() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateCommentCommand(id, dto, user.id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @ExtractUserForJwtGuard() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteCommentCommand(id, user.id));
  }

  @Put(':commentId/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Make like/unlike/dislike/undislike operation' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiBody({ type: LikeCommentInputDto })
  @ApiResponse({ status: 204, description: 'Like status updated' })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'If comment with specified commentId does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('commentId') commentId: string,
    @Body() dto: LikeCommentInputDto,
    @ExtractUserForJwtGuard() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCommentLikeCommand(commentId, user.id, dto),
    );
  }
}
