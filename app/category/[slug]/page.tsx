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
import { SiteFooter, SiteHeader } from "@/app/components/SiteChrome";
import {
  categoryAliasMap,
  categoryBackground,
  categoryNames,
  categorySlugMap,
  getCategoryDisplayName,
  getCategoryFromSlug,
  tagColor
} from "@/src/libs/site-config";

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
  adArticle
}: {
  popularArticles: ArticleWithCmsAliases[];
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

  const popularArticles = mergeUniqueArticles(popularFiltered, normalArticles).slice(0, 3);
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
      <SiteHeader activeCategory={selectedCategory} titleAs="h1" />

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
            adArticle={sideAdArticle}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
