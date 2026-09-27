// Turns a built post page into Substack's document format. Text, links, lists and code come
// across as themselves; anything Substack can't show (tables, panels, diagrams) becomes a
// screenshot of the blog's own rendering, in its light theme.

// Runs in the page. Images are left as "__image:N" placeholders for the uploader.
function walk(site) {
  const BLOCK = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre", "hr", "figure", "table", "aside", "div", "section", "img", "details"]);
  const MARKS = { strong: "strong", b: "strong", em: "em", i: "em", code: "code", s: "strikethrough", del: "strikethrough", sup: "superscript", sub: "subscript" };
  const images = [];

  const abs = (href) => {
    try {
      const url = new URL(href, location.href);
      return url.origin === location.origin ? site + url.pathname + url.search + url.hash : url.href;
    } catch {
      return href;
    }
  };
  const clean = (text) => text.replace(/\s+/g, " ").trim();

  const captioned = (id, alt, caption) => ({
    type: "captionedImage",
    content: [
      { type: "image2", attrs: { src: `__image:${id}`, alt: alt || null } },
      ...(caption ? [{ type: "caption", content: [{ type: "text", text: caption }] }] : []),
    ],
  });
  const imageFrom = (img, caption) => {
    const id = images.length;
    images.push({ id, kind: "file", src: abs(img.getAttribute("src")), alt: img.alt });
    return captioned(id, img.alt, caption);
  };
  // What a screenshot shows, in words, for its alt text
  const describe = (el) => {
    if (el.tagName === "TABLE") {
      return [...el.rows].map((r) => [...r.cells].map((c) => clean(c.textContent)).join(", ")).join("; ").slice(0, 1000);
    }
    // Each piece of text separately, so a diagram's labels don't run together
    const parts = [];
    const texts = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest("style, script") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    while (texts.nextNode()) parts.push(texts.currentNode.nodeValue);
    return clean(parts.join(" ")).slice(0, 1000);
  };
  const shot = (el, caption) => {
    const id = images.length;
    el.setAttribute("data-mirror-shot", String(id));
    images.push({ id, kind: "shot", element: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""), alt: describe(el) });
    return captioned(id, describe(el), caption);
  };

  function inline(node, marks = [], out = []) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue.replace(/\s+/g, " ");
        if (text) out.push(marks.length ? { type: "text", text, marks } : { type: "text", text });
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === "br") out.push({ type: "hard_break" });
      else if (["img", "script", "style", "svg", "button"].includes(tag) || child.matches(".heading-anchor, .code-lang")) continue;
      else if (tag === "a" && child.getAttribute("href")) inline(child, [...marks, { type: "link", attrs: { href: abs(child.getAttribute("href")) } }], out);
      else {
        const mark = MARKS[tag];
        inline(child, mark && !marks.some((m) => m.type === mark) ? [...marks, { type: mark }] : marks, out);
      }
    }
    return out;
  }

  // Trims the ends of a run, drops empty text and joins neighbours with the same marks
  function tidy(nodes) {
    const out = [];
    for (const n of nodes) {
      const prev = out[out.length - 1];
      if (n.type === "text" && prev && prev.type === "text" && JSON.stringify(prev.marks || []) === JSON.stringify(n.marks || [])) prev.text += n.text;
      else out.push({ ...n });
    }
    while (out.length && out[0].type === "text" && !(out[0].text = out[0].text.replace(/^\s+/, ""))) out.shift();
    while (out.length && out[out.length - 1].type === "text" && !(out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, ""))) out.pop();
    while (out.length && out[out.length - 1].type === "hard_break") out.pop();
    return out;
  }

  const paragraph = (el) => {
    const content = tidy(inline(el));
    return content.length ? [{ type: "paragraph", content }] : [];
  };

  function listItem(li) {
    const content = [];
    let run = document.createElement("span");
    const flush = () => {
      content.push(...paragraph(run));
      run = document.createElement("span");
    };
    for (const n of [...li.childNodes]) {
      if (n.nodeType === Node.ELEMENT_NODE && BLOCK.has(n.tagName.toLowerCase())) {
        flush();
        content.push(...block(n));
      } else run.appendChild(n.cloneNode(true));
    }
    flush();
    if (content[0]?.type !== "paragraph") content.unshift({ type: "paragraph" });
    return { type: "list_item", content };
  }

  const blocks = (el) => [...el.children].flatMap(block);

  function block(el) {
    const tag = el.tagName.toLowerCase();
    if (el.matches("details.toc, script, style, template, nav")) return [];
    if (tag === "p") {
      const imgs = [...el.querySelectorAll("img")];
      if (imgs.length && !clean(el.textContent)) return imgs.map((img) => imageFrom(img));
      return paragraph(el);
    }
    if (/^h[1-6]$/.test(tag)) return [{ type: "heading", attrs: { level: Math.max(2, Number(tag[1])) }, content: tidy(inline(el)) }];
    if (tag === "ul" || tag === "ol") {
      const items = [...el.children].filter((c) => c.tagName === "LI").map(listItem);
      return [tag === "ul" ? { type: "bullet_list", content: items } : { type: "ordered_list", attrs: { start: Number(el.getAttribute("start") || 1) }, content: items }];
    }
    if (tag === "blockquote") return [{ type: "blockquote", content: blocks(el) }];
    if (tag === "hr") return [{ type: "horizontal_rule" }];
    if (tag === "pre" && !el.classList.contains("mermaid")) {
      const text = (el.querySelector("code") || el).textContent.replace(/\n$/, "");
      return [{ type: "code_block", attrs: { language: el.dataset.language || null }, content: text ? [{ type: "text", text }] : [] }];
    }
    if (tag === "img") return [imageFrom(el)];
    if (["small", "span", "strong", "em", "a", "code"].includes(tag)) return paragraph(el);
    if (tag === "figure") {
      const imgs = el.querySelectorAll("img");
      const caption = el.querySelector("figcaption");
      const plain = imgs.length === 1 && [...el.children].every((c) => c.tagName === "IMG" || c.tagName === "FIGCAPTION" || (c.tagName === "P" && c.querySelector("img")));
      if (plain) return [imageFrom(imgs[0], caption && clean(caption.textContent))];
      // A drawn figure is pictured without its caption, which becomes Substack's own
      const drawn = [...el.children].filter((c) => c.tagName !== "FIGCAPTION");
      return [caption && drawn.length === 1 ? shot(drawn[0], clean(caption.textContent)) : shot(el)];
    }
    if (tag === "aside" && el.classList.contains("callout")) {
      const label = el.querySelector(".callout-label");
      const body = el.querySelector(".callout-body") || el;
      return [{
        type: "calloutBlock",
        content: [
          ...(label && clean(label.textContent) ? [{ type: "paragraph", content: [{ type: "text", text: clean(label.textContent), marks: [{ type: "strong" }] }] }] : []),
          ...blocks(body),
        ],
      }];
    }
    // A plain wrapper around blocks we know is unwrapped; anything else is shown as the blog draws it
    if ((tag === "div" || tag === "section") && !/mermaid|grid|chart|visual/.test(el.className) && el.children.length && [...el.children].every((c) => BLOCK.has(c.tagName.toLowerCase()) && c.tagName !== "DIV")) {
      return blocks(el);
    }
    return [shot(el)];
  }

  const prose = document.querySelector("article .prose, .prose");
  const content = blocks(prose);
  const meta = (name) => document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content || null;
  return {
    title: clean(document.querySelector("h1")?.textContent || document.title),
    deck: clean(document.querySelector(".post-deck")?.textContent || "") || null,
    description: meta("description"),
    ogImage: meta("og:image"),
    content,
    images,
  };
}

