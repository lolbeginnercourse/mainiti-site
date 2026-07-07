import Link from "next/link";
import { SITE_URL, categories, siteInfoLinks } from "@/src/libs/site-config";
import type { MainCategory } from "@/src/libs/microcms";
import { LazyAdmaxSlot } from "@/app/components/LazyAdmaxSlot";
import { MobileAdmaxOverlay } from "@/app/components/MobileAdmaxOverlay";

const mobileAdmaxScriptSrc =
  "https://adm.shinobi.jp/s/de612ab7a7e96cf7e1e0cb58d884c97a";
const desktopAdmaxScriptSrc =
  "https://adm.shinobi.jp/s/461b51a653437bbdd4d7abccf2acc683";
const inlineListAdmaxScriptSrc =
  "https://adm.shinobi.jp/s/d2ea3e0b78acb0bd4578fa407fb6244f";

type SiteHeaderProps = {
  activeCategory?: "top" | MainCategory;
  titleAs?: "h1" | "div";
};

type BreadcrumbItem = {
  name: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbItems = [{ name: "トップ", href: "/" }, ...items];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, SITE_URL).toString()
    }))
  };

  return (
    <>
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <ol className="breadcrumbs-list">
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li key={`${item.href}-${index}`} className="breadcrumbs-item">
                {isCurrent ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.href}>{item.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}

export function SiteHeader({ activeCategory, titleAs = "div" }: SiteHeaderProps) {
  return (
    <>
      <header className="site-header">
        <div className="decor-band top" />
        <div className="decor-band bottom" />
        <div className="header-info-links">
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/contact">お問い合わせ</Link>
        </div>
        <div className="title-wrap">
          <div className="site-badge">家庭の実用メディア</div>
          {titleAs === "h1" ? (
            <h1 className="site-title">毎日を楽に生きる</h1>
          ) : (
            <div className="site-title">毎日を楽に生きる</div>
          )}
        </div>
      </header>

      <nav className="nav">
        <div className="nav-list">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={category.href}
              className={
                activeCategory === category.key ? "nav-item active" : "nav-item"
              }
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      <MobileAdmaxOverlay
        mediaQuery="(max-width: 768px)"
        scriptSrc={mobileAdmaxScriptSrc}
      />
    </>
  );
}

export function DesktopAdmaxSlot() {
  return (
    <LazyAdmaxSlot
      className="admax-slot admax-slot-desktop"
      mediaQuery="(min-width: 769px)"
      scriptSrc={desktopAdmaxScriptSrc}
      title="広告"
    />
  );
}

export function InlineListAdmaxSlot() {
  return (
    <LazyAdmaxSlot
      className="admax-slot admax-slot-inline"
      collapseUntilLoaded
      mediaQuery="(min-width: 769px)"
      scriptSrc={inlineListAdmaxScriptSrc}
      title="広告"
    />
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h3 className="footer-heading">カテゴリ</h3>
          <div className="footer-links">
            {categories.map((category) => (
              <Link key={category.key} className="footer-link" href={category.href}>
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="footer-heading">サイト情報</h3>
          <div className="footer-links">
            {siteInfoLinks.map((link) => (
              <Link key={link.href} className="footer-link" href={link.href}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 毎日を楽に生きる</div>
    </footer>
  );
}
