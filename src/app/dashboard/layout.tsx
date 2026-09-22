import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background print:min-h-0">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-baseline gap-4">
            <Link href="/" className="font-serif text-base font-bold tracking-tight">
              Arigato<span className="text-primary">Menu</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-[0.8125rem] font-semibold text-foreground"
            >
              ダッシュボード
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              トップページ
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 print:px-0 print:py-0">{children}</main>
    </div>
  );
}