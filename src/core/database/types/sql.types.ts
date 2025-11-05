// Типы для результатов SQL запросов
export interface TableInfo {
  table_name: string;
}

export interface TruncateResult {
  command: string;
  rowCount: number;
}

// Post types
export interface RawPostRow {
  id: string;
  title: string;
  short_description: string;
  content: string;
  blog_id: string;
  created_at: Date;
  deleted_at: Date | null;
}

// Post Likes types
export interface RawPostLikeRow {
  id: string;
  user_id: string;
  post_id: string;
  status: string; // LikeStatus enum value
  added_at: Date;
}

// Comment types
export interface RawCommentRow {
  id: string;
  content: string;
  post_id: string;
  commentator_id: string;
  created_at: Date;
  deleted_at: Date | null;
}

// Comment Likes types
export interface RawCommentLikeRow {
  id: string;
  user_id: string;
  comment_id: string;
  status: string; // LikeStatus enum value
  added_at: Date;
}
