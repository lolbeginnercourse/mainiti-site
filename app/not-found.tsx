import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <main className="article-page static-page">
        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">ページが見つかりません</h1>

            <div className="article-body">
              <p>
                お探しのページは、URLが変更されたか、現在は公開されていない可能性があります。
              </p>
              <p>
                トップページやカテゴリ一覧から、公開中の記事を探してみてください。
              </p>
            </div>

            <div className="article-bottom-nav">
              <Link className="bottom-nav-button primary" href="/">
                トップへ戻る
              </Link>
              <Link className="bottom-nav-button" href="/category/kurashi">
                暮らしの記事を見る
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
