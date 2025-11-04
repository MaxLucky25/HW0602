export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class CreateCommentLikeDomainDto {
  userId: string;
  commentId: string;
  status: LikeStatus;
}

export class FindCommentLikeDto {
  userId: string;
  commentId: string;
}

export class UpdateCommentLikeStatusDto {
  userId: string;
  commentId: string;
  newStatus: LikeStatus;
}
