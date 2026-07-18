import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

export const metadata: Metadata = {
  title: "幸田あかりの記事作成方針",
  description:
    "毎日を楽に生きるの記事作成者、幸田あかりの担当分野と執筆方針です。",
  alternates: {
    canonical: "https://mainitiwo.com/authors/akari"
  }
};

export default function AuthorAkariPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="article-page static-page">
        <Breadcrumbs items={[{ name: "幸田あかり", href: "/authors/akari" }]} />
        <Link className="back-button" href="/">← トップへ戻る</Link>
        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">幸田 あかり</h1>
            <div className="article-body">
              <h2>担当分野</h2>
              <p>
                スマホ用品、家事用品、収納、掃除、季節の暮らし、日常の小さな不便を中心に記事を作成しています。
              </p>
              <h2>執筆方針</h2>
              <p>
                まず「なぜ困るのか」を整理し、買う前・試す前に確認したい条件を生活者の目線でまとめます。
                商品や方法をひとつに決めつけず、向いている人、向いていない人、見落としやすい点を併記することを大切にしています。
              </p>
              <h2>実体験の範囲</h2>
              <p>
                家の中で起きる片づけ、掃除、スマホ周辺機器、季節ごとの困りごとを中心に、一般家庭で起こりやすい場面を想定して記事を整理しています。
              </p>
              <h2>執筆記事一覧</h2>
              <p>
                執筆記事は各記事ページ下部の「記事作成者」表示から確認できるよう、順次整備しています。
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
