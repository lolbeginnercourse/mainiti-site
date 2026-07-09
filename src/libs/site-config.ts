import type { MainCategory } from "@/src/libs/microcms";

export const SITE_URL = "https://mainitiwo.com";
export const DEFAULT_CATEGORY: MainCategory = "暮らし";

export const categorySlugMap: Record<MainCategory, string> = {
  暮らし: "kurashi",
  防災: "bousai",
  家電: "kaden",
  お金: "okane",
  ライフスタイル: "lifestyle",
  リラックス: "relax",
  広告: "ad"
};

export const categoryTitleMap: Record<string, MainCategory> = {
  kurashi: "暮らし",
  bousai: "防災",
  kaden: "家電",
  okane: "お金",
  lifestyle: "ライフスタイル",
  relax: "リラックス",
  ad: "広告"
};

export const categoryDisplayName: Partial<Record<MainCategory, string>> = {
  お金: "ガジェット・機材",
  リラックス: "便利グッズ"
};

export const categoryAliasMap: Record<string, MainCategory> = {
  "ガジェット・機材": "お金",
  便利グッズ: "リラックス"
};

export const tagColor: Record<string, string> = {
  暮らし: "#495057",
  防災: "#495057",
  家電: "#495057",
  お金: "#343A40",
  ライフスタイル: "#6C757D",
  リラックス: "#495057",
  広告: "#343A40"
};

export const categoryBackground: Record<string, string> = {
  暮らし: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#E9ECEF)",
  防災: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#E9ECEF)",
  家電: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#E9ECEF)",
  お金: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#DEE2E6)",
  ライフスタイル: "linear-gradient(135deg,#FFFFFF,#F8F9FA,#E9ECEF)",
  リラックス: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#E9ECEF)",
  広告: "linear-gradient(135deg,#FFFFFF,#F1F3F5,#DEE2E6)"
};

export const categoryNames = Object.keys(categorySlugMap) as MainCategory[];

export function getCategoryHref(category: MainCategory) {
  if (category === "広告") {
    return "/";
  }

  return `/category/${categorySlugMap[category]}`;
}

export function getCategoryFromSlug(slug: string) {
  return categoryTitleMap[slug];
}

export function getCategoryDisplayName(category: MainCategory | string) {
  return categoryDisplayName[category as MainCategory] || category;
}

export const categories: Array<{
  name: string;
  key: "top" | MainCategory;
  href: string;
}> = [
  { name: "トップ", key: "top", href: "/" },
  { name: getCategoryDisplayName("お金"), key: "お金", href: getCategoryHref("お金") },
  {
    name: getCategoryDisplayName("リラックス"),
    key: "リラックス",
    href: getCategoryHref("リラックス")
  },
  {
    name: "ライフスタイル",
    key: "ライフスタイル",
    href: getCategoryHref("ライフスタイル")
  }
];

export const siteInfoLinks = [
  { name: "運営者情報", href: "/about" },
  { name: "プライバシーポリシー", href: "/privacy" },
  { name: "免責事項", href: "/disclaimer" },
  { name: "お問い合わせ", href: "/contact" }
];

export const purposeLinks = [
  {
    name: "家電選びで後悔したくない",
    description: "置き場所、サイズ、使い方を先に確認する",
    href: getCategoryHref("お金")
  },
  {
    name: "家事を少し楽にしたい",
    description: "掃除、洗濯、片づけの負担を減らす",
    href: getCategoryHref("暮らし")
  },
  {
    name: "便利グッズを見直したい",
    description: "買う前に使う場面と保管場所を考える",
    href: getCategoryHref("リラックス")
  },
  {
    name: "暮らしの小さな不便を整理したい",
    description: "日常で困りやすい原因と対策を見る",
    href: getCategoryHref("ライフスタイル")
  }
];
