export interface PostWithData {
  data: {
    date: string;
    draft?: boolean;
    snapshot?: boolean;
  };
}

export function isPublishedPost<T extends PostWithData>(
  post: T,
  now: Date = new Date(),
): boolean {
  return !post.data.draft && new Date(post.data.date) <= now;
}

export function isPublishedPrimaryPost<T extends PostWithData>(
  post: T,
  now: Date = new Date(),
): boolean {
  return isPublishedPost(post, now) && !post.data.snapshot;
}
