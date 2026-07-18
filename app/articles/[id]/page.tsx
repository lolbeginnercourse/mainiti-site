/* eslint-disable @next/next/no-img-element */

import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleBySlugOrId,
  getArticlePath,
  getCachedArticles as getCachedArticleList,
  getOptimizedImageUrl,
  type Article,
  type MainCategory
} from "@/src/libs/microcms";
import { getAmazonProductByAsin } from "@/src/libs/amazon";
import { Breadcrumbs, SiteFooter, SiteHeader } from "@/app/components/SiteChrome";
import {
  DEFAULT_CATEGORY,
  SITE_URL,
  categoryAliasMap,
  categoryBackground,
  categoryNames,
  getCategoryDisplayName,
  getCategoryHref,
  tagColor
} from "@/src/libs/site-config";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { draftKey?: string } | Promise<{ draftKey?: string }>;
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

type ArticleWithCmsAliases = Article & {
  description?: string;
  content?: string;
  category?: CmsCategoryValue;
  categories?: CmsCategoryValue;
  tags?: string[] | string;
  subTags?: string[] | string;
  main_category?: CmsCategoryValue;
  maincategory?: CmsCategoryValue;
  noIndex?: boolean;
  noindex?: boolean;
  no_index?: boolean;
};

type AmazonCardProps = {
  asin?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  amazonUrl: string;
  rakutenUrl?: string;
};

type HtmlBlockInput = {
  type: "html";
  html: string;
};

type AmazonBlockInput = {
  type: "amazon-input";
  key: string;
  asin: string;
  amazonUrlAttr: string;
  rakutenUrl: string;
  hasRakutenSetting: boolean;
  titleAttr: string;
  imageAttr: string;
};

type ArticleBlock =
  | HtmlBlockInput
  | {
      type: "amazon";
      key: string;
      asin?: string;
      title: string;
      description?: string;
      imageUrl?: string;
      amazonUrl: string;
      rakutenUrl?: string;
      hasRakutenSetting?: boolean;
    };

type ArticleBlockInput = HtmlBlockInput | AmazonBlockInput;

type FaqItem = {
  question: string;
  answer: string;
};

const DEFAULT_OG_IMAGE_URL = `${SITE_URL}/icon.png`;
const hiddenTags = new Set([
  "TOP",
  "top",
  "トップ",
  "おすすめ",
  "人気",
  "防災",
  "家電",
  "お金",
  "リラックス"
]);
const DEFAULT_AMAZON_CARD_TITLE = "Amazonで商品を見る";
const shortcodeAttributeNames = {
  amazonUrl: ["url", "amazonUrl", "amazon_url"],
  rakutenUrl: ["rakutenUrl", "rakuten", "rakuten_url"],
  title: ["title", "name"],
  image: ["image", "imageUrl", "image_url"]
};

function getCategoryColor(category: MainCategory) {
  return tagColor[category] || tagColor[DEFAULT_CATEGORY];
}

function getCategoryBackground(category: MainCategory) {
  return categoryBackground[category] || categoryBackground[DEFAULT_CATEGORY];
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string) {
  return escapeHtmlAttribute(value);
}

function decodeAmazonShortcodeText(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#038;", "&")
    .replaceAll("&#x26;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#x22;", '"')
    .replaceAll("&#x2F;", "/")
    .replaceAll("&colon;", ":")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&equals;", "=")
    .replaceAll("&#61;", "=")
    .replaceAll("&quest;", "?")
    .replaceAll("&#63;", "?")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("‘", "'")
    .replaceAll("’", "'");
}

