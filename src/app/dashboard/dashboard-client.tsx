"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  PencilLine,
  Plus,
  Printer,
  QrCode,
  Search,
  Settings2,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardRestaurantItem = {
  id: string;
  name: string;
  tagline: string | null;
  slug: string;
  isPublished: boolean;
  logoUrl: string | null;
  updatedAt: string;
  categoryCount: number;
  itemCount: number;
  availableCount: number;
  publicUrl: string;
};

export function DashboardClient({
  userEmail,
  restaurants,
}: {
  userEmail: string;
  restaurants: DashboardRestaurantItem[];
}) {
  const [search, setSearch] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      (r.tagline && r.tagline.toLowerCase().includes(search.toLowerCase())),
  );

  const totalPublished = restaurants.filter((r) => r.isPublished).length;
  const totalItems = restaurants.reduce((acc, r) => acc + r.itemCount, 0);

  const handleCopy = (url: string, slug: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-black tracking-tight">
            ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-accent" />
            ログイン中: <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        </div>
        <Link
          href="/dashboard/restaurants/new"
          className={cn(buttonVariants({ size: "default" }), "gap-1.5 font-bold shadow-xs")}
        >
          <Plus size={16} /> レストランを追加
        </Link>
      </div>

      {/* Summary Metrics */}
      {restaurants.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              登録店舗
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-black text-foreground">
                {restaurants.length}
              </span>
              <span className="text-xs text-muted-foreground">店舗</span>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              公開中
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-black text-primary">
                {totalPublished}
              </span>
              <span className="text-xs text-muted-foreground">/ {restaurants.length} 店舗</span>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              総メニュー品数
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-black text-accent">
                {totalItems}
              </span>
              <span className="text-xs text-muted-foreground">品登録済み</span>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              多言語・QR対応
            </span>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">日英中韓 4言語</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {restaurants.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border-2 border-dashed border-border/80 bg-card py-20 px-6 text-center">
          <div className="flex flex-col items-center gap-5 max-w-md">
            <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <Store size={28} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-black tracking-tight">
                はじめてのレストランをつくる
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                店の情報を登録するだけで、多言語デジタルメニューと卓上POP・QRステッカーが即座に発行されます。
              </p>
            </div>
            <Link
              href="/dashboard/restaurants/new"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-bold shadow-xs")}
            >
              <Plus size={18} /> レストランを登録する
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Search bar if multiple restaurants */}
          {restaurants.length > 2 && (
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="店舗名やURLで絞り込み…"
                className="w-full rounded-xl border border-border/80 bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary shadow-2xs"
              />
            </div>
          )}

          {/* Restaurant Card List */}
          <div className="grid gap-4">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="group flex flex-col justify-between gap-5 rounded-2xl border border-border/70 bg-card p-6 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs"
              >
                {/* Top Section */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {r.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.logoUrl}
                        alt={r.name}
                        className="size-14 shrink-0 rounded-2xl border border-border/60 object-cover"
                      />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground font-serif text-xl font-bold text-background">
                        {r.name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/dashboard/restaurants/${r.id}`}
                          className="font-serif text-lg font-bold tracking-tight hover:text-primary transition-colors"
                        >
                          {r.name}
                        </Link>
                        {r.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-accent">
                            ● 公開中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
                            下書き / 非公開
                          </span>
                        )}
                      </div>

                      {r.tagline && (
                        <p className="mt-1 text-xs text-muted-foreground">{r.tagline}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono text-[0.6875rem]">
                          <QrCode size={13} className="text-primary" />
                          /r/{r.slug}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed size={13} />
                          {r.categoryCount}カテゴリー / {r.itemCount}品登録
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Public Link & Quick Copy */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(r.publicUrl, r.slug)}
                      className="text-xs gap-1.5"
                    >
                      {copiedSlug === r.slug ? (
                        <Check size={13} className="text-accent" />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copiedSlug === r.slug ? "URLコピー完了" : "URLコピー"}
                    </Button>

                    <Link
                      href={r.publicUrl}
                      target="_blank"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-xs gap-1",
                      )}
                    >
                      <ExternalLink size={13} /> 公開メニュー
                    </Link>
                  </div>
                </div>

                {/* Bottom Action Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/restaurants/${r.id}/menu`}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "text-xs font-bold gap-1.5 shadow-2xs",
                      )}
                    >
                      <PencilLine size={13} /> メニューを編集
                    </Link>

                    <Link
                      href={`/dashboard/restaurants/${r.id}/qr`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs font-semibold gap-1.5",
                      )}
                    >
                      <Sparkles size={13} className="text-primary" /> 卓上POP・QRステッカー
                    </Link>

                    <Link
                      href={`/dashboard/restaurants/${r.id}/print`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs font-semibold gap-1.5",
                      )}
                    >
                      <Printer size={13} /> 印刷用紙メニュー (A4/A5)
                    </Link>
                  </div>

                  <Link
                    href={`/dashboard/restaurants/${r.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "text-xs text-muted-foreground hover:text-foreground gap-1.5",
                    )}
                  >
                    <Settings2 size={13} /> 店舗設定・ロゴ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
