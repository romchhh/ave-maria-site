import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/i18n/seo";

const PRIVATE = ["/admin/", "/api/", "/final", "/wishlist"];

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feeds/"],
        disallow: PRIVATE,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: new URL(base).host,
  };
}
