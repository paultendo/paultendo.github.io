import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    deck: z.string().optional(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { posts };
