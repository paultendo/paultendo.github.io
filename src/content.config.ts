import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { smartQuotes } from "./utils/smartQuotes";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/posts" }),
  schema: z.object({
    // Frontmatter skips Markdown's typographic quotes, so titles get them here
    title: z.string().transform(smartQuotes),
    deck: z.string().transform(smartQuotes).optional(),
    description: z.string().transform(smartQuotes),
    date: z.string(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    updated: z.string().optional(),
    updateNote: z.string().transform(smartQuotes).optional(),
    order: z.number().optional(),
    snapshot: z.boolean().optional(),
    snapshotOf: z.string().optional(),
    featured: z.boolean().optional(),
    thumbnail: z.string().optional(),
    // Across the top of the homepage's lead story, fading into the text. For the occasional featured post only
    featuredImage: z.string().optional(),
  }),
});

export const collections = { posts };
