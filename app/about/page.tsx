import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営者情報",
  description:
    "毎日を楽に生きるの運営方針、編集方針、掲載内容についてのページです。",
  alternates: {
    canonical: "https://mainitiwo.com/about"
  }
};

export default function AboutPage() {
  return (
    <div className="page">
      <main className="article-page static-page">
        <Link className="back-button" href="/">
          ← トップへ戻る
        </Link>

        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">運営者情報</h1>

            <div className="article-body">
              <h2>サイトについて</h2>
              <p>
                毎日を楽に生きるは、家事、防災、ガジェット・機材、便利グッズ、ライフスタイルなど、
                日々の暮らしで迷いやすいテーマをわかりやすく整理する実用メディアです。
              </p>

              <h2>運営者</h2>
              <p>毎日を楽に生きる編集部</p>
              <p>
                一般家庭で使いやすい家電・ガジェット、日用品、防災用品を中心に、
                「買う前に確認したいこと」「実際の暮らしで困りやすいこと」を整理して発信しています。
                専門家だけが使う言葉ではなく、家の中でそのまま判断に使える説明を大切にしています。
              </p>
              <p>
                防災については、家庭で備えやすい量や置き場所、停電・断水時に困りやすい点を中心に確認しています。
                家電や便利グッズは、使う人や家の状況に合うかを重視して紹介します。
              </p>

              <h2>編集方針</h2>
              <p>
                読者が自分の状況に合わせて判断できるように、メリットだけでなく注意点、
                向いているケース、向いていないケースもできるだけ明記します。
              </p>
              <p>
                商品やサービスを紹介する場合も、購入を急がせる表現ではなく、
                比較・確認・検討に役立つ情報を優先します。
              </p>

            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
