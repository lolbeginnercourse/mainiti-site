import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "免責事項｜毎日を楽に生きる",
  description:
    "毎日を楽に生きるの掲載情報、広告、外部リンクに関する免責事項です。",
  alternates: {
    canonical: "https://mainitiwo.com/disclaimer"
  }
};

export default function DisclaimerPage() {
  return (
    <div className="page">
      <main className="article-page static-page">
        <Link className="back-button" href="/">
          ← トップへ戻る
        </Link>

        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">免責事項</h1>

            <div className="article-body">
              <h2>掲載情報について</h2>
              <p>
                当サイトでは、できる限り正確な情報を掲載するよう努めていますが、
                内容の正確性、最新性、完全性を保証するものではありません。
              </p>

              <h2>商品・サービスについて</h2>
              <p>
                商品やサービスの価格、在庫、仕様、キャンペーン内容は変更される場合があります。
                購入や申し込みの前に、必ずリンク先の公式情報や販売ページをご確認ください。
              </p>

              <h2>外部リンクについて</h2>
              <p>
                当サイトから移動した外部サイトで提供される情報、サービス、商品等について、
                当サイトは責任を負いかねます。
              </p>

              <h2>損害等の責任について</h2>
              <p>
                当サイトの情報を利用したことにより生じた損害等について、当サイトは責任を負いかねます。
                最終的な判断は、ご自身の状況に合わせて行ってください。
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
