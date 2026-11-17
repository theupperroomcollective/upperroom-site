# The Upper Room Collective website — rules for Claude

Read this whole file before making any change. These rules protect the site's design and keep it from breaking.
The people asking you for changes are often not developers: explain in plain language, and never leave them with a broken page.

## What this is
A small brochure site for The Upper Room Collective, a faith-driven founder accelerator in the San Francisco Bay Area.
Built with **Astro** (static HTML, almost no JavaScript). Hosting: Vercel. Analytics: Fathom.

## Pages (the full site for now)
| Page | URL | Status |
|---|---|---|
| Home | `/` | Built (first-pass layout) |
| About | `/about` | Waiting for content and design |
| Founder Run Club | `/run-club` | Waiting for content and design |
| Founder Masterclasses | `/masterclasses` | Waiting for content and design |
| Founder Design Studio | `/studio` | Waiting for content and design |
| Contact | `/contact` | Waiting for content and design |
| Join the Collective | `/join` | Waiting for content and design |

Founder Dinners and Founder Podcast are "Coming soon" cards on the home page only, with no pages and no links. Don't add pages beyond this list without the owner's approval.

## Where things live
| What | Where |
|---|---|
| Page copy (text) | `src/content/*.yaml` — edit here first |
| Site name, nav, footer links | `src/content/site.yaml` |
| The five pillars | `src/content/pillars.yaml` |
| Rules for content files | `src/content.config.ts` (schemas) |
| Pages | `src/pages/` (one file per URL) |
| Building blocks | `src/components/` |
| Page shell (head, header, footer, analytics) | `src/layouts/BaseLayout.astro` |
| Colors, fonts, sizes, spacing | `src/styles/tokens.css` — the only place raw values live |
| Global element styles | `src/styles/base.css` |
| Images | `public/images/` |
| Living style guide | `/styleguide` (`src/pages/styleguide.astro`) |
| The original HTML site (reference only, not served) | `reference/legacy-site/` |

## The design system — non-negotiable
1. **Three brand colors only:** wine `#650D22`, ivory `#F8F3EA`, stone `#0D0B0B`. Every other color is a shade derived from these in `tokens.css`. Never add a new color, gradient, or opacity trick to get a "new" color.
2. **Color comes from surfaces.** A section sets `surface="ivory" | "ivory-deep" | "wine" | "stone"` and everything inside recolors automatically. Components use semantic tokens (`--text-heading`, `--text-body`, `--accent`, `--surface`, `--border`…), never brand or scale tokens directly.
3. **Never put wine text on stone or stone text on wine** (1.5:1 contrast).
4. **Two fonts only:** EB Garamond for headings (`--font-display`), Instrument Sans for everything else (`--font-body`). No other fonts, no font weights above 600.
5. **Use the scales.** Font sizes `--text-*`, spacing `--space-*`, radius `--radius-*`. No raw `px`/`rem` values for these in components.
6. **Build pages from existing components** (`Section`, `Eyebrow`, `Button`, `Media`, `Scripture`, `PillarCard`, `NewsletterForm`). A new component needs the owner's approval first: ask before creating one, and add it to `/styleguide` when you do.
7. **Stylelint enforces 1, 4 and 5.** If it complains, fix the code to use a token. Never disable a lint rule or add `stylelint-disable` to get past it.

## Avoid AI slop
Do not add: gradients, glassmorphism, glows, emoji, icon-in-a-circle feature grids, stock "Unlock your potential"-style copy, drop shadows on everything, animated counters, decorative blobs, or anything the brand doesn't already use. Do not invent copy, testimonials, statistics, people, dates or scripture. If copy is missing, leave a clearly marked placeholder and say so. Restraint is the aesthetic: generous space, serif headlines, quiet color.

## Accessibility — every change
- One `<h1>` per page; headings in order (h2 → h3, no skipping).
- Every `Section` gets `labelledby` (its heading's id) or `label`.
- Every image needs real `alt` text, `width` and `height` (the content schema enforces this). Decorative images use `alt=""`.
- Links say where they go ("Read Our Story", not "Click here").
- Motion must respect `prefers-reduced-motion` (base.css handles transitions; wrap any new animation in `@media (prefers-reduced-motion: no-preference)`).
- Interactive elements are at least 44×44px and have a visible focus style (base.css provides it — don't remove outlines).

## Content and copy
- Voice: reverent, ambitious, warm, invitational. Short declarative headlines ending in periods. Scripture always cited with translation, e.g. "1 Corinthians 2:9 (NIV)".
- American English. Curly quotes and apostrophes (’ “ ”).
- SEO title ≤ 70 characters, description ≤ 160 (the schema enforces it).

## Images
- Put files in `public/images/<page-or-topic>/`, lowercase-hyphenated names (`run-club-golden-gate.jpg`).
- Export JPG or WebP, max 2400px on the long edge, under ~400 KB. Never commit multi-MB PNG photos.
- Placeholders live in `public/images/placeholders/` and their alt text starts with "Placeholder".

## Forms
Forms are not connected yet (a spreadsheet hookup is planned). Don't wire them to any third-party service without the owner's approval. Keep the honeypot field.

## How to make a change
1. Work on a branch, never directly on `main`. Name it for the change: `update-home-hero-copy`.
2. For text changes, edit the YAML in `src/content/` only.
3. Run `npm run verify` (type check + style lint + build). It must pass.
4. Open a pull request with a plain-language summary. Vercel posts a preview link; check the page at phone and desktop width.
5. The owner reviews and merges. Never merge your own PR, force-push, or change `.github/`, `astro.config.mjs`, `tokens.css` or this file unless the owner asked.

## Commands
```bash
npm install        # first time only
npm run dev        # local preview at http://localhost:4321
npm run verify     # must pass before every PR
```

## Settings (environment variables, set in Vercel)
- `SITE_URL` — the production domain, once decided.
- `PUBLIC_FATHOM_SITE_ID` — turns on Fathom analytics.
- `BLOCK_INDEXING` — anything except `false` keeps search engines out (default). Set to `false` at launch.
