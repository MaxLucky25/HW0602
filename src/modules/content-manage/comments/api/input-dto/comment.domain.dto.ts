export class CreateCommentDomainDto {
  content: string;
  postId: string;
  commentatorId: string;
}

export class FindCommentByIdDto {
  id: string;
}
