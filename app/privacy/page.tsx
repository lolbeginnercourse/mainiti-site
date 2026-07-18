import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

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
      <SiteHeader />
      <main className="article-page static-page">
        <Breadcrumbs items={[{ name: "プライバシーポリシー", href: "/privacy" }]} />

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

              <h2>Cookieと広告配信について</h2>
              <p>
                当サイトでは、広告配信やアクセス状況の確認のためにCookieを使用する場合があります。
                Cookieによりブラウザを識別することがありますが、氏名、住所、メールアドレスなど個人を直接特定する情報を収集するものではありません。
              </p>
              <p>
                当サイトでは、忍者AdMaxなどの第三者配信広告サービスを利用する場合があります。
                広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie等を使用することがあります。
                Cookieの利用を望まない場合は、ブラウザ設定から無効にできます。
              </p>

              <h2>アフィリエイトについて</h2>
              <p>
                当サイトでは、Amazonアソシエイト、楽天アフィリエイトなどのアフィリエイトプログラムを利用する場合があります。
                商品リンクを経由して購入が発生した場合、当サイトが報酬を受け取ることがあります。
              </p>

              <h2>第三者送信について</h2>
              <p>
                広告配信、アクセス解析、外部サービスの利用に伴い、閲覧情報などが外部事業者へ送信される場合があります。
                送信される情報はサービス提供、広告配信、利用状況の分析、サイト改善のために利用されます。
              </p>

              <h2>改定日</h2>
              <p>2026年7月18日</p>

              <h2>改定について</h2>
              <p>
                本ポリシーは、法令やサービス内容の変更に応じて見直し、必要に応じて更新します。
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
