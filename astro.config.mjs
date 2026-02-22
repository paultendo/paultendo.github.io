import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://paultendo.github.io",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/v1"),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "material-theme-palenight",
    },
  },
});
