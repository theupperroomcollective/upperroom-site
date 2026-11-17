// Content schemas. Every content file in src/content/ is checked against these
// at build time: a missing field, a too-long description or an image without
// alt text fails the build instead of shipping a broken page.
import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
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
    prelaunch: z
      .boolean()
      .default(false)
      .describe("true = pages show only the logo (linking home) instead of the full header and footer"),
    tagline: z.string(),
    description: z.string().max(160),
    email: z.email(),
    nav: z.array(
      z.union([
        // A group renders as a dropdown on desktop. Only one level deep.
        z.object({ label: z.string().min(1), children: z.array(link).min(1) }),
        link,
      ]),
    ),
    navCta: link,
    footerGroups: z.array(z.object({ heading: z.string(), links: z.array(link) })),
    legalLinks: z.array(link),
    footerScripture: z.object({ text: z.string(), reference: z.string() }),
  }),
});

// Legal pages: one Markdown file per page in src/content/legal/.
// The file name becomes the URL (privacy.md → /privacy).
const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    updated: z.coerce.date(),
    draft: z.boolean().default(true).describe("Shows a 'draft, pending legal review' notice while true"),
    live: z.boolean().default(true).describe("false = only visible in local dev (npm run dev), not built for production"),
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

// A form field for SheetForm. `name` becomes the column header in the Google Sheet.
const formField = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers and underscores, e.g. first_name"),
    label: z.string().min(1).describe("For consent fields, may include one [link text](/url)"),
    type: z.enum(["text", "email", "tel", "url", "textarea", "select", "checkboxes", "consent"]),
    required: z.boolean().default(false),
    autocomplete: z.string().optional(),
    options: z.array(z.string().min(1)).optional().describe("Required for select and checkboxes"),
    hint: z.string().optional().describe("Short help text shown under the label"),
    half: z.boolean().default(false).describe("Sit side by side with the next half-width field on wider screens"),
  })
  .refine((f) => !["select", "checkboxes"].includes(f.type) || (f.options && f.options.length > 0), {
    message: "Select and checkbox fields need at least one option",
  });

const interest = defineCollection({
  loader: file("src/content/interest.yaml"),
  schema: z.object({
    seo: z.object({ title: z.string().max(70), description: z.string().max(160) }),
    heading: z.string(),
    lede: z.string(),
    form: z.object({
      name: z.string().min(1).max(90).describe("Google Sheet tab that receives the rows"),
      submitLabel: z.string().min(1),
      success: z.object({ heading: z.string(), body: z.string() }),
      fields: z.array(formField).min(1),
    }),
  }),
});

export const collections = { pillars, site, home, legal, interest };
