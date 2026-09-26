// The tools, once: the homepage and the Tools page both read this, so they never drift apart.

export interface ToolLink {
  label: string;
  href: string;
}

export interface Tool {
  id: "tothepenny" | "namespace-guard" | "confusable-vision" | "d0ma1n";
  name: string;
  badge: string;
  live?: boolean;
  tagline: string;
  blurb: string;
  description: string;
  stats: [string, string][];
  primary: ToolLink;
  links: ToolLink[];
  /** Other projects that use it, each linked to where the use can be checked. */
  usedBy?: ToolLink[];
}

export const TOOLS: Tool[] = [
  {
    id: "tothepenny",
    name: "tothepenny",
    badge: "In your browser",
    live: true,
    tagline: "Does it add up?",
    blurb: "Bank statement PDFs to a spreadsheet, checked against the balances the bank printed.",
    description:
      "Drop in PDF bank statements. tothepenny reads every line, checks it against the bank's own balances, and hands you a spreadsheet, with gaps between statements and transfers between accounts marked. It runs in the tab, so the statements never leave your computer.",
    stats: [
      ["14", "banks"],
      ["77.5%", "rows checked singly"],
      ["0", "uploads"],
    ],
    primary: { label: "Open", href: "/tothepenny" },
    links: [
      { label: "How it works", href: "/posts/tothepenny/" },
      { label: "GitHub", href: "https://github.com/paultendo/tothepenny" },
    ],
  },
  {
    id: "confusable-vision",
    name: "confusable-vision",
    badge: "Research",
    tagline: "Which characters pass for one another?",
    blurb: "The world's first font-by-font confusables dataset: rays cast through glyph outlines measure how alike two characters look.",
    description:
      "Measures how alike Unicode characters look, font by font, at the size and baseline position each glyph has in running text. RaySpace casts rays through each glyph's outline and compares what they hit, within one font and across fonts, the way a browser shows a rare-script character next to Latin. Every letter and digit in 322 fonts is compared, and the lookalikes of ASCII letters are checked in place, in common fonts at the size people read them. Released as a versioned dataset.",
    stats: [
      ["11.5K", "lookalike pairs"],
      ["65K", "characters measured"],
      ["78", "proposed to Unicode"],
    ],
    primary: { label: "What changed", href: "/posts/rayspace-release-2/" },
    links: [
      { label: "Method", href: "/posts/rayspace-methodology/" },
      { label: "GitHub", href: "https://github.com/paultendo/confusable-vision" },
    ],
    usedBy: [
      { label: "Mozilla addons.mozilla.org", href: "https://github.com/mozilla/addons-server/blob/master/src/olympia/amo/confusables.py" },
      { label: "disarm", href: "https://github.com/raeq/disarm/blob/main/data/confusables_vision.tsv" },
      { label: "SilverSpeak", href: "https://github.com/ACMCMC/silverspeak/blob/main/docs/hkb.md" },
    ],
  },
  {
    id: "namespace-guard",
    name: "namespace-guard",
    badge: "npm",
    tagline: "Is this name really free?",
    blurb: "One call checks users, organisations, reserved routes and lookalikes before a name is claimed.",
    description:
      "When yourapp.com/:slug could be a user, an organisation or a reserved route, namespace-guard checks all of them in one call. Uniqueness across tables in parallel, NFKC normalisation, homoglyph detection from Unicode's latest confusables data plus 2,300 measured lookalike pairs, profanity filtering and suggestions when a name is taken.",
    stats: [
      ["9", "ORM adapters"],
      ["7", "suggestion strategies"],
      ["v0.23", "latest"],
    ],
    primary: { label: "GitHub", href: "https://github.com/paultendo/namespace-guard" },
    links: [{ label: "npm", href: "https://www.npmjs.com/package/namespace-guard" }],
    usedBy: [
      { label: "agent-sanitizer", href: "https://github.com/AlexanderMattTurner/agent-sanitizer" },
      { label: "deps.dev", href: "https://deps.dev/npm/namespace-guard/0.20.0/dependents" },
    ],
  },
  {
    id: "d0ma1n",
    name: "d0ma1n",
    badge: "Live",
    live: true,
    tagline: "Who is registering your name?",
    blurb: "Lookalikes of your domain that a browser would actually display, and which are already registered.",
    description:
      "Enter a domain and get back its lookalikes, scored by how alike they look, with the ones already registered flagged. Each variant is checked against what the registry actually accepts, for 1,403 TLDs, and a registered lookalike is reported even where today's rules would refuse it. Built on confusable-vision's measurements and namespace-guard's matching, running as a Cloudflare Worker with DNS lookups over HTTPS.",
    stats: [
      ["2,300", "measured pairs"],
      ["1,403", "TLDs checked"],
      ["DoH", "DNS lookups"],
    ],
    primary: { label: "Try it", href: "https://d0ma1n.app" },
    links: [{ label: "GitHub", href: "https://github.com/paultendo/d0ma1n" }],
  },
];
