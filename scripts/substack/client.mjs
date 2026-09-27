// Substack's own web API, the one its editor uses. There is no official publishing API,
// so this signs requests with the session cookie from `npm run substack:login`.
import { execFileSync } from "node:child_process";

export const PUBLICATION = process.env.SUBSTACK_PUBLICATION || "paulwoodfrsa.substack.com";
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

  async request(method, path, body) {
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

  // A post or draft with this slug, if one exists
  async findBySlug(slug) {
    for (const kind of ["published", "drafts"]) {
      for (let offset = 0; ; offset += 50) {
        const page = await this.request("GET", `/api/v1/post_management/${kind}?offset=${offset}&limit=50&order_by=post_date&order_direction=desc`);
        const hit = page.posts.find((p) => p.slug === slug);
        if (hit) return { ...hit, published: kind === "published" };
        if (offset + page.posts.length >= page.total || !page.posts.length) break;
      }
    }
    return null;
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
