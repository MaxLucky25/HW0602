export enum CommentSortBy {
  content = 'content',
  createdAt = 'createdAt',
}

// Маппинг полей API на SQL поля для сортировки
export const COMMENT_SORT_FIELD_MAP: Record<CommentSortBy, string> = {
  [CommentSortBy.content]: 'c.content',
  [CommentSortBy.createdAt]: 'c.created_at',
};
