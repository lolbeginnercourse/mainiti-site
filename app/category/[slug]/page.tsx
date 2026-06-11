/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticlePath,
  getCachedArticles,
  getOptimizedImageUrl,
  type Article,
  type MainCategory
} from "@/src/libs/microcms";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type SearchParamsValue = {
  tag?: string;
  q?: string;
  page?: string;
};

type CategoryPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: SearchParamsValue | Promise<SearchParamsValue>;
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
  body?: string;
  category?: CmsCategoryValue;
  categories?: CmsCategoryValue;
  tags?: string[] | string;
  subTags?: string[] | string;
  metaTitle?: string;
  metaDescription?: string;
};

const ARTICLES_PER_PAGE = 8;

const categorySlugMap: Record<MainCategory, string> = {
  暮らし: "kurashi",
  防災: "bousai",
  家電: "kaden",
  お金: "okane",
  ライフスタイル: "lifestyle",
  リラックス: "relax",
  広告: "ad"
};

const categoryTitleMap: Record<string, MainCategory> = {
  kurashi: "暮らし",
  bousai: "防災",
  kaden: "家電",
  okane: "お金",
  lifestyle: "ライフスタイル",
  relax: "リラックス",
  ad: "広告"
};

const categoryDisplayName: Partial<Record<MainCategory, string>> = {
  お金: "ガジェット・機材",
  リラックス: "便利グッズ"
};

const categoryAliasMap: Record<string, MainCategory> = {
  "ガジェット・機材": "お金",
  便利グッズ: "リラックス"
};

function getCategoryHref(category: MainCategory) {
  return `/category/${categorySlugMap[category]}`;
}

function getCategoryFromSlug(slug: string) {
  return categoryTitleMap[slug];
}

function getCategoryDisplayName(category: MainCategory | string) {
  return categoryDisplayName[category as MainCategory] || category;
}

const categories: Array<{ name: string; key: "top" | MainCategory; href: string }> = [
  { name: "トップ", key: "top", href: "/" },
  { name: "暮らし", key: "暮らし", href: getCategoryHref("暮らし") },
  { name: "防災", key: "防災", href: getCategoryHref("防災") },
  { name: "家電", key: "家電", href: getCategoryHref("家電") },
  { name: getCategoryDisplayName("お金"), key: "お金", href: getCategoryHref("お金") },
  { name: getCategoryDisplayName("リラックス"), key: "リラックス", href: getCategoryHref("リラックス") },
  { name: "ライフスタイル", key: "ライフスタイル", href: getCategoryHref("ライフスタイル") }
];

const purposeLinks = [
  { title: "梅雨・夏の湿気とニオイ対策", text: "家のこもった臭いや水まわりの不快感を減らす", href: "/?q=湿気%20ニオイ%20夏" },
  { title: "家事を時短したい", text: "掃除、片付け、毎日の手間を軽くする", href: "/?q=時短%20家事" },
  { title: "もしもの備えを整える", text: "停電、断水、避難前に確認したい防災", href: getCategoryHref("防災") },
  { title: "買って失敗しない機材選び", text: "家電、ガジェット、便利グッズを比較する", href: getCategoryHref("お金") }
];

const hubLinks = [
  { title: "夏のお悩み解決グッズ", text: "暑さ、湿気、ニオイ対策をまとめて確認", href: "/?q=夏%20グッズ" },
  { title: "掃除・ニオイ対策", text: "原因を知って、家の不快感を減らす", href: "/?q=掃除%20ニオイ" },
  { title: "防災の基本", text: "家族で備える最低限のチェック", href: getCategoryHref("防災") }
];

const siteInfoLinks = [
  { name: "運営者情報", href: "/about" },
  { name: "プライバシーポリシー", href: "/privacy" },
  { name: "免責事項", href: "/disclaimer" },
  { name: "お問い合わせ", href: "/contact" }
];

const tagColor: Record<string, string> = {
  暮らし: "#C76A2A",
  防災: "#3B6F9E",
  家電: "#64748B",
  お金: "#D08A24",
  ライフスタイル: "#7A9A75",
  リラックス: "#6F9DB5",
  広告: "#B85C1E"
};

const categoryBackground: Record<string, string> = {
  暮らし: "linear-gradient(135deg,#FFF4E6,#F1D7B6,#E8BE86)",
  防災: "linear-gradient(135deg,#EAF3FA,#D8EAF6,#CFE3F2)",
  家電: "linear-gradient(135deg,#F9FAFB,#E5E7EB,#D1D5DB)",
  お金: "linear-gradient(135deg,#FFF7ED,#F0D2A7,#E7B875)",
  ライフスタイル: "linear-gradient(135deg,#F2F6EE,#EAF3E7,#DDEBD8)",
  リラックス: "linear-gradient(135deg,#F0F8FA,#EAF3FA,#D6E9F2)",
  広告: "linear-gradient(135deg,#FFF4E6,#F0E8D8,#EAF3FA)"
};

