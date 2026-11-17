// Content schemas. Every content file in src/content/ is checked against these
// at build time: a missing field, a too-long description or an image without
// alt text fails the build instead of shipping a broken page.
import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const image = z.object({
  src: z.string().min(1).describe("Path under /public, e.g. /images/placeholders/hero.svg"),
  alt: z.string().min(1, "Every image needs alt text. Use an empty string only via decorative: true."),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const pillars = defineCollection({
  loader: file("src/content/pillars.yaml"),
  schema: z.object({
    order: z.number().int().min(1).max(5),
    verb: z.string(),
    title: z.string(),
    summary: z.string().max(160),
    href: z.string().optional().describe("Leave out for pillars with no page yet"),
    cta: z.string().optional(),
    status: z.enum(["Waitlist open", "Invitation only", "Coming soon"]).optional(),
    image,
  }),
});

const site = defineCollection({
  loader: file("src/content/site.yaml"),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string().max(160),
    email: z.email(),
    nav: z.array(link),
    navCta: link,
    footerGroups: z.array(z.object({ heading: z.string(), links: z.array(link) })),
    footerScripture: z.object({ text: z.string(), reference: z.string() }),
  }),
});

const home = defineCollection({
  loader: file("src/content/home.yaml"),
  schema: z.object({
    seo: z.object({ title: z.string().max(70), description: z.string().max(160) }),
    hero: z.object({
      heading: z.string(),
      kicker: z.string(),
      lede: z.string(),
      primary: link,
      secondary: link,
      image,
      scripture: z.object({ text: z.string(), reference: z.string() }),
    }),
    audience: z.object({
      eyebrow: z.string(),
      heading: z.string(),
      lede: z.string(),
      points: z.array(z.string()).min(1).max(5),
      link,
    }),
    mandate: z.object({
      eyebrow: z.string(),
      words: z.array(z.string()).length(3),
      purpose: z.array(z.string()),
    }),
    ecosystem: z.object({
      eyebrow: z.string(),
      heading: z.string(),
      strap: z.string(),
      body: z.string(),
      impact: z.array(z.string()),
    }),
    story: z.object({
      eyebrow: z.string(),
      quote: z.string(),
      name: z.string(),
      role: z.string(),
      link: link.optional(),
    }),
    closing: z.object({
      lines: z.array(z.string()).min(1),
      primary: link,
      secondary: link,
    }),
  }),
});

export const collections = { pillars, site, home };
