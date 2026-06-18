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
  暮らし: "#C76A2A",
  防災: "#3B6F9E",
  家電: "#64748B",
  お金: "#D08A24",
  ライフスタイル: "#7A9A75",
  リラックス: "#6F9DB5",
  広告: "#B85C1E"
};

export const categoryBackground: Record<string, string> = {
  暮らし: "linear-gradient(135deg,#FFF4E6,#F1D7B6,#E8BE86)",
  防災: "linear-gradient(135deg,#EAF3FA,#D8EAF6,#CFE3F2)",
  家電: "linear-gradient(135deg,#F9FAFB,#E5E7EB,#D1D5DB)",
  お金: "linear-gradient(135deg,#FFF7ED,#F0D2A7,#E7B875)",
  ライフスタイル: "linear-gradient(135deg,#F2F6EE,#EAF3E7,#DDEBD8)",
  リラックス: "linear-gradient(135deg,#F0F8FA,#EAF3FA,#D6E9F2)",
  広告: "linear-gradient(135deg,#FFF4E6,#F0E8D8,#EAF3FA)"
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
  { name: "暮らし", key: "暮らし", href: getCategoryHref("暮らし") },
  { name: "防災", key: "防災", href: getCategoryHref("防災") },
  { name: "家電", key: "家電", href: getCategoryHref("家電") },
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
