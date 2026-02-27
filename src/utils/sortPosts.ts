/**
 * Sort posts by date descending, then by order descending for same-date posts.
 * Higher order = later in series = appears first on the page (newest-first).
 * Posts without an `order` field default to 0.
 */
export function sortPosts<T extends { data: { date: string; order?: number } }>(
  posts: T[],
): T[] {
  return posts.slice().sort((a, b) => {
    const dateDiff = new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.data.order ?? 0) - (a.data.order ?? 0);
  });
}