// Loads a post page, converts it, and takes the screenshots it asked for
export async function convertPost(browser, url, site) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("theme", "light"); } catch {}
  });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await page.addStyleTag({ content: "*{animation:none!important;transition:none!important} .reveal,[data-reveal]{opacity:1!important;transform:none!important}" });
  await page.waitForFunction(() => [...document.querySelectorAll("pre.mermaid")].every((p) => p.querySelector("svg")), { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);

  const post = await page.evaluate(walk, site);
  for (const image of post.images) {
    if (image.kind !== "shot") continue;
    // A table's box can run wider than its columns, so it's measured by its cells
    const box = await page.$eval(`[data-mirror-shot="${image.id}"]`, (el) => {
      const rects = el.tagName === "TABLE" ? [...el.querySelectorAll("th, td")].map((c) => c.getBoundingClientRect()) : [el.getBoundingClientRect()];
      const left = Math.min(...rects.map((r) => r.left)), top = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right)), bottom = Math.max(...rects.map((r) => r.bottom));
      return { x: left + scrollX, y: top + scrollY, width: right - left, height: bottom - top };
    });
    const pad = 16;
    image.png = await page.screenshot({
      type: "png",
      captureBeyondViewport: true,
      clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
    });
  }
  await page.close();
  return post;
}
