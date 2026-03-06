import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isPublishedPrimaryPost } from "../../utils/postFilters";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts");
  const now = new Date();
  return posts
    .filter((p) => isPublishedPrimaryPost(p, now))
    .map((post) => ({
      params: { id: post.id },
      props: { post },
    }));
};

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: any };

  const fontsDir = join(process.cwd(), "src/utils/fonts");
  const syneBold = await readFile(join(fontsDir, "Syne-Bold.ttf"));
  const instrumentSans = await readFile(
    join(fontsDir, "InstrumentSans-Regular.ttf"),
  );

  const formattedDate = new Date(post.data.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const tags = (post.data.tags || []).join(" \u00b7 ");

  const titleBlock = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "16px",
      },
      children: post.data.deck
        ? [
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Syne",
                  fontSize: "46px",
                  fontWeight: 700,
                  color: "#eef4ff",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                },
                children: post.data.title,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Instrument Sans",
                  fontSize: "26px",
                  color: "#bcc9df",
                  lineHeight: 1.4,
                },
                children: post.data.deck,
              },
            },
          ]
        : [
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Syne",
                  fontSize: "52px",
                  fontWeight: 700,
                  color: "#eef4ff",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                },
                children: post.data.title,
              },
            },
          ],
    },
  };

  const markup = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        width: "1200px",
        height: "630px",
        backgroundColor: "#090e17",
        padding: "60px 64px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontFamily: "Syne",
              fontSize: "28px",
              fontWeight: 700,
              color: "#eef4ff",
              letterSpacing: "-0.02em",
            },
            children: "paultendo",
          },
        },
        titleBlock,
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    height: "3px",
                    backgroundColor: "#1ed760",
                    borderRadius: "2px",
                  },
                  children: " ",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontFamily: "Instrument Sans",
                    fontSize: "20px",
                    color: "#6b7d9e",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex" },
                        children: formattedDate,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex" },
                        children: tags,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Syne", data: syneBold, weight: 700 as const },
      { name: "Instrument Sans", data: instrumentSans, weight: 400 as const },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
