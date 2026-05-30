import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営者情報｜毎日を楽に生きる",
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
                毎日を楽に生きるは、家事、防災、家電紹介、便利グッズ、ライフスタイルなど、
                日々の暮らしで迷いやすいテーマをわかりやすく整理する実用メディアです。
              </p>

              <h2>運営者</h2>
              <p>毎日を楽に生きる編集部</p>

              <h2>編集方針</h2>
              <p>
                読者が自分の状況に合わせて判断できるように、メリットだけでなく注意点、
                向いているケース、向いていないケースもできるだけ明記します。
              </p>
              <p>
                商品やサービスを紹介する場合も、購入を急がせる表現ではなく、
                比較・確認・検討に役立つ情報を優先します。
              </p>

              <h2>広告・アフィリエイトについて</h2>
              <p>
                当サイトは広告配信サービスやアフィリエイトプログラムを利用する場合があります。
                記事内のリンクから商品やサービスを購入・申し込みされた場合、当サイトが報酬を受け取ることがあります。
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