function decodeEscapedA8TagText(value: string) {
  return decodeAmazonShortcodeText(value)
    .replace(/&lt;|&#60;|&#x3c;/gi, "<")
    .replace(/&gt;|&#62;|&#x3e;/gi, ">")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'");
}

function normalizeAmazonInput(value: string) {
  return decodeAmazonShortcodeText(value).trim();
}

function normalizeUrl(url: string) {
  return decodeAmazonShortcodeText(url)
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replaceAll("　", "")
    .replace(/\s+/g, "");
}

function normalizeRakutenUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";

  try {
    return new URL(normalized).toString();
  } catch {
    return "";
  }
}

function isValidExternalUrl(url?: string) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

function getShortcodeAttr(shortcode: string, name: string) {
  const decodedShortcode = decodeAmazonShortcodeText(shortcode);
  const pattern = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|“([^”]*)”|([^\\s\\]]+))`,
    "i"
  );
  const match = decodedShortcode.match(pattern);

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
}

function getFirstShortcodeAttr(shortcode: string, names: string[]) {
  for (const name of names) {
    const value = getShortcodeAttr(shortcode, name);
    if (value) return value;
  }

  return "";
}

function getSafeA8Size(value: string, fallback: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized || fallback;
}

function normalizeA8ShortcodeForParsing(shortcode: string) {
  return decodeEscapedA8TagText(shortcode)
    .replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi, "$2")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildA8BannerHtml({
  href,
  img,
  track,
  width,
  height,
  alt
}: {
  href: string;
  img: string;
  track?: string;
  width: string;
  height: string;
  alt?: string;
}) {
  if (!isValidExternalUrl(href) || !isValidExternalUrl(img)) {
    return "";
  }

  const safeHref = escapeHtmlAttribute(href);
  const safeImg = escapeHtmlAttribute(img);
  const safeTrack = escapeHtmlAttribute(track || "");
  const safeAlt = escapeHtmlAttribute(alt || "");
  const trackingImg = isValidExternalUrl(track)
    ? `<img border="0" width="1" height="1" src="${safeTrack}" alt="">`
    : "";

  return `
<div class="a8-banner-wrap">
  <a href="${safeHref}" rel="nofollow sponsored noopener noreferrer" target="_blank">
    <img border="0" width="${width}" height="${height}" alt="${safeAlt}" src="${safeImg}" loading="lazy">
  </a>
  ${trackingImg}
