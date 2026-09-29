// Substack's own web API, the one its editor uses. There is no official publishing API,
// so this signs requests with the session cookie from `npm run substack:login`.
import { execFileSync } from "node:child_process";

export const PUBLICATION = process.env.SUBSTACK_PUBLICATION || "paultendo.substack.com";
const KEYCHAIN_SERVICE = "substack-mirror";

export function readCookie() {
  if (process.env.SUBSTACK_COOKIE) return process.env.SUBSTACK_COOKIE;
  if (process.platform === "darwin") {
    try {
      return execFileSync("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"], { encoding: "utf8" }).trim();
    } catch {}
  }
  return null;
}

export function saveCookie(cookie) {
  execFileSync("security", ["add-generic-password", "-U", "-s", KEYCHAIN_SERVICE, "-a", "cookie", "-w", cookie]);
}

export class Substack {
  constructor(cookie, host = PUBLICATION) {
    this.cookie = cookie;
    this.base = `https://${host}`;
  }

  // Substack answers bursts with 429; wait as long as it asks (or longer each time) and try again
  async request(method, path, body, attempt = 0) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        Cookie: this.cookie,
        Origin: this.base,
        Referer: `${this.base}/publish/home`,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (res.status === 429 && attempt < 6) {
      const wait = Number(res.headers.get("retry-after")) || 30 * 2 ** attempt;
      console.log(`  Substack asked to slow down; waiting ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      return this.request(method, path, body, attempt + 1);
    }
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }

  // The publication's admin, who goes on the byline
  async author() {
    const users = await this.request("GET", "/api/v1/publication/users");
    const admin = users.find((u) => u.role === "admin") || users[0];
    if (!admin) throw new Error("No author found: is the session signed in to this publication?");
    return admin;
  }

  // Every post and draft, by slug
  async existing() {
    const bySlug = new Map();
    for (const kind of ["drafts", "published"]) {
      const order = kind === "published" ? "post_date" : "draft_updated_at";
      for (let offset = 0; ; offset += 50) {
        const page = await this.request("GET", `/api/v1/post_management/${kind}?offset=${offset}&limit=50&order_by=${order}&order_direction=desc`);
        for (const p of page.posts) if (p.slug) bySlug.set(p.slug, { ...p, published: kind === "published" });
        if (offset + page.posts.length >= page.total || !page.posts.length) break;
      }
    }
    return bySlug;
  }

  // Takes a data: URI, or the address of an image for Substack to fetch
  uploadImage(image, postId) {
    return this.request("POST", "/api/v1/image", { image, ...(postId ? { postId } : {}) });
  }

  createDraft(fields) {
    return this.request("POST", "/api/v1/drafts", fields);
  }

  updateDraft(id, fields) {
    return this.request("PUT", `/api/v1/drafts/${id}`, fields);
  }

  async publish(id, { send }) {
    await this.request("GET", `/api/v1/drafts/${id}/prepublish`);
    return this.request("POST", `/api/v1/drafts/${id}/publish`, { send, saved_segment_id: null });
  }
}
