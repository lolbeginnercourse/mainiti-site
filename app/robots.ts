import type { MetadataRoute } from "next";

const SITE_URL = "https://mainitiwo.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/search",
          "/search/",
          "/*?q=",
          "/*&q=",
          "/*?sort=",
          "/*&sort=",
          "/*?tag=",
          "/*&tag=",
          "/*?category=",
          "/*&category="
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
