import type { Metadata } from "next";
import "./globals.css";

const siteName = "毎日を楽に生きる";
const siteUrl = "https://mainitiwo.com";
const siteTitle = "毎日を楽に生きる｜暮らし・防災・ガジェット・機材・便利グッズの実用ガイド";
const siteDescription =
  "毎日の暮らしを少し楽にするための実用メディア。防災、ガジェット・機材、便利グッズ、ライフスタイルの疑問を初心者にもわかりやすく整理して解説します。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s｜${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "毎日を楽に生きる",
    "暮らし",
    "防災",
    "家電",
    "ガジェット",
    "機材",
    "便利グッズ",
    "ライフスタイル",
    "育児",
    "生活の知恵",
    "実用ガイド",
  ],
  authors: [
    {
      name: "毎日を楽に生きる編集部",
      url: siteUrl,
    },
  ],
  creator: "毎日を楽に生きる編集部",
  publisher: siteName,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteName,
    alternateName: ["毎日を快適にする暮らしの知恵", "mainitiwo"],
    url: siteUrl,
    description: siteDescription,
    inLanguage: "ja-JP",
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
  };

  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://images.microcms-assets.io" />
        <link rel="dns-prefetch" href="https://images.microcms-assets.io" />
        <meta name="robots" content="max-image-preview:large" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        {children}
      </body>
    </html>
  );
}
