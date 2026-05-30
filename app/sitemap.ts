import type { MetadataRoute } from "next";
import {
  getArticlePath,
  getArticles,
  getPublishedDate,
  type Article
} from "@/src/libs/microcms";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const SITE_URL = "https://mainitiwo.com";

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

const staticPages: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1
  },
  {
    url: `${SITE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    url: `${SITE_URL}/disclaimer`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    url: `${SITE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5
  }
];

const categoryPages: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/category/kurashi`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  },
  {
    url: `${SITE_URL}/category/bousai`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  },
  {
    url: `${SITE_URL}/category/kaden`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  },
  {
    url: `${SITE_URL}/category/okane`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  },
  {
    url: `${SITE_URL}/category/lifestyle`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  },
  {
    url: `${SITE_URL}/category/relax`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8
  }
];

function toAbsoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function isIndexableArticle(article: ArticleForSitemap) {
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

  if (!date) {
    return new Date();
  }

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: ArticleForSitemap[] = [];

  try {
    articles = (await getArticles()) as ArticleForSitemap[];
  } catch {
    articles = [];
  }

  const articleUrls = articles
    .filter(isIndexableArticle)
    .map((article) => ({
      url: toAbsoluteUrl(getArticlePath(article)),
      lastModified: getLastModified(article),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }));

  const urls: MetadataRoute.Sitemap = [
    ...staticPages,
    ...categoryPages,
    ...articleUrls
  ];

  const seen = new Set<string>();

  return urls.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
