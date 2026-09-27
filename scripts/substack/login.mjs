// Opens Chrome so you can sign in to Substack, then keeps the session in your macOS Keychain.
// With --github it's also saved as the SUBSTACK_COOKIE secret that the deploy mirrors with.
// The session itself is never printed.
import { mkdtemp } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { chromePath } from "./chrome.mjs";
import { Substack, saveCookie, PUBLICATION } from "./client.mjs";

const github = process.argv.includes("--github");
const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: false,
  defaultViewport: null,
  userDataDir: await mkdtemp(path.join(os.tmpdir(), "substack-login-")),
  args: ["--no-first-run", "--no-default-browser-check"],
});
const [page] = await browser.pages();
await page.goto("https://substack.com/sign-in");
console.log("Sign in to Substack in the Chrome window that just opened. This carries on once you're in.");

const cdp = await page.createCDPSession();
let cookie = null;
let author = null;
for (const started = Date.now(); Date.now() - started < 10 * 60 * 1000; await new Promise((r) => setTimeout(r, 2000))) {
  const { cookies } = await cdp.send("Network.getAllCookies");
  const jar = cookies.filter((c) => c.domain.replace(/^\./, "").endsWith("substack.com") && ["substack.sid", "substack.lli"].includes(c.name));
  if (!jar.some((c) => c.name === "substack.sid")) continue;
  const candidate = jar.map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    author = await new Substack(candidate).author();
    cookie = candidate;
    break;
  } catch {}
}
await browser.close();
if (!cookie) {
  console.log("Timed out waiting for sign-in.");
  process.exit(1);
}

if (process.platform === "darwin") saveCookie(cookie);
if (github) {
  const r = spawnSync("gh", ["secret", "set", "SUBSTACK_COOKIE", "--repo", "paultendo/paultendo.github.io"], { input: cookie, stdio: ["pipe", "inherit", "inherit"] });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`Signed in as ${author.name}. Session saved to your Keychain${github ? " and to GitHub" : ""}.`);
