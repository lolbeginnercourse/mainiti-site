import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "毎日を楽に生きるの個人情報、Cookie、アクセス解析に関する方針です。",
  alternates: {
    canonical: "https://mainitiwo.com/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <div className="page">
      <main className="article-page static-page">
        <Link className="back-button" href="/">
          ← トップへ戻る
        </Link>

        <article className="article-card">
          <div className="article-content">
            <h1 className="article-title">プライバシーポリシー</h1>

            <div className="article-body">
              <h2>個人情報の利用について</h2>
              <p>
                当サイトでは、お問い合わせ等の際に入力いただいた情報を、回答や連絡のために利用します。
                法令に基づく場合を除き、本人の同意なく第三者へ提供することはありません。
              </p>

              <h2>アクセス解析について</h2>
              <p>
                当サイトでは、サイト改善のためにアクセス解析ツールを利用する場合があります。
                取得される情報は匿名で収集され、個人を特定するものではありません。
              </p>

              <h2>改定について</h2>
              <p>
                本ポリシーは、法令やサービス内容の変更に応じて見直し、必要に応じて更新します。
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
