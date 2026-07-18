import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

export const metadata: Metadata = {
  title: "広告掲載ポリシー",
  description:
    "毎日を楽に生きるの広告掲載、アフィリエイト、商品選定基準に関する方針です。",
  alternates: {
    canonical: "https://mainitiwo.com/advertising-policy"
  }
};

export default function AdvertisingPolicyPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="article-page static-page">
        <Breadcrumbs items={[{ name: "広告掲載ポリシー", href: "/advertising-policy" }]} />
        <Link className="back-button" href="/">← トップへ戻る</Link>
        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">広告掲載ポリシー</h1>
            <div className="article-body">
              <h2>広告とアフィリエイトについて</h2>
              <p>
                当サイトでは、第三者配信広告、Amazonアソシエイト、楽天アフィリエイトなどの成果報酬型広告を利用する場合があります。
                リンク経由で商品やサービスが購入された場合、当サイトが報酬を受け取ることがあります。
              </p>
              <h2>商品選定の考え方</h2>
              <p>
                商品やサービスを掲載する際は、記事テーマとの関連性、読者が確認したい悩み、使う場面、注意点を踏まえて選定します。
                広告報酬の有無だけで記事の結論や評価を決めることはありません。
              </p>
              <h2>価格・在庫・仕様について</h2>
              <p>
                価格、在庫、仕様、サービス内容は変更される場合があります。最終的な情報はリンク先の販売ページや公式情報で確認してください。
              </p>
              <h2>PR表記について</h2>
              <p>
                広告・アフィリエイトリンクを含む場合でも、読者が判断しやすいように、必要に応じて商品リンクや広告であることが分かる表示を行います。
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
