# paultendo.github.io

Personal blog / website for Paul Wood FRSA (@paultendo). Hosted on GitHub Pages at `https://paultendo.github.io`.

## Purpose

This is the personal site and blog for launching open-source projects. The immediate goal is a launch blog post for **namespace-guard** to accompany a Show HN and Reddit submission.

## What is namespace-guard?

namespace-guard is an npm library (v0.7.0) that solves the "shared URL namespace" problem for multi-tenant apps. When `yourapp.com/:slug` could be a user, an organization, or a reserved route like `/settings`, you need to check all of those in one call. namespace-guard does that.

### Key features

- **Multi-table uniqueness** — check users, orgs, teams etc. in one call with parallel DB queries
- **Reserved name blocking** — with categories and per-category messages
- **Ownership scoping** — no false "already taken" when updating your own handle
- **9 ORM adapters** — Prisma, Drizzle, Kysely, Knex, TypeORM, MikroORM, Sequelize, Mongoose, raw SQL
- **Conflict suggestions** — 7 pluggable strategies (sequential, random-digits, suffix-words, short-random, scramble, similar, custom functions)
- **Anti-spoofing** — NFKC Unicode normalization, homoglyph/confusable detection (Cyrillic/Greek→Latin), mixed-script rejection
- **Profanity validator** — bring-your-own word list with substring matching
- **Purely-numeric rejection** — Twitter/X-style blocking of all-number handles
- **LRU cache** with TTL and stats
- **CLI** — `npx namespace-guard check <slug>`
- **Interactive playground** — https://paultendo.github.io/namespace-guard/
- **Zero runtime dependencies**, full TypeScript, MIT license

### Origin

Extracted from Oncor (oncor.io), a music platform. The library is a generalized, ORM-agnostic version of the namespace checking pattern used there.

### Reference material

The full source code, README, tests, and playground are in the sibling folder:

```
/Users/pw/Code/namespace-guard/
```

You can (and should) read files from that folder for accurate details when writing content. Key files:

- `README.md` — full documentation with API reference, code examples, adapter docs
- `src/index.ts` — core library (~950 lines), all logic in one file
- `tests/index.test.ts` — 206 tests
- `CHANGELOG.md` — version history from 0.1.0 to 0.7.0
- `docs/index.html` — interactive playground (single-file, self-contained)
- `package.json` — npm metadata, 0.7.0

### npm

Published at https://www.npmjs.com/package/namespace-guard

### GitHub

https://github.com/paultendo/namespace-guard

## Blog post goals

The first blog post should:

1. **Explain the problem** — the shared namespace issue, why it's harder than it looks, how every multi-tenant SaaS has to solve it
2. **Show the solution** — namespace-guard, with code examples
3. **Mention Oncor** — where this was extracted from, lending credibility ("battle-tested in production")
4. **Highlight differentiators** — the feature comparison vs. DIY solutions, the anti-spoofing features, the 9 adapters
5. **Be written for an HN/Reddit audience** — technical, direct, no marketing fluff. Show, don't tell. Code examples > adjectives.
6. **Include a link to the playground** so readers can try it without installing anything
7. **Be a single, well-crafted HTML page** — matching the GitHub Pages hosting model

## Tech decisions

- **Static HTML** — no build step, no framework, just HTML/CSS served by GitHub Pages
- **Single page per post is fine** — this doesn't need to be a full blog platform yet
- **Clean, readable design** — good typography, code syntax highlighting, responsive
- **Light/dark mode** — follow system preference with `prefers-color-scheme`
- **No JavaScript required for reading** — progressive enhancement only

## Project structure

```
paultendo.github.io/
├── index.html          # Homepage / blog index
├── posts/
│   └── namespace-guard-launch.html  # Launch blog post
├── CLAUDE.md           # This file
└── (styles, assets as needed)
```

## Commands

```bash
# Preview locally (any static file server works)
npx serve .
# or
python3 -m http.server 8000
```

## Author

Paul Wood FRSA (@paultendo)
