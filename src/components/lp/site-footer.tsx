import Link from "next/link";

const nav = [
  { label: "機能", href: "#features" },
  { label: "使い方", href: "#usage" },
  { label: "導入の流れ", href: "#guide" },
  { label: "FAQ", href: "#faq" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[26px] bg-primary text-sm font-black text-background">
            あ
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-black tracking-tight">
              Arigato<span className="text-primary">Menu</span>
            </span>
            <span className="text-[0.6rem] font-medium tracking-[0.2em] text-muted-foreground">
              ありがとうメニュー
            </span>
          </div>
        </div>
        <div className="mt-8 grid gap-8 border-t border-border pt-8 text-sm sm:grid-cols-2">
          <nav className="grid grid-cols-2 gap-5 text-[0.8125rem] font-medium text-muted-foreground">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
            <Link href="/login" className="hover:text-foreground">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              無料ではじめる
            </Link>
          </nav>
          <div className="text-[0.8125rem] leading-6 text-muted-foreground">
            <p className="font-bold text-foreground">ArigatoMenu 開発プロジェクト</p>
            <p className="mt-1 max-w-xs">
              レストラン・カフェ・バーのための、多言語デジタルメニュー。
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-border pt-6 text-center text-xs font-medium text-muted-foreground">
          © {new Date().getFullYear()} ArigatoMenu
        </p>
      </div>
    </footer>
  );
}