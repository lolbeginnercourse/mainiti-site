/* eslint-disable @next/next/no-img-element */

import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getArticlePath,
  getCachedArticles,
  getOptimizedImageUrl,
  type Article,
  type MainCategory
} from "@/src/libs/microcms";
import {
  Breadcrumbs,
  DesktopAdmaxSlot,
  InlineListAdmaxSlot,
  SiteFooter,
  SiteHeader
} from "@/app/components/SiteChrome";
import {
  categoryAliasMap,
  categoryBackground,
  categoryNames,
  getCategoryDisplayName,
  purposeLinks,
  tagColor
} from "@/src/libs/site-config";

export const revalidate = 60;
export const dynamic = "auto";

type SearchParamsValue = {
  tag?: string;
  q?: string;
  page?: string;
  category?: string;
  sort?: string;
  [key: string]: string | undefined;
};

type ArticlesPageProps = {
  searchParams?: SearchParamsValue | Promise<SearchParamsValue>;
};

export async function generateMetadata({
  searchParams
}: ArticlesPageProps): Promise<Metadata> {
  const params = await Promise.resolve(searchParams || {});
  const hasFilterQuery = !!params.q?.trim() || !!params.tag?.trim() || !!params.sort?.trim() || !!params.category?.trim();
  const pageNumber = parsePageNumber(params.page);

  return {
    title: pageNumber > 1 ? `新着記事一覧 ${pageNumber}ページ目` : "新着記事一覧",
    description: "毎日を楽に生きるの新着記事一覧です。暮らしの小さな不便や道具選びを新しい順に確認できます。",
    alternates: {
      canonical: params.page && params.page !== "1" ? `https://mainitiwo.com/articles?page=${params.page}` : "https://mainitiwo.com/articles"
    },
    robots: hasFilterQuery
      ? { index: false, follow: true }
      : { index: true, follow: true }
  };
}

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


function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getArticleSummary(article: ArticleWithCmsAliases) {
  return article.summary || article.description || "";
}

function getCardSummary(article: ArticleWithCmsAliases) {
  const summary = stripHtml(getArticleSummary(article));
  const firstSentence = summary.match(/^.+?[。！？!?]/)?.[0];

  return firstSentence || summary;
}

function getArticleImageUrl(article: ArticleWithCmsAliases, width = 800) {
  const imageUrl = article.eyecatch?.url || article.ogImage?.url || "";
  return getOptimizedImageUrl(imageUrl, width);
}

function getArticleImageAlt(article: ArticleWithCmsAliases) {
  return article.eyecatchAlt || "";
}

