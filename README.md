# paultendo.github.io

Personal site and blog for Paul Wood FRSA ([@paultendo](https://github.com/paultendo)).

Live at **[paultendo.github.io](https://paultendo.github.io)**

## What this is

A static site built with [Astro](https://astro.build) for launching open-source projects and writing about software engineering. No framework bloat, no JavaScript required for reading, fast page loads.

Current content:
- [namespace-guard launch post](https://paultendo.github.io/posts/namespace-guard-launch/) — announcing the npm library

## Tech stack

- **Astro 5** — static site generator
- **MDX** — markdown with component support
- **Shiki** — syntax highlighting (Material Palenight theme)
- **GitHub Pages** — hosting
- **GitHub Actions** — automated deployment on push to `main`

## Local development

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:4321` with hot reload.

## Project structure

```
paultendo.github.io/
├── src/
│   ├── content/
│   │   └── posts/           # Blog posts (MDX)
│   ├── layouts/
│   │   ├── Base.astro       # Base HTML layout
│   │   └── Post.astro       # Blog post layout
│   ├── pages/
│   │   ├── index.astro      # Homepage
│   │   └── posts/[...id].astro  # Dynamic post routes
│   └── styles/
│       └── global.css       # Global styles
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages deployment
└── astro.config.mjs         # Astro configuration
```

## Writing a new post

Create a new `.mdx` file in `src/content/posts/`:

```mdx
---
title: "Your post title"
description: "Brief description for meta tags"
date: "2026-02-20"
tags: ["tag1", "tag2"]
---

Your content here.
```

The post will be available at `/posts/your-filename/`.

## Deployment

Automatic via GitHub Actions:
1. Push to `main`
2. Workflow builds the site (`npm run build`)
3. Deploys `dist/` to GitHub Pages

Manual build:
```bash
npm run build    # Outputs to dist/
npm run preview  # Preview the production build
```

## Design principles

- **No JavaScript required** for reading content
- **Clean typography** — Syne (display), Instrument Sans (body), Google Sans Code (mono)
- **Dark theme only** — intentionally styled, not a lazy default
- **Accessible** — semantic HTML, skip links, focus states, ARIA where needed
- **Fast** — static HTML, no client-side hydration, aggressive caching

## Author

Paul Wood FRSA
[@paultendo](https://github.com/paultendo)

Building [Oncor](https://oncor.io) and open-source tools like [namespace-guard](https://github.com/paultendo/namespace-guard).
