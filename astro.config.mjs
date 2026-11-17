// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The production domain is not decided yet. Set SITE_URL in the hosting
// environment once it is; canonical URLs and social images use it.
const site = process.env.SITE_URL || "https://example.com";

// Prelaunch: only the sign-up home page (/) and the Privacy Policy are built.
// Draft pages in src/drafts/ are served by `npm run dev` only, so the team can keep
// designing them without anything being public. At launch, move them back to src/pages/.
/** @type {import("astro").AstroIntegration} */
const localDrafts = {
  name: "local-drafts",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      if (command !== "dev") return;
      injectRoute({ pattern: "/draft/home", entrypoint: "./src/drafts/home.astro" });
      injectRoute({ pattern: "/styleguide", entrypoint: "./src/drafts/styleguide.astro" });
    },
  },
};

export default defineConfig({
  site,
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [localDrafts, sitemap({ filter: (page) => !page.includes("/styleguide") && !page.includes("/404") })],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "EB Garamond",
      cssVariable: "--font-eb-garamond",
      weights: [400, 500],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Instrument Sans",
      cssVariable: "--font-instrument-sans",
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
    },
  ],
});