const categoryNames: MainCategory[] = [
  "暮らし",
  "防災",
  "家電",
  "お金",
  "ライフスタイル",
  "リラックス",
  "広告"
];

const hiddenTags = new Set(["TOP", "top", "トップ", "おすすめ", "人気"]);

export function generateStaticParams() {
  return Object.entries(categorySlugMap)
    .filter(([category]) => category !== "広告")
    .map(([, slug]) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams
}: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedCategory = getCategoryFromSlug(resolvedParams.slug);
  const hasFilterQuery =
    !!resolvedSearchParams.tag?.trim() ||
    !!resolvedSearchParams.q?.trim() ||
    parsePageNumber(resolvedSearchParams.page) > 1;

  if (!selectedCategory || selectedCategory === "広告") {
    return {
      title: "カテゴリが見つかりません｜毎日を楽に生きる",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const selectedCategoryLabel = getCategoryDisplayName(selectedCategory);

  return {
    title: `${selectedCategoryLabel}の記事｜毎日を楽に生きる`,
    description: `${selectedCategoryLabel}カテゴリの記事一覧です。暮らしを少し楽にする実用情報をまとめています。`,
    alternates: {
      canonical: `/category/${resolvedParams.slug}`
    },
    robots: hasFilterQuery
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: `${selectedCategoryLabel}の記事｜毎日を楽に生きる`,
      description: `${selectedCategoryLabel}カテゴリの記事一覧です。暮らしを少し楽にする実用情報をまとめています。`
    }
  };
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

function normalizeCategoryValue(value: string) {
  return value.replace(/^#/, "").trim();
}

function findArticleCategories(values: string[]): MainCategory[] {
  const foundCategories: MainCategory[] = [];

  for (const value of values) {
    const cleanedValue = normalizeCategoryValue(value);

    if (!cleanedValue) {
      continue;
    }

    const aliasCategory = categoryAliasMap[cleanedValue];

    if (aliasCategory && !foundCategories.includes(aliasCategory)) {
      foundCategories.push(aliasCategory);
    }

    for (const category of categoryNames) {
      const isMatched =
        cleanedValue === category || cleanedValue.includes(category);

      if (isMatched && !foundCategories.includes(category)) {
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

function getArticleCategory(article: ArticleWithCmsAliases): MainCategory {
  return getArticleCategories(article)[0];
}

function getArticleBodyText(article: ArticleWithCmsAliases) {
  return article.body || article.content || "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getArticleSummary(article: ArticleWithCmsAliases) {
  return article.summary || article.description || "";
}

function getArticleImageUrl(article: ArticleWithCmsAliases, width = 800) {
  const imageUrl = article.eyecatch?.url || article.ogImage?.url || "";
  return getOptimizedImageUrl(imageUrl, width);
}

function getArticleImageAlt(article: ArticleWithCmsAliases) {
  return article.eyecatchAlt || article.title || "記事の見出し画像";
}

function getArticleTags(article: ArticleWithCmsAliases) {
  const tags = article.subTags || article.tags || [];
  const normalizedTags = Array.isArray(tags) ? tags : [tags];

  return normalizedTags
    .map((tag) => String(tag).replace(/^#/, "").trim())
    .filter((tag) => tag && !hiddenTags.has(tag));
}

function mergeUniqueArticles(
  primaryArticles: ArticleWithCmsAliases[],
  fallbackArticles: ArticleWithCmsAliases[]
) {
  const seen = new Set<string>();

  return [...primaryArticles, ...fallbackArticles].filter((article) => {
    const titleKey = normalizeSearchKeyword(article.title);
    const keys = [article.id, titleKey].filter(Boolean);

    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function normalizeSearchKeyword(value?: string) {
  return (value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getSearchTerms(value: string) {
  return normalizeSearchKeyword(value)
    .split(" ")
    .map((term) => term.trim())
    .filter(Boolean);
}

function getArticleSearchText(article: ArticleWithCmsAliases) {
  const categoriesText = getArticleCategories(article).join(" ");
  const tagsText = getArticleTags(article).join(" ");
  const summary = getArticleSummary(article);
  const bodyText = stripHtml(getArticleBodyText(article));

  return [
    article.title,
    article.metaTitle,
    article.metaDescription,
    summary,
    categoriesText,
    tagsText,
    bodyText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function articleMatchesSearch(article: ArticleWithCmsAliases, searchQuery: string) {
  const terms = getSearchTerms(searchQuery);

  if (terms.length === 0) {
    return true;
  }

  const searchText = getArticleSearchText(article);

  return terms.every((term) => searchText.includes(term));
}

function parsePageNumber(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.floor(parsed));
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function buildCategoryListHref({
  slug,
  tag,
  q,
  page
}: {
  slug: string;
  tag?: string;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (tag) {
    params.set("tag", tag);
  }

  if (q) {
    params.set("q", q);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

function getPaginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function SearchBox({
  slug,
  selectedTag,
  searchQuery
}: {
  slug: string;
  selectedTag?: string;
  searchQuery?: string;
}) {
  return (
    <form className="search-box" action={`/category/${slug}`} method="get">
      {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}

      <div className="search-input-wrap">
        <input
          className="search-input"
          type="search"
          name="q"
          defaultValue={searchQuery || ""}
          placeholder="キーワードで記事を探す"
          aria-label="キーワードで記事を探す"
        />
        <button className="search-button" type="submit">
          検索
        </button>
      </div>

      {searchQuery ? (
        <Link
          className="search-clear"
          href={buildCategoryListHref({
            slug,
            tag: selectedTag
          })}
        >
          検索を解除
        </Link>
      ) : null}
    </form>
  );
}

function Pagination({
  slug,
  currentPage,
  totalPages,
  selectedTag,
  searchQuery
}: {
  slug: string;
  currentPage: number;
  totalPages: number;
  selectedTag?: string;
  searchQuery?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="記事一覧のページ移動">
      {currentPage > 1 ? (
        <Link
          className="pagination-link"
          href={buildCategoryListHref({
            slug,
            tag: selectedTag,
            q: searchQuery,
            page: currentPage - 1
          })}
        >
          前へ
        </Link>
      ) : (
        <span className="pagination-link disabled">前へ</span>
      )}

      <div className="pagination-numbers">
        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const shouldShowDots = previousPage && page - previousPage > 1;

          return (
            <span key={page} className="pagination-number-group">
              {shouldShowDots ? <span className="pagination-dots">…</span> : null}

              {page === currentPage ? (
                <span className="pagination-number active" aria-current="page">
                  {page}
                </span>
              ) : (
                <Link
                  className="pagination-number"
                  href={buildCategoryListHref({
                    slug,
                    tag: selectedTag,
                    q: searchQuery,
                    page
                  })}
                >
                  {page}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          className="pagination-link"
          href={buildCategoryListHref({
            slug,
            tag: selectedTag,
            q: searchQuery,
            page: currentPage + 1
          })}
        >
          次へ
        </Link>
      ) : (
        <span className="pagination-link disabled">次へ</span>
      )}
    </nav>
  );
}

function SiteHeader({ activeCategory }: { activeCategory?: string }) {
  return (
    <>
      <header className="site-header">
        <div className="decor-band top" />
        <div className="decor-band bottom" />
        <div className="title-wrap">
          <div className="site-badge">家庭の実用メディア</div>
          <h1 className="site-title">毎日を楽に生きる</h1>
          <p className="site-subtitle">家のことを少しラクにする、家事・防災・ガジェット・機材・便利グッズの整理帖</p>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-list">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={category.href}
              className={
                activeCategory === category.key || (!activeCategory && category.key === "top")
                  ? "nav-item active"
                  : "nav-item"
              }
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function VisualBox({ article }: { article: ArticleWithCmsAliases }) {
  const category = getArticleCategory(article);
  const accent = tagColor[category] || "#C76A2A";
  const fallbackBackground = categoryBackground[category] || categoryBackground["暮らし"];
  const imageUrl = getArticleImageUrl(article, 800);

  if (imageUrl) {
    return (
      <div className="visual-box">
        <img
          className="visual-image"
          src={imageUrl}
          alt={getArticleImageAlt(article)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="visual-box visual-fallback" style={{ background: fallbackBackground }}>
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

function ArticleThumb({
  article,
  className
}: {
  article: ArticleWithCmsAliases;
  className: string;
}) {
  const category = getArticleCategory(article);
  const imageUrl = getArticleImageUrl(article, 240);
  const fallbackBackground = categoryBackground[category] || categoryBackground["暮らし"];

  if (imageUrl) {
    return (
      <div className={`${className} article-thumb has-image`}>
        <img
          src={imageUrl}
          alt={getArticleImageAlt(article)}
          className="article-thumb-image"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} article-thumb thumb-fallback`}
      style={{ background: fallbackBackground }}
      aria-label={`${getCategoryDisplayName(category)}の記事`}
    >
      <span>{getCategoryDisplayName(category)}</span>
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleWithCmsAliases }) {
  const category = getArticleCategory(article);
  const tags = getArticleTags(article);
  const articlePath = getArticlePath(article);

  return (
    <article className="card category-card">
      <Link href={articlePath} className="card-link" aria-label={`${article.title}を読む`}>
        <div style={{ position: "relative" }}>
          <VisualBox article={article} />
          <span className="tag" style={{ background: tagColor[category] || "#B85C1E" }}>
            {getCategoryDisplayName(category)}
          </span>
        </div>

        <div className="card-body">
          <div className="card-title">{article.title}</div>
        </div>

        <div className="card-footer-area">
          {tags.length > 0 ? (
            <div className="sub-tags" aria-hidden="true">
              {tags.slice(0, 2).map((subTag) => (
                <span key={subTag} className="sub-tag">
                  #{subTag}
                </span>
              ))}
            </div>
          ) : null}

          <span className="read-more">記事を読む →</span>
        </div>
      </Link>
    </article>
  );
}

function InlineAd({ article }: { article?: ArticleWithCmsAliases }) {
  if (!article) return null;

  return (
    <Link className="inline-ad-card" href={getArticlePath(article)}>
      <ArticleThumb article={article} className="inline-ad-thumb" />
      <div className="inline-ad-content">
        <div className="inline-ad-label">{article.adLabel || "暮らしのおすすめ"}</div>
        <div className="inline-ad-title">{article.title}</div>
        <div className="inline-ad-text">{getArticleSummary(article)}</div>
      </div>
    </Link>
  );
}

function Sidebar({
  popularArticles,
  recommendedArticles,
  adArticle
}: {
  popularArticles: ArticleWithCmsAliases[];
  recommendedArticles: ArticleWithCmsAliases[];
  adArticle?: ArticleWithCmsAliases;
}) {
  return (
    <aside>
      <div className="sidebar-stack">
        <div className="ranking">
          <h3>よく読まれている記事</h3>

          {popularArticles.slice(0, 3).map((article, index) => {
            const rankColors = ["#B85C1E", "#C76A2A", "#7A9A75"];

            return (
              <Link key={article.id} className="rank-item clickable-row" href={getArticlePath(article)}>
                <div className="rank-num" style={{ background: rankColors[index] || "#B85C1E" }}>
                  {index + 1}
                </div>

                <ArticleThumb article={article} className="rank-thumb" />

                <div className="rank-content">
                  <div className="rank-title">{article.title}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {adArticle ? (
          <div className="side-card ad-box">
            <ArticleThumb article={adArticle} className="side-ad-thumb" />
            <div>
              <div className="ad-label">{adArticle.adLabel || "暮らしのおすすめ"}</div>
              <div className="ad-title">{adArticle.title}</div>
              <div className="ad-text">{getArticleSummary(adArticle)}</div>
            </div>
            <Link className="ad-button" href={getArticlePath(adArticle)}>
              {adArticle.adButtonText || "詳しく見る"}
            </Link>
          </div>
        ) : null}

        <div className="side-card">
          <h3>目的別に探す</h3>
          <div className="feature-list">
            {purposeLinks.map((link, index) => (
              <Link key={link.href} className="feature-item clickable-row" href={link.href}>
                <div className="feature-dot" style={{ background: ["#C76A2A", "#7A9A75", "#3B6F9E", "#D08A24"][index] }} />
                <div>
                  <div className="feature-title">{link.title}</div>
                  <div className="feature-text">{link.text}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="side-card">
          <h3>次に読むなら</h3>
          <div className="recommend-list">
            {recommendedArticles.slice(0, 3).map((article) => {
              return (
                <Link key={article.id} className="recommend-item clickable-row" href={getArticlePath(article)}>
                  <ArticleThumb article={article} className="recommend-thumb" />

                  <div className="recommend-content">
                    <div className="recommend-title">{article.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="side-card">
          <h3>まとめて読む</h3>
          <div className="feature-list">
            {hubLinks.map((link, index) => (
              <Link key={link.href} className="feature-item clickable-row" href={link.href}>
                <div className="feature-dot" style={{ background: ["#3B6F9E", "#64748B", "#D08A24"][index] }} />
                <div>
                  <div className="feature-title">{link.title}</div>
                  <div className="feature-text">{link.text}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="side-card editor-card">
          <h3>編集部について</h3>
          <p className="side-card-text">
            家事、防災、家電・ガジェット選びを、一般家庭の目線で試しやすく整理しています。
            購入を急がせず、注意点と向き不向きもあわせて掲載します。
          </p>
          <Link className="read-more" href="/about">
            運営方針を見る →
          </Link>
        </div>
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>該当する記事はまだありません</h3>
      <p>別のカテゴリやタグ、検索ワードで記事を探してみてください。</p>
      <Link href="/" className="read-more">
        トップへ戻る
      </Link>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h2 className="footer-brand">毎日を楽に生きる</h2>
          <p className="footer-text">
            忙しい毎日の中で、家のことを少しでも楽にするために。家事、防災、ガジェット・機材、便利グッズをわかりやすく整理しています。
          </p>
        </div>
        <div>
          <h3 className="footer-heading">カテゴリ</h3>
          <div className="footer-links">
            {categories.map((category) => (
              <Link key={category.key} className="footer-link" href={category.href}>
                {category.name}
              </Link>
            ))}
          </div>
          <h3 className="footer-heading footer-heading-sub">サイト情報</h3>
          <div className="footer-links">
            {siteInfoLinks.map((link) => (
              <Link key={link.href} className="footer-link" href={link.href}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 毎日を楽に生きる</div>
    </footer>
  );
}

export default async function CategoryPage({
  params,
  searchParams
}: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedCategory = getCategoryFromSlug(resolvedParams.slug);

  if (!selectedCategory || selectedCategory === "広告") {
    notFound();
  }

  const selectedCategoryLabel = getCategoryDisplayName(selectedCategory);
  const selectedTag = resolvedSearchParams.tag?.trim() || undefined;
  const searchQuery = resolvedSearchParams.q?.trim() || "";
  const requestedPage = parsePageNumber(resolvedSearchParams.page);

  let articles: ArticleWithCmsAliases[] = [];

  try {
    articles = (await getCachedArticles()) as ArticleWithCmsAliases[];
  } catch {
    articles = [];
  }

  const normalArticles = articles.filter((article) => !article.isAd);
  const adArticles = articles.filter((article) => article.isAd);

  const popularFiltered = normalArticles.filter((article) => article.isPopular);
  const recommendedFiltered = normalArticles.filter((article) => article.isRecommended);

  const popularArticles = mergeUniqueArticles(popularFiltered, normalArticles).slice(0, 3);
  const popularArticleIds = new Set(popularArticles.map((article) => article.id));

  const recommendedWithoutPopular = mergeUniqueArticles(
    recommendedFiltered.filter((article) => !popularArticleIds.has(article.id)),
    normalArticles.filter((article) => !popularArticleIds.has(article.id))
  );

  const recommendedArticles =
    recommendedWithoutPopular.length > 0
      ? recommendedWithoutPopular.slice(0, 3)
      : normalArticles.slice(0, 3);

  const visibleArticles = normalArticles.filter((article) => {
    const articleCategories = getArticleCategories(article);
    const tags = getArticleTags(article);

    if (!articleCategories.includes(selectedCategory)) return false;
    if (selectedTag && !tags.includes(selectedTag)) return false;
    if (searchQuery && !articleMatchesSearch(article, searchQuery)) return false;

    return true;
  });

  const totalArticles = visibleArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
  const currentPage = clampPage(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const pagedArticles = visibleArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const mainCards = pagedArticles.slice(0, 4);
  const newCards = pagedArticles.slice(4, 8);
  const inlineAdArticle = adArticles[0];
  const sideAdArticle = adArticles[1] || adArticles[0];

  const title = searchQuery
    ? `「${searchQuery}」の検索結果`
    : selectedTag
      ? `${selectedTag}の記事`
      : `${selectedCategoryLabel}の記事`;

  return (
    <div className="page">
      <SiteHeader activeCategory={selectedCategory} />

      <main className="container">
        <div className="layout">
          <section>
            <h2 className="section-title">{title}</h2>

            <SearchBox
              slug={resolvedParams.slug}
              selectedTag={selectedTag}
              searchQuery={searchQuery}
            />

            {visibleArticles.length > 0 ? (
              <>
                <div className="cards">
                  {mainCards.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}

                  {pagedArticles.length > 4 ? <InlineAd article={inlineAdArticle} /> : null}
                </div>

                {newCards.length > 0 ? (
                  <>
                    <h2 className="section-title sub">新着記事</h2>
                    <div className="cards">
                      {newCards.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </>
                ) : null}

                <Pagination
                  slug={resolvedParams.slug}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  selectedTag={selectedTag}
                  searchQuery={searchQuery}
                />
              </>
            ) : (
              <EmptyState />
            )}
          </section>

          <Sidebar
            popularArticles={popularArticles}
            recommendedArticles={recommendedArticles}
            adArticle={sideAdArticle}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
