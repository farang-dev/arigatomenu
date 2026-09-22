"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DIETARY_LABELS, allergenLabel, dietaryLabel } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";

export type PublicItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  status: "available" | "unavailable";
  dietary: string[];
  allergens: string[];
  translations: Record<string, { name: string; description: string | null }>;
};

export type PublicCategory = {
  id: string;
  name: string;
  items: PublicItem[];
};

type Locale = "ja" | "en" | "zh" | "ko";

const LANG_OPTIONS: { value: Locale; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
];

const UI_COPY: Record<Locale, { search: string; allergens: string; unavailable: string; updated: string; eyebrow: string; noResults: string }> = {
  ja: { search: "メニューを検索", allergens: "アレルゲン28品目表示", unavailable: "本日はご提供を終了", updated: "更新", eyebrow: "メニュー", noResults: "メニューが見つかりません" },
  en: { search: "Search this menu", allergens: "28 allergens shown", unavailable: "Sold out today", updated: "Updated", eyebrow: "MENU", noResults: "No menu items found" },
  zh: { search: "搜索菜单", allergens: "标注28种过敏原", unavailable: "今日已售完", updated: "更新于", eyebrow: "菜单", noResults: "没有找到菜单" },
  ko: { search: "메뉴 검색", allergens: "알레르기 28종 표기", unavailable: "오늘은 판매 종료", updated: "업데이트", eyebrow: "메뉴", noResults: "메뉴를 찾을 수 없습니다" },
};

export function MenuView({
  restaurant,
  categories,
  locale,
}: {
  restaurant: { name: string; tagline: string | null; description: string | null; updatedAt: string | null; logoUrl: string | null };
  categories: PublicCategory[];
  locale: Locale;
}) {
  const router = useRouter();
  const t = UI_COPY[locale];
  const [query, setQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<Set<string>>(new Set());
  const langFor = (l: Locale) => router.replace(`?lang=${l}`, { scroll: false });

  const toggleDietary = (key: string) =>
    setDietaryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (item: PublicItem) => {
      if (!q) return true;
      const name = (item.translations?.[locale]?.name ?? item.name).toLowerCase();
      const desc = (item.translations?.[locale]?.description ?? item.description).toLowerCase();
      return name.includes(q) || desc.includes(q);
    };
    const dietary = (item: PublicItem) => {
      for (const k of dietaryFilter) if (!item.dietary.includes(k)) return false;
      return true;
    };
    return categories
      .map((cat) => ({ ...cat, items: cat.items.filter((i) => filter(i) && dietary(i)) }))
      .filter((cat) => cat.items.length > 0 || !q && dietaryFilter.size === 0);
  }, [categories, query, dietaryFilter, locale]);

  const needed = matches.some((cat) => cat.items.some((i) => i.allergens.length > 0));
  const availableLabels = DIETARY_LABELS.filter((l) =>
    categories.some((c) => c.items.some((i) => i.dietary.includes(l.key))),
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-4 px-5">
          <p className="truncate font-serif text-[0.9375rem] font-bold tracking-tight">
            {restaurant.name}
          </p>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/70 p-0.5">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => langFor(opt.value)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors ${
                  locale === opt.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-16">
        <section className="border-b border-border/60 pb-8">
          <p className="text-[0.6875rem] font-bold tracking-[0.25em] text-primary">
            {t.eyebrow}
          </p>
          {restaurant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="mx-auto mt-4 size-24 rounded-full border border-border/60 object-cover"
            />
          )}
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {restaurant.name}
          </h1>
          {restaurant.tagline && (
            <p className="mt-3 text-base leading-7 text-muted-foreground">{restaurant.tagline}</p>
          )}
          {restaurant.description && (
            <p className="mt-3 text-base leading-7 text-muted-foreground">{restaurant.description}</p>
          )}
          {restaurant.updatedAt && (
            <p className="mt-4 text-xs text-muted-foreground/70">
              {t.updated}{" "}
              {new Date(restaurant.updatedAt).toLocaleDateString(
                locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : "ko-KR",
                { year: "numeric", month: "short", day: "numeric" },
              )}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4 py-6">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5">
            <Search size={15} className="text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {availableLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map((l) => {
                const active = dietaryFilter.has(l.key);
                return (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => toggleDietary(l.key)}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors ${
                      active
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/70 text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {l.label[locale]}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">{t.noResults}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {matches.map((cat, idx) => (
              <section key={cat.id}>
                <h2 className="flex items-baseline gap-3 border-b border-border/60 pb-2.5">
                  <span className="font-serif text-sm font-bold tracking-widest text-primary">
                    0{idx + 1}
                  </span>
                  <span className="font-serif text-xl font-bold tracking-tight">{cat.name}</span>
                </h2>
                <ul className="flex flex-col divide-y divide-border/40">
                  {cat.items.map((item) => {
                    const name = item.translations?.[locale]?.name ?? item.name;
                    const desc = item.translations?.[locale]?.description ?? item.description;
                    return (
                      <li key={item.id} className="py-4">
                        <div className="flex items-baseline gap-3">
                          <span className={item.status === "unavailable" ? "text-muted-foreground line-through" : "font-semibold"}>
                            {name}
                          </span>
                          <span className="mx-1 flex-1 border-b border-dotted border-border/70" />
                          <span className="shrink-0 whitespace-nowrap text-base font-bold tabular-nums">
                            {formatPrice(item.price, locale)}
                          </span>
                        </div>
                        {item.priceNote && <p className="mt-0.5 text-xs text-muted-foreground">{item.priceNote}</p>}
                        {desc && <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>}
                        {(item.dietary.length > 0 || item.allergens.length > 0) && (
                          <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {item.dietary.map((k) => {
                              const label = dietaryLabel(k, locale);
                              return label ? (
                                <span key={k} className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-semibold text-primary">
                                  {label}
                                </span>
                              ) : null;
                            })}
                            {item.allergens.map((k) => {
                              const label = allergenLabel(k, locale);
                              return (
                                <span key={k} className="rounded border border-border/70 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
                                  {label ?? k}
                                </span>
                              );
                            })}
                          </p>
                        )}
                        {item.status === "unavailable" && (
                          <p className="mt-1 text-xs font-semibold text-primary">{t.unavailable}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {needed && (
          <footer className="mt-12 border-t border-border/50 pt-6">
            <p className="text-[0.6875rem] tracking-widest text-muted-foreground">※ {t.allergens}</p>
            <p className="mt-1 text-[0.75rem] leading-5 text-muted-foreground/70">
              ArigatoMenu
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}