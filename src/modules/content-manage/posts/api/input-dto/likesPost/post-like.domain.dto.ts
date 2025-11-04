import { LikeStatus } from './like-status.enum';

export class CreatePostLikeDomainDto {
  userId: string;
  userLogin: string; // Оставляем для совместимости, но не используем в SQL
  postId: string;
  status: LikeStatus;
}

export class FindPostLikeDto {
  userId: string;
  postId: string;
}

export class UpdatePostLikeStatusDto {
  userId: string;
  postId: string;
  newStatus: LikeStatus;
}
