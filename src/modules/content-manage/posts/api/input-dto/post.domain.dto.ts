export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class FindPostByIdDto {
  id: string;
}

export class BlogIdDto {
  blogId: string;
}
