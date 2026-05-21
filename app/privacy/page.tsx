import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜毎日を楽に生きる",
  description:
    "毎日を楽に生きるの個人情報、Cookie、アクセス解析、広告配信に関する方針です。",
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

              <h2>広告配信について</h2>
              <p>
                当サイトでは、第三者配信の広告サービスを利用する場合があります。
                広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。
              </p>
              <p>
                Google などの第三者配信事業者は、Cookie やウェブビーコン等を使用して、
                当サイトや他サイトへのアクセス情報に基づき広告を配信することがあります。
              </p>
              <p>
                Google による広告での Cookie の使用を無効にする方法は、
                Google の広告設定ページで確認できます。
              </p>

              <h2>アクセス解析について</h2>
              <p>
                当サイトでは、サイト改善のためにアクセス解析ツールを利用する場合があります。
                取得される情報は匿名で収集され、個人を特定するものではありません。
              </p>

              <h2>アフィリエイトについて</h2>
              <p>
                当サイトは Amazon アソシエイト、楽天アフィリエイト、その他アフィリエイトプログラムを利用する場合があります。
                商品やサービスの詳細、価格、在庫、契約条件はリンク先の販売ページでご確認ください。
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