function getArticleTags(article: ArticleWithCmsAliases) {
  const tags = article.subTags || article.tags || [];
  const normalizedTags = Array.isArray(tags) ? tags : [tags];

  return normalizedTags
    .map((tag) => String(tag).replace(/^#/, "").trim())
    .filter((tag) => tag && !hiddenTags.has(tag));
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
  const categoryText = getArticleCategories(article)
    .map((category) => getCategoryDisplayName(category))
    .join(" ");
  const tagText = getArticleTags(article).join(" ");
  const summaryText = getArticleSummary(article);

  return normalizeSearchKeyword(
    stripHtml([article.title, categoryText, tagText, summaryText].filter(Boolean).join(" "))
  );
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

function buildArticlesListHref({
  tag,
  q,
  page
}: {
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

  return query ? `/articles?${query}` : "/articles";
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
  selectedTag,
  searchQuery
}: {
  selectedTag?: string;
  searchQuery?: string;
}) {
  return (
    <form className="search-box" action="/articles" method="get">
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
          href={buildArticlesListHref({
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
  currentPage,
  totalPages,
  selectedTag,
  searchQuery
}: {
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
          className="pagination-link pagination-first"
          href={buildArticlesListHref({
            tag: selectedTag,
            q: searchQuery,
            page: 1
          })}
          aria-label="最初のページへ移動"
        >
          最初へ
        </Link>
      ) : (
        <span className="pagination-link pagination-first disabled">最初へ</span>
      )}

      {currentPage > 1 ? (
        <Link
          className="pagination-link pagination-prev"
          href={buildArticlesListHref({
            tag: selectedTag,
            q: searchQuery,
            page: currentPage - 1
          })}
          aria-label="前のページへ移動"
        >
          ← 前のページ
        </Link>
      ) : (
        <span className="pagination-link pagination-prev disabled">← 前のページ</span>
      )}

      <div className="pagination-status" aria-live="polite">
        {currentPage} / {totalPages}ページ
      </div>

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
                  href={buildArticlesListHref({
                    tag: selectedTag,
                    q: searchQuery,
                    page
                  })}
                  aria-label={`${page}ページ目へ移動`}
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
          className="pagination-link pagination-next"
          href={buildArticlesListHref({
            tag: selectedTag,
            q: searchQuery,
            page: currentPage + 1
          })}
          aria-label="次のページへ移動"
        >
          次のページ →
        </Link>
      ) : (
        <span className="pagination-link pagination-next disabled">次のページ →</span>
      )}

      {currentPage < totalPages ? (
        <Link
          className="pagination-link pagination-last"
          href={buildArticlesListHref({
            tag: selectedTag,
            q: searchQuery,
            page: totalPages
          })}
          aria-label="最後のページへ移動"
        >
          最後へ
        </Link>
      ) : (
        <span className="pagination-link pagination-last disabled">最後へ</span>
      )}
    </nav>
  );
}

function VisualBox({
  article,
  priority = false
}: {
  article: ArticleWithCmsAliases;
  priority?: boolean;
}) {
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
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
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

function ArticleCard({
  article,
  priority = false
}: {
  article: ArticleWithCmsAliases;
  priority?: boolean;
}) {
  const category = getArticleCategory(article);
  const tags = getArticleTags(article);
  const articlePath = getArticlePath(article);
  const summary = getCardSummary(article);

  return (
    <article className="card">
      <Link href={articlePath} className="card-link">
        <div style={{ position: "relative" }}>
          <VisualBox article={article} priority={priority} />
          <span className="tag" style={{ background: tagColor[category] || "#B85C1E" }}>
            {getCategoryDisplayName(category)}
          </span>
        </div>

        <div className="card-body">
          <div className="card-title">{article.title}</div>
          {summary ? <p className="card-summary">{summary}</p> : null}
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

function Sidebar() {
  return (
    <aside>
      <div className="sidebar-stack">
        <div className="side-card editor-card">
          <h3>編集部について</h3>
          <p className="side-card-text">
            毎日の暮らしで迷いやすい小さな不便や、ガジェット・機材、便利グッズ選びを一般家庭の目線で整理しています。
            原因、注意点、向いている人、向いていない人を短く確認できるようにまとめています。
          </p>
          <Link className="read-more" href="/about">
            運営方針を見る →
          </Link>
        </div>

        <div className="side-card">
          <h3>目的別に探す</h3>
          <div className="purpose-link-list">
            {purposeLinks.map((link) => (
              <Link key={link.name} className="purpose-link" href={link.href}>
                <span>{link.name}</span>
                <small>{link.description}</small>
              </Link>
            ))}
          </div>
        </div>

        <DesktopAdmaxSlot />
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>該当する記事はまだありません</h3>
      <p>別のタグや検索ワードで記事を探してみてください。</p>
      <Link href="/articles" className="read-more">
        新着記事一覧へ戻る
      </Link>
    </div>
  );
}

export default async function ArticlesIndexPage({ searchParams }: ArticlesPageProps) {
  const params = await Promise.resolve(searchParams || {});
  const selectedTag = params.tag?.trim() || undefined;
  const searchQuery = params.q?.trim() || "";
  const requestedPage = parsePageNumber(params.page);

  let articles: ArticleWithCmsAliases[] = [];

  try {
    articles = (await getCachedArticles()) as ArticleWithCmsAliases[];
  } catch {
    articles = [];
  }

  const normalArticles = articles.filter((article) => !article.isAd);

  const visibleArticles = normalArticles.filter((article) => {
    const tags = getArticleTags(article);

    if (selectedTag && !tags.includes(selectedTag)) return false;
    if (searchQuery && !articleMatchesSearch(article, searchQuery)) return false;

    return true;
  });

  const totalArticles = visibleArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
  const currentPage = clampPage(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const pagedArticles = visibleArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

    const title = searchQuery
    ? `「${searchQuery}」の検索結果`
    : selectedTag
      ? `${selectedTag}の記事`
      : "新着記事一覧";

  return (
    <div className="page">
      <SiteHeader activeCategory="top" />

      <main className="container">
        <Breadcrumbs items={[{ name: "新着記事一覧", href: "/articles" }]} />

        <div className="layout">
          <section>
            <h1 className="section-title">{title}</h1>
            <div className="list-status">
              <span>{totalArticles}件の記事</span>
              <span>{currentPage} / {totalPages}ページ</span>
            </div>

            <SearchBox
              selectedTag={selectedTag}
              searchQuery={searchQuery}
            />

            {visibleArticles.length > 0 ? (
              <>
                <div className="cards">
                  {pagedArticles.map((article, index) => (
                    <Fragment key={article.id}>
                      <ArticleCard
                        article={article}
                        priority={currentPage === 1 && index < 2}
                      />
                      {pagedArticles.length >= ARTICLES_PER_PAGE && index === 3 ? (
                        <InlineListAdmaxSlot />
                      ) : null}
                    </Fragment>
                  ))}
                </div>

                <Pagination
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

          <Sidebar />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
