import {
  getArticlePath,
  getCachedArticles,
  getPublishedDate,
  type Article
} from "@/src/libs/microcms";
import { SITE_URL, categories, siteInfoLinks } from "@/src/libs/site-config";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type ArticleForSitemap = Article & {
  noIndex?: boolean;
  noindex?: boolean;
  no_index?: boolean;
  isAd?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  revisedAt?: string;
  createdAt?: string;
};

const staticUrls = [
  "/",
  ...siteInfoLinks.map((link) => link.href),
  ...categories
    .filter((category) => category.key !== "top")
    .map((category) => category.href)
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toAbsoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function isPublishedArticle(article: ArticleForSitemap) {
  if (!article.id) return false;
  if (article.isAd) return false;
  if (article.noIndex || article.noindex || article.no_index) return false;

  return true;
}

function getLastModified(article: ArticleForSitemap) {
  const date =
    article.updatedAt ||
    article.revisedAt ||
    getPublishedDate(article) ||
    article.publishedAt ||
    article.createdAt;

  const parsedDate = date ? new Date(date) : new Date();

  return Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();
}

function toUrlEntry(url: string, lastModified = new Date().toISOString()) {
  return `<url><loc>${escapeXml(url)}</loc><lastmod>${lastModified}</lastmod></url>`;
}

export async function GET() {
  let articles: ArticleForSitemap[] = [];

  try {
    articles = (await getCachedArticles()) as ArticleForSitemap[];
  } catch {
    articles = [];
  }

  const seen = new Set<string>();
  const urls = [
    ...staticUrls.map((path) => ({
      url: toAbsoluteUrl(path),
      lastModified: new Date().toISOString()
    })),
    ...articles.filter(isPublishedArticle).map((article) => ({
      url: toAbsoluteUrl(getArticlePath(article)),
      lastModified: getLastModified(article)
    }))
  ].filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => toUrlEntry(item.url, item.lastModified)).join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
