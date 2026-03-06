import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { isPublishedPrimaryPost } from "../utils/postFilters";
import { sortPosts } from "../utils/sortPosts";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");

  const now = new Date();
  const sortedPosts = sortPosts(
    posts.filter((p) => isPublishedPrimaryPost(p, now))
  );

  return rss({
    title: "paultendo",
    description: "Research notes on Unicode security, open-source tools, and applied AI systems.",
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.date),
      link: `/posts/${post.id}/`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