</div>
`;
}

function createA8HtmlFromShortcode(shortcode: string) {
  const cleanShortcode = normalizeA8ShortcodeForParsing(shortcode);
  const href = normalizeUrl(getFirstShortcodeAttr(cleanShortcode, ["href", "url", "link"]));
  const img = normalizeUrl(
    getFirstShortcodeAttr(cleanShortcode, ["img", "src", "image", "imageUrl", "image_url"])
  );
  const track = normalizeUrl(
    getFirstShortcodeAttr(cleanShortcode, [
      "track",
      "tracking",
      "pixel",
      "trackingUrl",
      "tracking_url"
    ])
  );
  const width = getSafeA8Size(getShortcodeAttr(cleanShortcode, "width"), "468");
  const height = getSafeA8Size(getShortcodeAttr(cleanShortcode, "height"), "60");
  const alt = normalizeAmazonInput(getShortcodeAttr(cleanShortcode, "alt"));

  return buildA8BannerHtml({ href, img, track, width, height, alt });
}

function createA8HtmlFromRawTag(rawHtml: string) {
  const decodedHtml = decodeEscapedA8TagText(rawHtml);
  const hrefMatch = decodedHtml.match(
    /<a\b[^>]*href=(["'])(https?:\/\/px\.a8\.net\/[^"']+)\1[^>]*>/i
  );
  const imageMatches = Array.from(
    decodedHtml.matchAll(/<img\b[^>]*src=(["'])(https?:\/\/[^"']+)\1[^>]*>/gi)
  );
  const bannerImage = imageMatches.find((match) => /\/svt\/bgt\?/i.test(match[2]));
  const trackingImage = imageMatches.find((match) => /\/0\.gif\?/i.test(match[2]));
  const bannerTag = bannerImage?.[0] || "";
  const widthMatch = bannerTag.match(/width=(["'])(\d+)\1/i);
  const heightMatch = bannerTag.match(/height=(["'])(\d+)\1/i);
  const altMatch = bannerTag.match(/alt=(["'])(.*?)\1/i);

  return buildA8BannerHtml({
    href: normalizeUrl(hrefMatch?.[2] || ""),
    img: normalizeUrl(bannerImage?.[2] || ""),
    track: normalizeUrl(trackingImage?.[2] || ""),
    width: getSafeA8Size(widthMatch?.[2] || "", "468"),
    height: getSafeA8Size(heightMatch?.[2] || "", "60"),
    alt: normalizeAmazonInput(altMatch?.[2] || "")
  });
}

function normalizeA8ShortcodeText(value: string) {
  return decodeAmazonShortcodeText(value)
    .replace(/&#91;|&#x5b;|&lbrack;/gi, "[")
    .replace(/&#93;|&#x5d;|&rbrack;/gi, "]");
}

function protectExistingA8Banners(html: string) {
  const protectedBlocks: string[] = [];
  const htmlWithPlaceholders = html.replace(
    /<div\b[^>]*class=(["'])[^"']*\ba8-banner-wrap\b[^"']*\1[^>]*>[\s\S]*?<\/div>/gi,
    (block) => {
      const placeholder = `__A8_BANNER_BLOCK_${protectedBlocks.length}__`;
      protectedBlocks.push(block);
      return placeholder;
    }
  );

  return {
    htmlWithPlaceholders,
    restore: (value: string) =>
      protectedBlocks.reduce(
        (restoredHtml, block, index) =>
          restoredHtml.replace(`__A8_BANNER_BLOCK_${index}__`, block),
        value
      )
  };
}

function replaceA8Shortcodes(html: string) {
  const normalizedHtml = normalizeA8ShortcodeText(html);
  const htmlWithA8Shortcodes = normalizedHtml.replace(
    /(?:<p[^>]*>\s*)?(?:<[^>]+>\s*)*(\[a8\b[\s\S]*?\])\s*(?:<\/[^>]+>\s*)*(?:<\/p>)?/gi,
    (match, shortcode) => createA8HtmlFromShortcode(shortcode) || match
  );
  const { htmlWithPlaceholders, restore } = protectExistingA8Banners(htmlWithA8Shortcodes);
  const htmlWithActualA8Tags = htmlWithPlaceholders.replace(
    /(?:<p[^>]*>\s*)?(<a\b[^>]*href=(["'])https?:\/\/px\.a8\.net\/[\s\S]*?<\/a>\s*<img\b[^>]*src=(["'])https?:\/\/[^"']*\/0\.gif\?[\s\S]*?>)\s*(?:<\/p>)?/gi,
    (match, rawA8Html) => createA8HtmlFromRawTag(rawA8Html) || match
  );
  const htmlWithEscapedA8Tags = htmlWithActualA8Tags.replace(
    /(?:<p[^>]*>\s*)?(&lt;a\b[\s\S]*?https?:\/\/px\.a8\.net\/[\s\S]*?&lt;\/a&gt;[\s\S]*?&lt;img\b[\s\S]*?https?:\/\/[^<]*\/0\.gif\?[\s\S]*?&gt;)\s*(?:<\/p>)?/gi,
    (match, rawA8Html) => createA8HtmlFromRawTag(rawA8Html) || match
  );

  return restore(htmlWithEscapedA8Tags);
}

const getCachedArticleBySlugOrId = cache(async (id: string, draftKey?: string) => {
  return (await getArticleBySlugOrId(id, draftKey)) as ArticleWithCmsAliases;
});

const getCachedArticles = cache(async () => {
  return (await getCachedArticleList()) as ArticleWithCmsAliases[];
});

const getCachedAmazonProduct = cache(async (asinOrUrl: string) => {
  try {
    return await getAmazonProductByAsin(asinOrUrl);
  } catch {
    return null;
  }
});

async function getRelatedArticlesSafely(
  article: ArticleWithCmsAliases,
  articleCategory: MainCategory
) {
  try {
    const sourceTags = getArticleTags(article);

    if (sourceTags.length === 0) {
      return [];
    }

    const sourceTagSet = new Set(sourceTags);
    const allArticles = await getCachedArticles();

    return allArticles
      .map((item) => {
        const itemCategory = getArticleCategory(item);
        const itemTags = getArticleTags(item);
        const sharedTagCount = itemTags.filter((tag) => sourceTagSet.has(tag)).length;

        return {
          item,
          sharedTagCount,
          isSameCategory: itemCategory === articleCategory
        };
      })
      .filter(({ item, sharedTagCount, isSameCategory }) => {
        return !item.isAd && item.id !== article.id && isSameCategory && sharedTagCount > 0;
      })
      .sort((a, b) => b.sharedTagCount - a.sharedTagCount)
      .slice(0, 3)
      .map(({ item }) => item);
  } catch {
    return [];
  }
}

function getCategoryTextCandidates(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => getCategoryTextCandidates(item));
  if (typeof value === "string") return [value];

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
    if (!cleanedValue) continue;

    const aliasCategory = categoryAliasMap[cleanedValue];

    if (aliasCategory && !foundCategories.includes(aliasCategory)) {
      foundCategories.push(aliasCategory);
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

function getArticleCategories(article: ArticleWithCmsAliases): MainCategory[] {
  const articleRecord = article as Record<string, unknown>;
  const primaryValues = [
    articleRecord.category,
    articleRecord.categories,
    articleRecord.tags,
    articleRecord.subTags
  ].flatMap((value) => getCategoryTextCandidates(value));
  const primaryCategories = findArticleCategories(primaryValues);

  if (primaryCategories.length > 0) return primaryCategories;

  const fallbackValues = [
    articleRecord.mainCategory,
    articleRecord.main_category,
    articleRecord.maincategory
  ].flatMap((value) => getCategoryTextCandidates(value));
  const fallbackCategories = findArticleCategories(fallbackValues);

  return fallbackCategories.length > 0 ? fallbackCategories : [DEFAULT_CATEGORY];
}

function getArticleCategory(article: ArticleWithCmsAliases): MainCategory {
  return getArticleCategories(article)[0];
}

function getArticleSummary(article: ArticleWithCmsAliases) {
  return article.summary || article.description || createExcerpt(getArticleBody(article), 120);
}

function getArticleBody(article: ArticleWithCmsAliases) {
  return article.body || article.content || "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function createExcerpt(value: string, maxLength = 120) {
  const text = stripHtml(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getArticleTags(article: ArticleWithCmsAliases) {
  const tags = article.subTags || article.tags || [];
  const normalizedTags = Array.isArray(tags) ? tags : [tags];

  return normalizedTags
    .map((tag) => String(tag).replace(/^#/, "").trim())
    .filter((tag) => tag && !hiddenTags.has(tag));
}

function sanitizeHtml(html: string) {
  return (html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

function extractHeadings(html: string) {
  const matches = Array.from((html || "").matchAll(/<h2[^>]*>(.*?)<\/h2>/gi));

  return matches.map((match, index) => ({
    id: `section-${index + 1}`,
    text: match[1].replace(/<[^>]+>/g, "").trim()
  }));
}

function addHeadingIdsToSafeHtml(html: string) {
  let index = 0;

  return html.replace(/<h2([^>]*)>/gi, (_match, attrs) => {
    index += 1;
    const cleanedAttrs = String(attrs || "").replace(/\s+id=(["']).*?\1/gi, "");
    return `<h2${cleanedAttrs} id="section-${index}">`;
  });
}

function extractRakutenUrlFromShortcode(shortcode: string) {
  const decodedShortcode = decodeAmazonShortcodeText(shortcode);
  const attrValue = getFirstShortcodeAttr(decodedShortcode, shortcodeAttributeNames.rakutenUrl);
  const normalizedAttrValue = normalizeRakutenUrl(attrValue);

  if (isValidExternalUrl(normalizedAttrValue)) return normalizedAttrValue;

  const hrefMatch = decodedShortcode.match(/<a[^>]+href=["']([^"']*rakuten[^"']*)["']/i);
  const normalizedHref = normalizeRakutenUrl(hrefMatch?.[1] || "");

  if (isValidExternalUrl(normalizedHref)) return normalizedHref;

  const urlMatch = decodedShortcode.match(
    /(https?:\/\/(?:hb\.afl\.rakuten\.co\.jp|[^"' <>\]]*rakuten\.co\.jp)[^"' <>\]]*)/i
  );
  const normalizedUrl = normalizeRakutenUrl(urlMatch?.[1] || "");

  return isValidExternalUrl(normalizedUrl) ? normalizedUrl : "";
}

function isLikelyAsin(value?: string) {
  return !!value && /^[A-Z0-9]{10}$/i.test(value);
}

function extractAmazonAsin(value?: string) {
  const text = normalizeUrl(value || "");

  if (isLikelyAsin(text)) {
    return text.toUpperCase();
  }

  const match =
    text.match(/\/dp\/([A-Z0-9]{10})/i) ||
    text.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
    text.match(/[?&]asin=([A-Z0-9]{10})/i) ||
    text.match(/\/([A-Z0-9]{10})(?:[/?#]|$)/i);

  return match?.[1]?.toUpperCase() || "";
}

function getAmazonFallbackImageUrl(asin?: string) {
  if (!isLikelyAsin(asin)) return "";

  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg`;
}

