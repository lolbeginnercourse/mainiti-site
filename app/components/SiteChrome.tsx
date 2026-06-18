import Link from "next/link";
import { categories, siteInfoLinks } from "@/src/libs/site-config";
import type { MainCategory } from "@/src/libs/microcms";

type SiteHeaderProps = {
  activeCategory?: "top" | MainCategory;
  titleAs?: "h1" | "div";
};

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
          <p className="site-subtitle">
            家のことを少しラクにする、家事・防災・ガジェット・機材・便利グッズの整理帖
          </p>
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
    </>
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
