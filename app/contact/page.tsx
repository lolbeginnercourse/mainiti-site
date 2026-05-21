import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "お問い合わせ｜毎日を楽に生きる",
  description:
    "毎日を楽に生きるへのお問い合わせ、掲載内容の確認依頼、広告に関する連絡についてのページです。",
  alternates: {
    canonical: "https://mainitiwo.com/contact"
  }
};

export default function ContactPage() {
  return (
    <div className="page">
      <main className="article-page static-page">
        <Link className="back-button" href="/">
          ← トップへ戻る
        </Link>

        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">お問い合わせ</h1>

            <div className="article-body">
              <p>
                掲載内容の確認、修正依頼、広告掲載、その他サイトに関するご連絡は、
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
    </div>
  );
}
