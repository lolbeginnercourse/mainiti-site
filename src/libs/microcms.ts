import { createClient } from "microcms-js-sdk";

export type MainCategory =
  | "暮らし"
  | "防災"
  | "家電"
  | "お金"
  | "ライフスタイル"
  | "リラックス"
  | "広告";

export type MicroCMSImage = {
  url: string;
  height?: number;
  width?: number;
};

export type MicroCMSCategoryObject = {
  id?: string;
  name?: string;
  title?: string;
  value?: string;
  label?: string;
  text?: string;
  key?: string;
};

export type MicroCMSCategoryValue =
  | string
  | string[]
  | MicroCMSCategoryObject
  | MicroCMSCategoryObject[];

export type Article = {
  id: string;
  title: string;
  slug?: string;

  summary?: string;
  body?: string;
  content?: string;

  mainCategory?: MainCategory;
  category?: MicroCMSCategoryValue;
  categories?: MicroCMSCategoryValue;
  subTags?: string[] | string;
  tags?: string[] | string;

  eyecatch?: MicroCMSImage;
  eyecatchAlt?: string;
  ogImage?: MicroCMSImage;

  amazon_asin?: string;
  amazonAsin?: string;

  isAd?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  adLabel?: string;
  adButtonText?: string;

  metaTitle?: string;
  metaDescription?: string;
  noIndex?: boolean;

  publishedAt?: string;
  revisedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

if (!serviceDomain) {
  throw new Error("MICROCMS_SERVICE_DOMAIN is required");
}

if (!apiKey) {
  throw new Error("MICROCMS_API_KEY is required");
}

export const client = createClient({
  serviceDomain,
  apiKey,
});

const ENDPOINT = "mainitiga";

export async function getArticles() {
  const limit = 100;
  let offset = 0;
  let articles: Article[] = [];

  while (true) {
    const data = await client.getList<Article>({
      endpoint: ENDPOINT,
      queries: {
        limit,
        offset,
        orders: "-publishedAt",
      },
    });

    articles = [...articles, ...data.contents];

    if (articles.length >= data.totalCount) {
      break;
    }

    if (data.contents.length === 0) {
      break;
    }

    offset += limit;
  }

  return articles;
}

export async function getPopularArticles(limit = 5) {
  const data = await client.getList<Article>({
    endpoint: ENDPOINT,
    queries: {
      limit,
      orders: "-publishedAt",
      filters: "isPopular[equals]true",
    },
  });

  return data.contents;
}

export async function getRecommendedArticles(limit = 5) {
  const data = await client.getList<Article>({
    endpoint: ENDPOINT,
    queries: {
      limit,
      orders: "-publishedAt",
      filters: "isRecommended[equals]true",
    },
  });

  return data.contents;
}

export async function getArticlesByMainCategory(
  mainCategory: MainCategory,
  limit = 20
) {
  const data = await client.getList<Article>({
    endpoint: ENDPOINT,
    queries: {
      limit,
      orders: "-publishedAt",
      filters: `mainCategory[equals]${mainCategory}`,
    },
  });

  return data.contents;
}

export async function getArticleBySlugOrId(slugOrId: string, draftKey?: string) {
  if (draftKey) {
    return await client.getListDetail<Article>({
      endpoint: ENDPOINT,
      contentId: slugOrId,
      queries: {
        draftKey,
      },
    });
  }

  const data = await client.getList<Article>({
    endpoint: ENDPOINT,
    queries: {
      limit: 1,
      filters: `slug[equals]${slugOrId}`,
    },
  });

  if (data.contents.length > 0) {
    return data.contents[0];
  }

  return await client.getListDetail<Article>({
    endpoint: ENDPOINT,
    contentId: slugOrId,
  });
}

export function getArticlePath(article: Article) {
  return `/articles/${article.slug || article.id}`;
}

export function getPublishedDate(article: Article) {
  return (
    article.publishedAt ||
    article.revisedAt ||
    article.createdAt ||
    article.updatedAt ||
    ""
  );
}

export function getArticleImageUrl(article: Article) {
  return article.eyecatch?.url || article.ogImage?.url || "";
}

export function getArticleImageAlt(article: Article) {
  return article.eyecatchAlt || article.title || "記事の見出し画像";
}

export function getArticleSummary(article: Article) {
  const source = article.summary || article.content || article.body || "";
  const text = source.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (text.length <= 90) {
    return text;
  }

  return `${text.slice(0, 90)}...`;
}
