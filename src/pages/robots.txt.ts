// robots.txt is generated so it always points at the current domain (SITE_URL).
// Until the real domain is set and launch is approved, BLOCK_INDEXING keeps
// search engines out. Remove the env var at launch.
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const blocked = import.meta.env.BLOCK_INDEXING !== "false";
  const body = blocked
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /styleguide\n\nSitemap: ${new URL("/sitemap.xml", site)}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
