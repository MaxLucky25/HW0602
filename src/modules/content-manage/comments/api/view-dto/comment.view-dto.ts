import { ExtendedLikesInfoViewDto } from './extended-likes-info.view-dto';
import { RawCommentRow } from '../../../../../core/database/types/sql.types';

export class CommentatorInfoViewDto {
  userId: string;
  userLogin: string;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoViewDto;
  createdAt: string;
  likesInfo: ExtendedLikesInfoViewDto;

  static mapToView(
    comment: RawCommentRow & { commentator_login: string },
    likesInfo: ExtendedLikesInfoViewDto,
  ): CommentViewDto {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentator_id,
        userLogin: comment.commentator_login,
      },
      createdAt: comment.created_at.toISOString(),
      likesInfo: likesInfo,
    };
  }
}
