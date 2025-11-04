export enum PostSortBy {
  title = 'title',
  shortDescription = 'shortDescription',
  content = 'content',
  blogId = 'blogId',
  BlogName = 'blogName',
  createdAt = 'createdAt',
}

// Маппинг полей API на SQL поля для сортировки
export const POST_SORT_FIELD_MAP: Record<PostSortBy, string> = {
  [PostSortBy.title]: 'p.title',
  [PostSortBy.shortDescription]: 'p.short_description',
  [PostSortBy.content]: 'p.content',
  [PostSortBy.blogId]: 'p.blog_id',
  [PostSortBy.BlogName]: 'b.name',
  [PostSortBy.createdAt]: 'p.created_at',
};
