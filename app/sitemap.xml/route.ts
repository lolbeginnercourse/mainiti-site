import {
  getArticlePath,
  getCachedArticles,
  getPublishedDate,
  type Article,
  type MainCategory
} from "@/src/libs/microcms";
import {
  SITE_URL,
  categories,
  categoryAliasMap,
  categoryNames,
  siteInfoLinks
} from "@/src/libs/site-config";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type ArticleForSitemap = Article & {
  category?: CmsCategoryValue;
  categories?: CmsCategoryValue;
  tags?: string[] | string;
  subTags?: string[] | string;
  main_category?: CmsCategoryValue;
  maincategory?: CmsCategoryValue;
  noIndex?: boolean;
  noindex?: boolean;
  no_index?: boolean;
  isAd?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  revisedAt?: string;
  createdAt?: string;
};

type CmsCategoryObject = {
  id?: string;
  name?: string;
  title?: string;
  value?: string;
  label?: string;
  text?: string;
  key?: string;
};

type CmsCategoryValue =
  | string
  | string[]
  | CmsCategoryObject
  | CmsCategoryObject[];

const staticUrls = ["/", "/articles", "/authors/akari", ...siteInfoLinks.map((link) => link.href)];

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

function getCategoryTextCandidates(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => getCategoryTextCandidates(item));
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    return [
      record.name,
      record.title,
      record.value,
      record.label,
      record.text,
      record.key,
      record.id
    ].flatMap((item) => getCategoryTextCandidates(item));
  }

  return [];
}

function findArticleCategories(values: string[]): MainCategory[] {
  const foundCategories: MainCategory[] = [];

  for (const value of values) {
    const cleanedValue = value.replace(/^#/, "").trim();

    if (!cleanedValue) {
      continue;
    }

    const aliasCategory = categoryAliasMap[cleanedValue];

    if (aliasCategory && !foundCategories.includes(aliasCategory)) {
      foundCategories.push(aliasCategory);
      continue;
    }

    for (const category of categoryNames) {
      if (
        (cleanedValue === category || cleanedValue.includes(category)) &&
        !foundCategories.includes(category)
      ) {
        foundCategories.push(category);
      }
    }
  }

  return foundCategories;
}

function getArticleCategories(article: ArticleForSitemap): MainCategory[] {
  const articleRecord = article as Record<string, unknown>;
  const primaryValues = [
    articleRecord.category,
    articleRecord.categories,
    articleRecord.tags,
    articleRecord.subTags
  ].flatMap((value) => getCategoryTextCandidates(value));
  const primaryCategories = findArticleCategories(primaryValues);

  if (primaryCategories.length > 0) {
    return primaryCategories;
  }

  const fallbackValues = [
    articleRecord.mainCategory,
    articleRecord.main_category,
    articleRecord.maincategory
  ].flatMap((value) => getCategoryTextCandidates(value));
  const fallbackCategories = findArticleCategories(fallbackValues);

  return fallbackCategories.length > 0 ? fallbackCategories : ["暮らし"];
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
  const publishedArticles = articles.filter(isPublishedArticle);
  const categoryUrls = categories
    .filter((category) => {
      if (category.key === "top") return false;

      return publishedArticles.some((article) =>
        getArticleCategories(article).includes(category.key as MainCategory)
      );
    })
    .map((category) => category.href);

  const urls = [
    ...[...staticUrls, ...categoryUrls].map((path) => ({
      url: toAbsoluteUrl(path),
      lastModified: new Date().toISOString()
    })),
    ...publishedArticles.map((article) => ({
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