function getAmazonCardTitle(productTitle?: string, inputTitle?: string) {
  if (inputTitle) {
    return inputTitle;
  }

  if (productTitle && productTitle !== DEFAULT_AMAZON_CARD_TITLE) {
    return productTitle;
  }

  return DEFAULT_AMAZON_CARD_TITLE;
}

function getValidImageUrl(...urls: Array<string | undefined>) {
  return urls.find((url) => isValidExternalUrl(url)) || "";
}

function getAmazonFallbackProductUrl(asin?: string, amazonUrlAttr?: string) {
  if (amazonUrlAttr && isValidExternalUrl(amazonUrlAttr)) return amazonUrlAttr;
  if (!isLikelyAsin(asin)) return "";

  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const tagQuery = partnerTag ? `?tag=${encodeURIComponent(partnerTag)}` : "";

  return `https://www.amazon.co.jp/dp/${asin}${tagQuery}`;
}

function getShouldNoIndex(article: ArticleWithCmsAliases, draftKey?: string) {
  return !!draftKey || !!article.noIndex || !!article.noindex || !!article.no_index;
}

function getCanonicalUrl(article: ArticleWithCmsAliases) {
  try {
    return new URL(getArticlePath(article), SITE_URL).toString();
  } catch {
    return SITE_URL;
  }
}

