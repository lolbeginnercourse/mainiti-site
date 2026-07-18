import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "毎日を楽に生きるへのお問い合わせ、掲載内容の確認依頼についてのページです。",
  alternates: {
    canonical: "https://mainitiwo.com/contact"
  }
};

export default function ContactPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="article-page static-page">
        <Breadcrumbs items={[{ name: "お問い合わせ", href: "/contact" }]} />

        <Link className="back-button" href="/">
          ← トップへ戻る
        </Link>

        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">お問い合わせ</h1>

            <div className="article-body">
              <p>
                掲載内容の確認、修正依頼、その他サイトに関するご連絡は、
                下記メールアドレスまでお願いいたします。
              </p>

              <p>
                <a href="mailto:contact@mainitiwo.com">contact@mainitiwo.com</a>
              </p>

              <h2>ご連絡時のお願い</h2>
              <p>
                該当する記事URL、確認したい内容、返信先を添えていただくと確認がスムーズです。
                内容によっては返信まで時間をいただく場合があります。
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
