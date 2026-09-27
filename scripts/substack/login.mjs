// Keeps your Substack session in your macOS Keychain, and with --github also as the
// SUBSTACK_COOKIE secret that the deploy mirrors with. The session itself is never printed.
//
//   npm run substack:login -- --github --from-clipboard
//     takes the substack.sid cookie you copied from a browser where you're signed in
//     (DevTools > Application > Cookies > https://substack.com), then clears the clipboard
//   npm run substack:login -- --github
//     opens a Chrome window to sign in, though Substack may not send sign-in emails to it
import { mkdtemp } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { Substack, saveCookie } from "./client.mjs";

const github = process.argv.includes("--github");

async function fromClipboard() {
  const copied = execFileSync("pbpaste", { encoding: "utf8" }).trim();
  execFileSync("pbcopy", { input: "" });
  if (!copied) throw new Error("The clipboard is empty: copy the substack.sid cookie's value first.");
  return copied.includes("substack.sid=") ? copied : `substack.sid=${copied}`;
}

async function fromBrowser() {
  const { default: puppeteer } = await import("puppeteer-core");
  const { chromePath } = await import("./chrome.mjs");
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
  try {
    for (const started = Date.now(); Date.now() - started < 10 * 60 * 1000; await new Promise((r) => setTimeout(r, 2000))) {
      const { cookies } = await cdp.send("Network.getAllCookies");
      const jar = cookies.filter((c) => c.domain.replace(/^\./, "").endsWith("substack.com") && ["substack.sid", "substack.lli"].includes(c.name));
      if (!jar.some((c) => c.name === "substack.sid")) continue;
      const candidate = jar.map((c) => `${c.name}=${c.value}`).join("; ");
      try {
        await new Substack(candidate).author();
        return candidate;
      } catch {}
    }
    throw new Error("Timed out waiting for sign-in.");
  } finally {
    await browser.close();
  }
}

try {
  const cookie = process.argv.includes("--from-clipboard") ? await fromClipboard() : await fromBrowser();
  let author;
  try {
    author = await new Substack(cookie).author();
  } catch {
    throw new Error("Substack didn't accept that session. Copy the substack.sid value again from a signed-in browser.");
  }
  if (process.platform === "darwin") saveCookie(cookie);
  if (github) {
    const r = spawnSync("gh", ["secret", "set", "SUBSTACK_COOKIE", "--repo", "paultendo/paultendo.github.io"], { input: cookie, stdio: ["pipe", "inherit", "inherit"] });
    if (r.status !== 0) throw new Error("Couldn't save the GitHub secret.");
  }
  console.log(`Signed in as ${author.name}. Session saved to your Keychain${github ? " and to GitHub" : ""}.`);
} catch (e) {
  console.log(e.message);
  process.exit(1);
}