function getAbsolutePublicUrl(url?: string) {
  if (!url) return "";

  try {
    return new URL(url, SITE_URL).toString();
  } catch {
    return "";
  }
}

function getArticleOgImageUrl(article: ArticleWithCmsAliases) {
  return (
    getAbsolutePublicUrl(article.ogImage?.url) ||
    getAbsolutePublicUrl(article.eyecatch?.url) ||
    DEFAULT_OG_IMAGE_URL
  );
}

function removeSiteTitleSuffix(title: string) {
  return title.replace(/(?:｜毎日を楽に生きる)+$/g, "").trim();
}

function normalizeFaqShortcodeText(value: string) {
  return decodeAmazonShortcodeText(value)
    .replace(/&#91;|&#x5b;|&lbrack;/gi, "[")
    .replace(/&#93;|&#x5d;|&rbrack;/gi, "]");
}

function normalizeFaqText(value: string) {
  return stripHtml(decodeEscapedA8TagText(value)).replace(/\s+/g, " ").trim();
}

function buildFaqItemHtml(item: FaqItem) {
  return `
<section class="article-faq-item">
  <h2 class="article-faq-question">${escapeHtmlText(item.question)}</h2>
  <p class="article-faq-answer">${escapeHtmlText(item.answer)}</p>
</section>
`;
}

function replaceFaqShortcodes(html: string) {
  const faqItems: FaqItem[] = [];
  const normalizedHtml = normalizeFaqShortcodeText(html);

  const htmlWithFaq = normalizedHtml.replace(
    /(?:<p[^>]*>\s*)?\[faq\b([^\]]*)\]([\s\S]*?)\[\/faq\]\s*(?:<\/p>)?/gi,
    (match, attrs, answerContent) => {
      const question = normalizeFaqText(getShortcodeAttr(`[faq ${attrs}]`, "question"));
      const answer = normalizeFaqText(answerContent);

      if (!question || !answer) {
        return match;
      }

      const item = { question, answer };
      faqItems.push(item);

      return buildFaqItemHtml(item);
    }
  );

  return {
    html: htmlWithFaq,
    faqItems
  };
}

function createFaqJsonLd(faqItems: FaqItem[]) {
  if (faqItems.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function stringifyJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function parseArticleBlockInputs(html: string): ArticleBlockInput[] {
  const blockInputs: ArticleBlockInput[] = [];
  const seenAmazonTargets = new Set<string>();
  const decodedHtml = decodeAmazonShortcodeText(html);
  const amazonRegex =
    /(?:<p[^>]*>\s*)?(?:<[^>]+>\s*)*(\[amazon[\s\S]*?\])\s*(?:<\/[^>]+>\s*)*(?:<\/p>)?/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = amazonRegex.exec(decodedHtml)) !== null) {
    const beforeHtml = decodedHtml.slice(lastIndex, match.index);
    if (beforeHtml) blockInputs.push({ type: "html", html: beforeHtml });

    const shortcode = match[1] || "";
    const asin = normalizeAmazonInput(getShortcodeAttr(shortcode, "asin"));
    const amazonUrlAttr = normalizeUrl(
      getFirstShortcodeAttr(shortcode, shortcodeAttributeNames.amazonUrl)
    );
    const rawRakutenUrl = getFirstShortcodeAttr(
      shortcode,
      shortcodeAttributeNames.rakutenUrl
    );
    const rakutenUrl = extractRakutenUrlFromShortcode(shortcode);
    const hasRakutenSetting = /rakuten/i.test(shortcode) || !!rawRakutenUrl || !!rakutenUrl;
    const titleAttr = normalizeAmazonInput(
      getFirstShortcodeAttr(shortcode, shortcodeAttributeNames.title)
    );
    const imageAttr = normalizeUrl(getFirstShortcodeAttr(shortcode, shortcodeAttributeNames.image));
    const asinOrUrl = asin || amazonUrlAttr;

    if (asinOrUrl) {
      const normalizedAmazonTarget = asinOrUrl.toLowerCase();

      if (seenAmazonTargets.has(normalizedAmazonTarget)) {
        lastIndex = amazonRegex.lastIndex;
        continue;
      }

      seenAmazonTargets.add(normalizedAmazonTarget);
      blockInputs.push({
        type: "amazon-input",
        key: `${asinOrUrl}-${match.index}`,
        asin,
        amazonUrlAttr,
        rakutenUrl,
        hasRakutenSetting,
        titleAttr,
        imageAttr
      });
    }

    lastIndex = amazonRegex.lastIndex;
  }

  const afterHtml = decodedHtml.slice(lastIndex);
  if (afterHtml) blockInputs.push({ type: "html", html: afterHtml });

  return blockInputs;
}

async function resolveAmazonBlock(input: AmazonBlockInput): Promise<ArticleBlock | null> {
  const asinOrUrl = input.asin || input.amazonUrlAttr;
  if (!asinOrUrl) return null;

  try {
    const product = await getCachedAmazonProduct(asinOrUrl);
    const productAsin = product?.asin || input.asin || extractAmazonAsin(input.amazonUrlAttr);
    const amazonUrl =
      product?.detailPageURL || getAmazonFallbackProductUrl(productAsin, input.amazonUrlAttr);

    if (!amazonUrl) return null;

    return {
      type: "amazon",
      key: input.key,
      asin: productAsin,
      title: getAmazonCardTitle(product?.title, input.titleAttr),
      description: "価格や在庫状況は各販売ページで確認してください",
      imageUrl: getValidImageUrl(
        input.imageAttr,
        product?.imageUrl,
        getAmazonFallbackImageUrl(productAsin)
      ),
      amazonUrl,
      rakutenUrl: isValidExternalUrl(input.rakutenUrl) ? input.rakutenUrl : undefined,
      hasRakutenSetting: input.hasRakutenSetting
    };
  } catch {
    const fallbackAsin = input.asin || extractAmazonAsin(input.amazonUrlAttr);
    const fallbackAmazonUrl = getAmazonFallbackProductUrl(fallbackAsin, input.amazonUrlAttr);

    if (!fallbackAmazonUrl) return null;

    return {
      type: "amazon",
      key: input.key,
      asin: fallbackAsin,
      title: getAmazonCardTitle(undefined, input.titleAttr),
      description: "価格や在庫状況は各販売ページで確認してください",
      imageUrl: getValidImageUrl(input.imageAttr, getAmazonFallbackImageUrl(fallbackAsin)),
      amazonUrl: fallbackAmazonUrl,
      rakutenUrl: isValidExternalUrl(input.rakutenUrl) ? input.rakutenUrl : undefined,
      hasRakutenSetting: input.hasRakutenSetting
    };
  }
}

async function createArticleBlocks(html: string): Promise<ArticleBlock[]> {
  const blockInputs = parseArticleBlockInputs(html);
  const resolvedBlocks = await Promise.all(
    blockInputs.map((blockInput) =>
      blockInput.type === "html" ? blockInput : resolveAmazonBlock(blockInput)
    )
  );

  return resolvedBlocks.filter((block): block is ArticleBlock => !!block);
}

function AmazonCard({ title, description, imageUrl, amazonUrl, rakutenUrl }: AmazonCardProps) {
  const displayImageUrl = getValidImageUrl(imageUrl);
  const safeRakutenUrl = isValidExternalUrl(rakutenUrl) ? rakutenUrl : "";
  const shouldShowRakutenArea = !!safeRakutenUrl;

  return (
    <div className="product-card">
      <a
        className="product-image-area"
        href={amazonUrl}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        aria-label="Amazonで商品を見る"
      >
        {displayImageUrl ? (
          <img src={displayImageUrl} alt={title} className="product-image" loading="lazy" />
        ) : (
          <span className="product-image-placeholder">商品画像</span>
        )}
      </a>

      <div className="product-body">
        <p className="product-kicker">商品リンク</p>
        <div className="product-title">{title}</div>

        <div
          className={
            shouldShowRakutenArea ? "product-button-wrap has-rakuten" : "product-button-wrap"
          }
        >
          <a
            className="product-button amazon-button"
            href={amazonUrl}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
          >
            Amazonで見る
          </a>

          {safeRakutenUrl ? (
            <a
              className="product-button rakuten-button"
              href={safeRakutenUrl}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
            >
              楽天市場で見る
            </a>
          ) : null}
        </div>

        {description ? <p className="product-note">{description}</p> : null}
      </div>
    </div>
  );
}

function VisualBox({ article }: { article: ArticleWithCmsAliases }) {
  const category = getArticleCategory(article);
  const accent = getCategoryColor(category);
  const fallbackBackground = getCategoryBackground(category);

  if (article.eyecatch?.url) {
    return (
      <div className="visual-box">
        <img
          className="visual-image"
          src={getOptimizedImageUrl(article.eyecatch.url, 1280, 85)}
          alt={article.eyecatchAlt || article.title}
          fetchPriority="high"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className="visual-box" style={{ background: fallbackBackground }}>
      <div className="room-floor" />
      <div className="home-shape" style={{ borderBottomColor: accent }} />
      <div className="home-body" />
      <div className="home-window" />
      <div className="home-door" style={{ background: accent }} />
      <div className="table-shape" />
      <div className="cup-shape" />
      <div className="soft-orb" />
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params, searchParams }: ArticlePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const draftKey = resolvedSearchParams?.draftKey;

  try {
    const article = await getCachedArticleBySlugOrId(resolvedParams.id, draftKey);
    const title = removeSiteTitleSuffix(article.metaTitle || article.title);
    const description =
      article.metaDescription || getArticleSummary(article) || article.title;
    const image = getArticleOgImageUrl(article);
    const shouldNoIndex = getShouldNoIndex(article, draftKey);
    const canonicalUrl = getCanonicalUrl(article);

    return {
      title,
      description,
      robots: shouldNoIndex
        ? { index: false, follow: false }
        : { index: true, follow: true },
      alternates: {
        canonical: canonicalUrl
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: canonicalUrl,
        images: [
          {
            url: image,
            alt: article.eyecatchAlt || title
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image]
      }
    };
  } catch {
    return {
      title: "記事が見つかりません",
      robots: {
        index: false,
        follow: false
      }
    };
  }
}

export default async function ArticleDetailPage({ params, searchParams }: ArticlePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const draftKey = resolvedSearchParams?.draftKey;
  let article: ArticleWithCmsAliases;

  try {
    article = await getCachedArticleBySlugOrId(resolvedParams.id, draftKey);
  } catch {
    notFound();
  }

  const articleCategory = getArticleCategory(article);
  const safeBody = sanitizeHtml(getArticleBody(article));
  const tocItems = extractHeadings(safeBody);
  const articleTags = getArticleTags(article);
  const bodyWithHeadingIds = addHeadingIdsToSafeHtml(safeBody);
  const bodyWithA8 = replaceA8Shortcodes(bodyWithHeadingIds);
  const { html: bodyWithFaq, faqItems } = replaceFaqShortcodes(bodyWithA8);
  const faqJsonLd = createFaqJsonLd(faqItems);
  const [articleBlocks, relatedArticles] = await Promise.all([
    createArticleBlocks(bodyWithFaq),
    getRelatedArticlesSafely(article, articleCategory)
  ]);

  return (
    <div className="page">
      <SiteHeader />

      <main className="article-page">
        <Breadcrumbs
          items={[
            {
              name: getCategoryDisplayName(articleCategory),
              href: getCategoryHref(articleCategory)
            },
            {
              name: article.title,
              href: getArticlePath(article)
            }
          ]}
        />

        {faqJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: stringifyJsonLd(faqJsonLd) }}
          />
        ) : null}

        <Link className="back-button" href="/">
          ← 一覧へ戻る
        </Link>

        <article className="article-card">
          <div className="article-hero" style={{ position: "relative" }}>
            <VisualBox article={article} />
            <span className="tag" style={{ background: getCategoryColor(articleCategory) }}>
              {getCategoryDisplayName(articleCategory)}
            </span>
          </div>

          <div className="article-content">
            <h1 className="article-title">{article.title}</h1>

            {articleTags.length > 0 ? (
              <div className="sub-tags">
                {articleTags.map((subTag) => (
                  <Link
                    key={subTag}
                    className="sub-tag"
                    href={`/?tag=${encodeURIComponent(subTag)}`}
                  >
                    #{subTag}
                  </Link>
                ))}
              </div>
            ) : null}

            {tocItems.length > 0 ? (
              <div className="toc-box">
                <h2 className="toc-title">目次</h2>
                <ul className="toc-list">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a className="toc-button" href={`#${item.id}`}>
                        <span>{item.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="article-body">
              {articleBlocks.map((block, index) => {
                if (block.type === "html") {
                  return (
                    <div
                      key={`html-${index}`}
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  );
                }

                return (
                  <AmazonCard
                    key={block.key}
                    asin={block.asin}
                    title={block.title}
                    description={block.description}
                    imageUrl={block.imageUrl}
                    amazonUrl={block.amazonUrl}
                    rakutenUrl={block.rakutenUrl}
                  />
                );
              })}
            </div>

            <section className="article-author-box" aria-labelledby="article-author-title">
              <h2 id="article-author-title" className="article-author-title">
                記事作成者
              </h2>
              <p className="article-author-name">幸田 あかり</p>
              <p>
                日常の小さな不便や、暮らしの中で起きる困りごとを整理する実用メディアを運営しています。
              </p>
              <p>
                スマホ用品、家事用品、収納、掃除、季節の悩みなどを中心に、「なぜ困るのか」「どこを見直せば楽になるのか」を生活者の目線で記事にしています。
              </p>
              <p>
                公式情報だけでは分かりにくい、使ってから気づく違和感や、買う前に見落としやすい点を大切にしています。
              </p>
            </section>

            {relatedArticles.length > 0 ? (
              <div className="related-box">
                <h2 className="related-title">関連記事</h2>
                <div className="related-list">
                  {relatedArticles.map((relatedArticle) => {
                    const relatedCategory = getArticleCategory(relatedArticle);

                    return (
                      <Link
                        key={relatedArticle.id}
                        className="related-item"
                        href={getArticlePath(relatedArticle)}
                      >
                        <span className="related-tag">{getCategoryDisplayName(relatedCategory)}</span>
                        <div className="related-name">{relatedArticle.title}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="article-bottom-nav">
              <Link className="bottom-nav-button primary" href="/">
                一覧へ戻る
              </Link>
              <Link
                className="bottom-nav-button"
                href={getCategoryHref(articleCategory)}
              >
                {getCategoryDisplayName(articleCategory)}の記事を見る
              </Link>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
