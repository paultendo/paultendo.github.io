// Mirrors the blog onto Substack: every post in the built feed that isn't there yet, matched
// by slug. Posts from the last few days are emailed to subscribers; older ones go up quietly
// with their original date. The blog stays the original: each mirror says so and links back.
//
//   npm run substack:mirror                     mirror anything missing
//   npm run substack:mirror -- --dry-run        convert only, into .substack/
//   npm run substack:mirror -- --only <slug>    just these posts (comma-separated)
//   npm run substack:mirror -- --no-email       never email
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { chromePath } from "./chrome.mjs";
import { Substack, readCookie, PUBLICATION } from "./client.mjs";
import { convertPost } from "./convert.mjs";

const SITE = "https://paultendo.github.io";
const DIST = path.resolve("dist");
const NEW_POST_DAYS = 3;

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const dryRun = args.includes("--dry-run");
const noEmail = args.includes("--no-email");
const only = option("only")?.split(",");
const outDir = option("out") || ".substack";

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".woff2": "font/woff2", ".xml": "application/xml" };
const mime = (file) => MIME[path.extname(file).toLowerCase()] || "application/octet-stream";

// The built site, served locally so nothing waits on the live one
function serve(dir) {
  const server = http.createServer(async (req, res) => {
    let file = path.join(dir, decodeURIComponent(new URL(req.url, "http://local").pathname));
    if (file.endsWith(path.sep)) file = path.join(file, "index.html");
    try {
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": mime(file) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// The feed's posts, oldest first, so Substack's archive runs in the same order
async function feedPosts() {
  const xml = await readFile(path.join(DIST, "rss.xml"), "utf8");
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => {
      const link = item.match(/<link>(.*?)<\/link>/)[1];
      return { id: link.split("/").filter(Boolean).pop(), link, date: new Date(item.match(/<pubDate>(.*?)<\/pubDate>/)[1]) };
    })
    .sort((a, b) => a.date - b.date);
}

async function frontmatter(id) {
  const src = await readFile(`src/content/posts/${id}.mdx`, "utf8").catch(() => "");
  const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  const get = (key) => fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, "m"))?.[1] || null;
  return { featuredImage: get("featuredImage"), thumbnail: get("thumbnail") };
}

// Blog images are read from the build and uploaded as data, so Substack never fetches a page that isn't live yet
async function imageSource(src) {
  if (!src.startsWith(SITE)) return src;
  const file = path.join(DIST, decodeURIComponent(new URL(src).pathname));
  return `data:${mime(file)};base64,${(await readFile(file)).toString("base64")}`;
}

function fillImages(node, images) {
  if (node.type === "image2" && node.attrs.src.startsWith("__image:")) {
    const up = images[Number(node.attrs.src.slice(8))].uploaded;
    node.attrs = {
      src: up.url, srcNoWatermark: null, fullscreen: null, imageSize: "normal", height: up.imageHeight, width: up.imageWidth,
      resizeWidth: null, bytes: up.bytes, alt: node.attrs.alt, title: null, type: up.contentType, href: null,
      belowTheFold: false, topImage: false, internalRedirect: null, isProcessing: false, align: null, offset: false,
    };
  }
  for (const child of node.content || []) fillImages(child, images);
}

// Only a post that's live on the blog is mirrored, so the link back always works and nothing
// scheduled or local-only gets out. Right after a deploy the page can take a minute to appear.
async function isLive(url, attempts) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (res?.ok) return true;
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 15000));
  }
  return false;
}

const originLine = (url) => ({
  type: "paragraph",
  content: [
    { type: "text", text: "Originally published on ", marks: [{ type: "em" }] },
    { type: "text", text: "paultendo.github.io", marks: [{ type: "em" }, { type: "link", attrs: { href: url } }] },
    { type: "text", text: ".", marks: [{ type: "em" }] },
  ],
});

async function main() {
  const cookie = dryRun ? null : readCookie();
  if (!dryRun && !cookie) {
    console.log("::warning::No Substack session, so nothing was mirrored. Run `npm run substack:login -- --github` to set one up.");
    return;
  }
  const substack = cookie && new Substack(cookie);
  const author = substack && (await substack.author());

  let posts = await feedPosts();
  if (only) posts = posts.filter((p) => only.includes(p.id));

  const server = await serve(DIST);
  const local = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
  let failed = 0;

  try {
    for (const item of posts) {
      try {
        const existing = substack && (await substack.findBySlug(item.id));
        if (existing?.published) continue;

        const url = `${SITE}/posts/${item.id}/`;
        const post = await convertPost(browser, `${local}/posts/${item.id}/`, SITE);
        const doc = { type: "doc", content: [originLine(url), ...post.content] };
        const subtitle = post.deck || post.description;

        if (dryRun) {
          const dir = path.join(outDir, item.id);
          await mkdir(dir, { recursive: true });
          for (const image of post.images) if (image.png) await writeFile(path.join(dir, `image-${image.id}.png`), image.png);
          await writeFile(path.join(dir, "post.json"), JSON.stringify({ title: post.title, subtitle, doc, images: post.images.map(({ png, ...rest }) => rest) }, null, 2));
          console.log(`${item.id}: ${doc.content.length} blocks, ${post.images.length} images -> ${dir}`);
          continue;
        }

        const isNew = Date.now() - item.date.getTime() <= NEW_POST_DAYS * 864e5;
        if (!(await isLive(url, isNew ? 8 : 1))) {
          console.log(`${item.id}: not live on the blog, so not mirrored`);
          continue;
        }
        const bylines = [{ id: author.id, is_guest: false }];
        const draftId = existing?.id ?? (await substack.createDraft({
          draft_title: post.title, draft_subtitle: subtitle, draft_body: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
          draft_bylines: bylines, audience: "everyone", type: "newsletter",
        })).id;

        for (const image of post.images) {
          const source = image.png ? `data:image/png;base64,${image.png.toString("base64")}` : await imageSource(image.src);
          image.uploaded = await substack.uploadImage(source, draftId);
        }
        fillImages(doc, post.images);

        const fm = await frontmatter(item.id);
        const coverSrc = fm.featuredImage || fm.thumbnail ? SITE + (fm.featuredImage || fm.thumbnail) : post.ogImage;
        const cover = coverSrc ? await substack.uploadImage(await imageSource(coverSrc), draftId) : null;

        await substack.updateDraft(draftId, {
          draft_title: post.title,
          draft_subtitle: subtitle,
          draft_body: JSON.stringify(doc),
          draft_bylines: bylines,
          audience: "everyone",
          write_comment_permissions: "everyone",
          slug: item.id,
          description: subtitle,
          search_engine_title: post.title,
          search_engine_description: post.description,
          cover_image: cover?.url ?? null,
        });

        const send = !noEmail && isNew;
        await substack.publish(draftId, { send });
        if (!send) {
          await substack.updateDraft(draftId, { post_date: item.date.toISOString() }).catch((e) => console.log(`${item.id}: kept today's date (${e.message})`));
        }
        console.log(`${item.id}: published${send ? " and emailed" : ""} at https://${PUBLICATION}/p/${item.id}`);
      } catch (e) {
        failed++;
        console.log(`::error::${item.id}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) process.exitCode = 1;
}

await main();
