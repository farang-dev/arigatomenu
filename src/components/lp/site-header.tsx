import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "./logo";

const nav = [
  { label: "機能", href: "#features" },
  { label: "使い方", href: "#usage" },
  { label: "導入の流れ", href: "#guide" },
  { label: "FAQ", href: "#faq" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-[0.8125rem] font-medium text-muted-foreground md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants(), "h-9 px-4 text-[0.8125rem] font-bold")}
            >
              ダッシュボード
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "hidden text-[0.8125rem] font-medium sm:inline-flex",
                )}
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants(), "h-9 px-4 text-[0.8125rem] font-bold")}
              >
                無料ではじめる
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}