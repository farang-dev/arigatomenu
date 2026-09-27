"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Filter,
  Leaf,
  MapPin,
  Moon,
  Phone,
  RotateCcw,
  Search,
  Sun,
  X,
} from "lucide-react";
import { ALLERGENS, DIETARY_LABELS, allergenLabel, dietaryLabel } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function InstagramIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export type PublicItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  status: "available" | "unavailable";
  dietary: string[];
  allergens: string[];
  imageUrl?: string;
  translations: Record<string, { name: string; description: string | null }>;
};

export type PublicCategory = {
  id: string;
  name: string;
  items: PublicItem[];
};

type Locale = "ja" | "en" | "zh" | "ko";

const LANG_OPTIONS: { value: Locale; label: string; short: string }[] = [
  { value: "ja", label: "日本語", short: "JP" },
  { value: "en", label: "English", short: "EN" },
  { value: "zh", label: "中文", short: "ZH" },
  { value: "ko", label: "한국어", short: "KO" },
];

const UI_COPY: Record<
  Locale,
  {
    search: string;
    searchPlaceholder: string;
    allergens: string;
    unavailable: string;
    updated: string;
    categoriesTitle: string;
    viewCategory: string;
    backToStore: string;
    allCategories: string;
    noResults: string;
    dietaryFilterTitle: string;
    dietaryQuickLabel: string;
    allergenFilterTitle: string;
    excludeAllergensBtn: string;
    clearFilters: string;
    applyFilters: string;
    filterDrawerTitle: string;
    itemCount: (count: number) => string;
    categoryItemsCount: (count: number) => string;
    close: string;
    allergenWarningTitle: string;
    themeToggleLight: string;
    themeToggleDark: string;
    allTab: string;
    totalCategories: (catCount: number, itemCount: number) => string;
  }
> = {
  ja: {
    search: "検索",
    searchPlaceholder: "メニュー名・キーワードで検索…",
    allergens: "アレルゲン28品目表示",
    unavailable: "品切れ",
    updated: "更新",
    categoriesTitle: "メニューカテゴリー",
    viewCategory: "メニューを見る",
    backToStore: "トップに戻る",
    allCategories: "すべてのカテゴリー",
    noResults: "該当するメニューが見つかりませんでした",
    dietaryFilterTitle: "こだわり条件",
    dietaryQuickLabel: "こだわり条件",
    allergenFilterTitle: "除外するアレルゲン（28品目対応）",
    excludeAllergensBtn: "フィルター",
    clearFilters: "条件をクリア",
    applyFilters: "この条件で表示",
    filterDrawerTitle: "メニュー絞り込み・アレルギー除外",
    itemCount: (count) => `${count} 件`,
    categoryItemsCount: (count) => `${count}品`,
    close: "閉じる",
    allergenWarningTitle: "アレルゲン情報",
    themeToggleLight: "ライトモード",
    themeToggleDark: "ダークモード",
    allTab: "すべて",
    totalCategories: (c, i) => `${c} カテゴリー ・ 全${i}品`,
  },
  en: {
    search: "Search",
    searchPlaceholder: "Search dishes or ingredients…",
    allergens: "28 allergens labeled",
    unavailable: "Sold out",
    updated: "Updated",
    categoriesTitle: "Menu Categories",
    viewCategory: "View Menu",
    backToStore: "Back to Home",
    allCategories: "All Categories",
    noResults: "No menu items found",
    dietaryFilterTitle: "Dietary Options",
    dietaryQuickLabel: "Dietary",
    allergenFilterTitle: "Exclude Allergens (28 items)",
    excludeAllergensBtn: "Filter",
    clearFilters: "Clear all",
    applyFilters: "Apply Filters",
    filterDrawerTitle: "Filter Menu & Exclude Allergens",
    itemCount: (count) => `${count} items`,
    categoryItemsCount: (count) => `${count} items`,
    close: "Close",
    allergenWarningTitle: "Allergen Information",
    themeToggleLight: "Light mode",
    themeToggleDark: "Dark mode",
    allTab: "All",
    totalCategories: (c, i) => `${c} categories · ${i} items`,
  },
  zh: {
    search: "搜索",
    searchPlaceholder: "搜索菜品或食材…",
    allergens: "标注28种常见过敏原",
    unavailable: "已售罄",
    updated: "更新于",
    categoriesTitle: "菜单分类",
    viewCategory: "查看菜单",
    backToStore: "返回主页",
    allCategories: "全部分类",
    noResults: "未找到相关菜品",
    dietaryFilterTitle: "饮食偏好",
    dietaryQuickLabel: "饮食偏好",
    allergenFilterTitle: "排除过敏原（支持28种）",
    excludeAllergensBtn: "筛选",
    clearFilters: "清空筛选",
    applyFilters: "确认筛选",
    filterDrawerTitle: "菜单筛选与过敏原排除",
    itemCount: (count) => `共 ${count} 道`,
    categoryItemsCount: (count) => `${count}道`,
    close: "关闭",
    allergenWarningTitle: "过敏原提示",
    themeToggleLight: "亮色模式",
    themeToggleDark: "暗色模式",
    allTab: "全部",
    totalCategories: (c, i) => `${c} 个分类 · 共${i}道`,
  },
  ko: {
    search: "검색",
    searchPlaceholder: "메뉴명 또는 키워드 검색…",
    allergens: "알레르기 28종 표기",
    unavailable: "품절",
    updated: "업데이트",
    categoriesTitle: "메뉴 카테고리",
    viewCategory: "메뉴 보기",
    backToStore: "홈으로 돌아가기",
    allCategories: "전체 카테고리",
    noResults: "해당하는 메뉴가 없습니다",
    dietaryFilterTitle: "식단 선호",
    dietaryQuickLabel: "식단",
    allergenFilterTitle: "제외할 알레르기（28종 대응）",
    excludeAllergensBtn: "필터",
    clearFilters: "필터 초기화",
    applyFilters: "필터 적용",
    filterDrawerTitle: "메뉴 필터 및 알레르기 제외",
    itemCount: (count) => `${count}개`,
    categoryItemsCount: (count) => `${count}개`,
    close: "닫기",
    allergenWarningTitle: "알레르기 정보",
    themeToggleLight: "라이트 모드",
    themeToggleDark: "다크 모드",
    allTab: "전체",
    totalCategories: (c, i) => `${c} 카테고리 · 총 ${i}개`,
  },
};

const THEME_EVENT = "arigatomenu:theme-change";
const noopSubscribe = () => () => {};

/** True only after hydration — avoids icon-swap hydration mismatches. */
function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Reads the theme straight from the <html> class, which a pre-paint inline script
 * has already applied, so there is no flash and no duplicated state.
 */
function useTheme(slug: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(THEME_EVENT, onStoreChange);
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", onStoreChange);
    return () => {
      window.removeEventListener(THEME_EVENT, onStoreChange);
      query.removeEventListener("change", onStoreChange);
    };
  }, []);

  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggleTheme = useCallback(() => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
    try {
      localStorage.setItem(`arigatomenu_theme_${slug}`, nextDark ? "dark" : "light");
    } catch {
      /* private mode — the toggle still works for this visit */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [slug]);

  return { isDark, toggleTheme };
}

export function MenuView({
  restaurant,
  categories,
  locale,
}: {
  restaurant: {
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    updatedAt: string | null;
    logoUrl: string | null;
    coverUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    instagram?: string | null;
    defaultTheme?: string;
  };
  categories: PublicCategory[];
  locale: Locale;
}) {
  const router = useRouter();
  const t = UI_COPY[locale];

  const { isDark, toggleTheme } = useTheme(restaurant.slug);
  const isHydrated = useIsHydrated();

  // Category & Filter states
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<Set<string>>(new Set());
  const [allergenExclusions, setAllergenExclusions] = useState<Set<string>>(new Set());
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  const langFor = (l: Locale) => router.replace(`?lang=${l}`, { scroll: false });

  const toggleDietary = (key: string) =>
    setDietaryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAllergenExclusion = (key: string) =>
    setAllergenExclusions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const clearAllFilters = () => {
    setQuery("");
    setDietaryFilter(new Set());
    setAllergenExclusions(new Set());
  };

  const hasActiveFilters =
    query.trim().length > 0 || dietaryFilter.size > 0 || allergenExclusions.size > 0;

  const activeFiltersCount =
    (dietaryFilter.size > 0 ? dietaryFilter.size : 0) +
    (allergenExclusions.size > 0 ? allergenExclusions.size : 0);

  // Filtered categories and items
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterText = (item: PublicItem) => {
      if (!q) return true;
      const name = (item.translations?.[locale]?.name ?? item.name).toLowerCase();
      const desc = (item.translations?.[locale]?.description ?? item.description).toLowerCase();
      return name.includes(q) || desc.includes(q);
    };

    const filterDietary = (item: PublicItem) => {
      for (const k of dietaryFilter) {
        if (!item.dietary.includes(k)) return false;
      }
      return true;
    };

    const filterAllergens = (item: PublicItem) => {
      for (const k of allergenExclusions) {
        if (item.allergens.includes(k)) return false;
      }
      return true;
    };

    return categories
      .filter((cat) => (activeCategoryId ? cat.id === activeCategoryId : true))
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => filterText(i) && filterDietary(i) && filterAllergens(i)),
      }))
      .filter((cat) => cat.items.length > 0 || (!hasActiveFilters && !activeCategoryId));
  }, [categories, query, dietaryFilter, allergenExclusions, activeCategoryId, locale, hasActiveFilters]);

  const totalMatchingItems = useMemo(() => {
    return matches.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [matches]);

  const totalStoreItems = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [categories]);

  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null;
    return categories.find((c) => c.id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  const availableAllergens = ALLERGENS.filter((a) =>
    categories.some((c) => c.items.some((i) => i.allergens.includes(a.key))),
  );

  // Dietary tags that actually appear on this menu, with their item counts.
  // Ordered as in DIETARY_LABELS, so vegan/vegetarian/halal come first.
  const dietaryQuickLinks = useMemo(
    () =>
      DIETARY_LABELS.map((d) => ({
        key: d.key,
        label: d.label[locale],
        count: categories.reduce(
          (acc, cat) => acc + cat.items.filter((i) => i.dietary.includes(d.key)).length,
          0,
        ),
      })).filter((d) => d.count > 0),
    [categories, locale],
  );

  const applyDietaryQuick = (key: string) => {
    setActiveCategoryId(null);
    setQuery("");
    setAllergenExclusions(new Set());
    setDietaryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const neededFootnote = categories.some((cat) => cat.items.some((i) => i.allergens.length > 0));

  // Is viewing storefront home
  const isStoreFront = activeCategoryId === null && !hasActiveFilters;

  return (
    <div
      className={cn(
        "min-h-dvh transition-colors duration-300 font-sans bg-stone-50/70 text-stone-900",
        "dark:bg-neutral-950 dark:text-neutral-100",
      )}
    >
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md dark:bg-neutral-950/95 dark:border-neutral-800">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand / Navigation Header */}
          <div className="flex items-center gap-2.5 min-w-0">
            {activeCategoryId !== null ? (
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className="cursor-pointer flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all"
              >
                <ArrowLeft size={14} />
                <span>{t.allTab}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setActiveCategoryId(null);
                clearAllFilters();
              }}
              className="cursor-pointer truncate font-serif text-base sm:text-lg font-bold tracking-tight text-left hover:text-primary transition-colors"
            >
              {restaurant.name}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((v) => !v)}
              title={t.search}
              className={cn(
                "cursor-pointer flex size-8 items-center justify-center rounded-full border transition-all",
                isSearchOpen || query
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                  : "border-border/70 bg-card text-foreground hover:bg-muted dark:border-neutral-800 dark:bg-neutral-900",
              )}
            >
              <Search size={14} />
            </button>

            {/* Filter Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              title={t.filterDrawerTitle}
              className={cn(
                "cursor-pointer relative flex size-8 items-center justify-center rounded-full border transition-all",
                activeFiltersCount > 0
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                  : "border-border/70 bg-card text-foreground hover:bg-muted dark:border-neutral-800 dark:bg-neutral-900",
              )}
            >
              <Filter size={14} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.5625rem] font-bold text-white shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? t.themeToggleLight : t.themeToggleDark}
              aria-label={isDark ? t.themeToggleLight : t.themeToggleDark}
              aria-pressed={isDark}
              className="cursor-pointer flex size-8 items-center justify-center rounded-full border border-border/70 bg-card text-foreground hover:bg-muted dark:border-neutral-800 dark:bg-neutral-900 transition-all"
            >
              {isHydrated && isDark ? (
                <Sun size={14} className="text-amber-400" />
              ) : (
                <Moon size={14} className="text-neutral-700 dark:text-neutral-300" />
              )}
            </button>

            {/* Clean Language Selector */}
            <div className="flex shrink-0 items-center rounded-full border border-border/70 p-0.5 bg-card dark:border-neutral-800 dark:bg-neutral-900">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => langFor(opt.value)}
                  title={opt.label}
                  className={cn(
                    "cursor-pointer rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold transition-all",
                    locale === opt.value
                      ? "bg-foreground text-background dark:bg-neutral-100 dark:text-neutral-900 font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Nav — dietary tags first, then categories, in one scrollable row */}
        <div className="border-t border-border/50 dark:border-neutral-800 bg-background dark:bg-neutral-950 px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="mx-auto flex max-w-2xl items-center gap-2.5 min-w-max">
            {activeCategoryId === null && dietaryQuickLinks.length > 0 && (
              <>
                <span className="flex items-center gap-1.5 pr-1 text-sm font-bold text-muted-foreground">
                  <Leaf size={15} className="text-primary" />
                  {t.dietaryQuickLabel}
                </span>

                {dietaryQuickLinks.map((d) => {
                  const isActive = dietaryFilter.has(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => applyDietaryQuick(d.key)}
                      title={`${d.label} — ${d.count}`}
                      className={cn(
                        "cursor-pointer flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "border border-border/70 bg-card text-foreground hover:bg-muted dark:border-neutral-800 dark:bg-neutral-900",
                      )}
                    >
                      <span>{d.label}</span>
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-0.5 tabular-nums",
                          isActive
                            ? "bg-black/20 text-white font-bold"
                            : "bg-muted dark:bg-neutral-800 text-muted-foreground",
                        )}
                      >
                        {d.count}
                      </span>
                    </button>
                  );
                })}

                <span
                  aria-hidden
                  className="h-5 w-px shrink-0 bg-border dark:bg-neutral-700"
                />
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveCategoryId(null);
                clearAllFilters();
              }}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all",
                activeCategoryId === null && !hasActiveFilters
                  ? "bg-foreground text-background dark:bg-neutral-100 dark:text-neutral-900 font-bold"
                  : "border border-border/70 bg-card text-muted-foreground hover:text-foreground dark:border-neutral-800 dark:bg-neutral-900",
              )}
            >
              {t.allTab}
            </button>

            {categories.map((cat) => {
              const isSelected = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border border-border/70 bg-card text-foreground hover:bg-muted dark:border-neutral-800 dark:bg-neutral-900",
                  )}
                >
                  <span>{cat.name}</span>
                  <span
                    className={cn(
                      "text-xs rounded-full px-2 py-0.5 tabular-nums",
                      isSelected
                        ? "bg-black/20 text-white font-bold"
                        : "bg-muted dark:bg-neutral-800 text-muted-foreground",
                    )}
                  >
                    {cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {isSearchOpen && (
          <div className="border-t border-border/50 dark:border-neutral-800 px-4 py-2.5 bg-card dark:bg-neutral-900 animate-in slide-in-from-top-2 duration-200">
            <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-border/70 bg-background dark:border-neutral-800 px-3.5 py-2 shadow-2xs">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="cursor-pointer text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="border-t border-border/60 bg-muted/40 dark:bg-neutral-900/40 px-4 py-2 flex items-center justify-between gap-2">
            <div className="mx-auto flex max-w-2xl w-full items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground font-medium">
                <span className="font-bold">{t.itemCount(totalMatchingItems)}</span>
                {dietaryFilter.size > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 text-[0.6875rem] font-semibold">
                    {Array.from(dietaryFilter)
                      .map((k) => dietaryLabel(k, locale))
                      .join(", ")}
                  </span>
                )}
                {allergenExclusions.size > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-[0.6875rem] font-semibold">
                    {allergenExclusions.size}品目除外中
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline font-semibold shrink-0"
              >
                <RotateCcw size={12} />
                <span>{t.clearFilters}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 pb-24">
        {/* ======================================================== */}
        {/* 1. STORE FRONT VIEW */}
        {/* ======================================================== */}
        {isStoreFront && (
          <div className="flex flex-col gap-8 animate-in fade-in-50 duration-300">
            {/* Storefront Hero Card */}
            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
              {/* Optional Store Cover Photo Banner */}
              {restaurant.coverUrl ? (
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-muted dark:bg-neutral-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.coverUrl}
                    alt={restaurant.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Logo overlay on cover */}
                  {restaurant.logoUrl && (
                    <div className="absolute bottom-4 left-6 flex items-end gap-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="size-16 sm:size-20 rounded-2xl border-2 border-white dark:border-neutral-800 object-cover shadow-lg bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Store Details Body */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {!restaurant.coverUrl && restaurant.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="size-16 sm:size-20 rounded-2xl border border-border/80 dark:border-neutral-700 object-cover shadow-sm mb-3 bg-white"
                      />
                    )}
                    <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-neutral-100">
                      {restaurant.name}
                    </h1>
                    {restaurant.tagline && (
                      <p className="mt-1.5 text-sm sm:text-base font-medium text-muted-foreground dark:text-neutral-300">
                        {restaurant.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-neutral-400">
                    {restaurant.description}
                  </p>
                )}

                {/* Store Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 dark:border-neutral-800 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-neutral-800 px-2.5 py-1">
                    {t.totalCategories(categories.length, totalStoreItems)}
                  </span>

                  {restaurant.address && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-neutral-800 px-2.5 py-1">
                      <MapPin size={12} className="text-primary" />
                      <span className="truncate max-w-[220px]">{restaurant.address}</span>
                    </span>
                  )}

                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-neutral-800 px-2.5 py-1 hover:text-foreground"
                    >
                      <Phone size={12} className="text-primary" />
                      <span>{restaurant.phone}</span>
                    </a>
                  )}

                  {restaurant.instagram && (
                    <a
                      href={restaurant.instagram.startsWith("http") ? restaurant.instagram : `https://instagram.com/${restaurant.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-neutral-800 px-2.5 py-1 hover:text-foreground"
                    >
                      <InstagramIcon size={12} className="text-primary" />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Category Cards Section */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-border/60 dark:border-neutral-800 pb-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-neutral-100">
                  {t.categoriesTitle}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {categories.length} カテゴリー
                </span>
              </div>

              {/* Category Cards Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                {categories.map((cat) => {
                  const itemImages = cat.items
                    .map((i) => i.imageUrl)
                    .filter((url): url is string => Boolean(url));
                  const coverImage = itemImages[0];

                  const prices = cat.items.map((i) => i.price).filter((p) => p > 0);
                  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className="group cursor-pointer relative overflow-hidden rounded-3xl border border-border/80 bg-card dark:border-neutral-800 dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-primary/60 dark:hover:border-primary/60 transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] flex flex-col justify-between"
                    >
                      {/* Category Image Container */}
                      {coverImage ? (
                        <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-muted dark:bg-neutral-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverImage}
                            alt={cat.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                          {/* Category Title Overlay on Image */}
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight drop-shadow-sm">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-white/80 mt-1 font-medium">
                              {t.categoryItemsCount(cat.items.length)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Image-less categories stay compact instead of reserving tall empty space */
                        <div className="px-4 pt-4">
                          <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-foreground dark:text-neutral-100 truncate">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {t.categoryItemsCount(cat.items.length)}
                          </p>
                        </div>
                      )}

                      {/* Card Bottom Meta */}
                      <div className="p-4 space-y-2.5">
                        {cat.items.length > 0 && (
                          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                            {cat.items.map((i) => i.translations?.[locale]?.name || i.name).join(" / ")}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-neutral-800 text-xs">
                          {minPrice !== null && (
                            <span className="font-bold tabular-nums text-foreground dark:text-neutral-200">
                              {minPrice === maxPrice
                                ? formatPrice(minPrice, locale)
                                : `${formatPrice(minPrice, locale)} 〜`}
                            </span>
                          )}

                          <div className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform ml-auto">
                            <span>{t.viewCategory}</span>
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. CATEGORY ITEMS LIST VIEW */}
        {/* ======================================================== */}
        {!isStoreFront && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Category Header */}
            <div className="flex items-baseline justify-between gap-2 border-b-2 border-foreground dark:border-neutral-200 pb-3">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(null);
                    clearAllFilters();
                  }}
                  className="cursor-pointer text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-1.5"
                >
                  <ArrowLeft size={12} /> {t.allCategories}
                </button>
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-neutral-100">
                  {activeCategory ? activeCategory.name : t.allCategories}
                </h2>
              </div>
              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                {t.itemCount(totalMatchingItems)}
              </span>
            </div>

            {/* Empty state */}
            {matches.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-card dark:border-neutral-800 dark:bg-neutral-900/50 py-16 text-center my-6">
                <p className="text-sm text-muted-foreground dark:text-neutral-400 font-medium">
                  {t.noResults}
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <RotateCcw size={12} /> {t.clearFilters}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {matches.map((cat) => (
                  <section key={cat.id} className="space-y-3">
                    {/* Category Title when searching multiple categories */}
                    {!activeCategoryId && (
                      <h3 className="border-b border-border/60 dark:border-neutral-800 pb-1.5 font-serif text-base font-bold text-foreground dark:text-neutral-200">
                        {cat.name}
                      </h3>
                    )}

                    <ul className="flex flex-col divide-y divide-border/40 dark:divide-neutral-800/60">
                      {cat.items.map((item) => {
                        const name = item.translations?.[locale]?.name ?? item.name;
                        const desc = item.translations?.[locale]?.description ?? item.description;
                        const isUnavailable = item.status === "unavailable";

                        return (
                          <li
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative py-4 transition-all duration-200 hover:bg-muted/40 dark:hover:bg-neutral-900/60 -mx-2.5 px-2.5 rounded-2xl cursor-pointer"
                          >
                            <div className="flex items-start gap-3 sm:gap-4">
                              {/* Left details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4
                                    className={cn(
                                      "font-bold text-sm sm:text-base tracking-tight text-foreground dark:text-neutral-100",
                                      isUnavailable && "line-through text-muted-foreground opacity-60",
                                    )}
                                  >
                                    {name}
                                  </h4>
                                  <span className="shrink-0 font-bold tabular-nums text-sm sm:text-base text-foreground dark:text-neutral-100">
                                    {formatPrice(item.price, locale)}
                                  </span>
                                </div>

                                {item.priceNote && (
                                  <p className="text-[0.6875rem] text-muted-foreground dark:text-neutral-400 mt-0.5">
                                    {item.priceNote}
                                  </p>
                                )}

                                {desc && (
                                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-neutral-400 line-clamp-2">
                                    {desc}
                                  </p>
                                )}

                                {/* Dietary & Allergen Badges */}
                                {(item.dietary.length > 0 || item.allergens.length > 0) && (
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {item.dietary.map((k) => {
                                      const label = dietaryLabel(k, locale);
                                      return label ? (
                                        <span
                                          key={k}
                                          className="rounded-full bg-primary/10 dark:bg-primary/20 px-2 py-0.5 text-[0.625rem] font-bold text-primary"
                                        >
                                          {label}
                                        </span>
                                      ) : null;
                                    })}

                                    {item.allergens.map((k) => {
                                      const label = allergenLabel(k, locale);
                                      return (
                                        <span
                                          key={k}
                                          className="rounded-md border border-border/70 dark:border-neutral-800 bg-background dark:bg-neutral-900 px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground dark:text-neutral-400"
                                        >
                                          {label ?? k}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {isUnavailable && (
                                  <p className="mt-1.5 text-xs font-bold text-destructive">
                                    {t.unavailable}
                                  </p>
                                )}
                              </div>

                              {/* Right thumbnail image */}
                              {item.imageUrl && (
                                <div className="relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted dark:border-neutral-800 dark:bg-neutral-900 size-20 sm:size-24 shadow-2xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.imageUrl}
                                    alt={name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {/* Back to top button */}
            <div className="pt-8 border-t border-border/50 dark:border-neutral-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryId(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card dark:border-neutral-800 dark:bg-neutral-900 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                <ArrowLeft size={14} />
                <span>{t.backToStore}</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Allergen Footnote */}
        {neededFootnote && (
          <footer className="mt-12 border-t border-border/60 dark:border-neutral-800 pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground dark:text-neutral-400">
              ※ {t.allergens}
            </p>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground/70 dark:text-neutral-500">
              ArigatoMenu • Powered by Digital Menu Service
            </p>
          </footer>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. FILTER & ALLERGEN EXCLUSION DRAWER */}
      {/* ======================================================== */}
      {isFilterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-background dark:bg-neutral-900 border border-border/80 dark:border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 max-h-[85dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/50 dark:border-neutral-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                <h3 className="font-bold text-base text-foreground dark:text-neutral-100">
                  {t.filterDrawerTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="cursor-pointer flex size-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="overflow-y-auto p-5 space-y-6">
              {/* Dietary Preferences Filter */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground dark:text-neutral-200">
                  {t.dietaryFilterTitle}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_LABELS.map((l) => {
                    const active = dietaryFilter.has(l.key);
                    const itemCount = categories.reduce(
                      (acc, c) => acc + c.items.filter((i) => i.dietary.includes(l.key)).length,
                      0,
                    );

                    return (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => toggleDietary(l.key)}
                        className={cn(
                          "cursor-pointer flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border/70 bg-card text-muted-foreground hover:border-foreground/40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300",
                        )}
                      >
                        <span>{l.label[locale]}</span>
                        {itemCount > 0 && (
                          <span
                            className={cn(
                              "ml-0.5 rounded-full px-1.5 py-0.2 text-[0.625rem]",
                              active
                                ? "bg-white/20 text-white"
                                : "bg-muted dark:bg-neutral-800 text-muted-foreground",
                            )}
                          >
                            {itemCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergen Exclusion Section */}
              <div className="space-y-2.5 pt-4 border-t border-border/50 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground dark:text-neutral-200 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-destructive" />
                    <span>{t.allergenFilterTitle}</span>
                  </p>
                  {allergenExclusions.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setAllergenExclusions(new Set())}
                      className="cursor-pointer text-[0.6875rem] font-bold text-muted-foreground hover:text-foreground"
                    >
                      {t.clearFilters}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableAllergens.map((a) => {
                    const excluded = allergenExclusions.has(a.key);
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => toggleAllergenExclusion(a.key)}
                        className={cn(
                          "cursor-pointer flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-xs text-left transition-colors",
                          excluded
                            ? "border-destructive bg-destructive/10 font-bold text-destructive"
                            : "border-border/60 bg-background hover:bg-muted text-muted-foreground dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400",
                        )}
                      >
                        <span className="truncate">{a.label[locale]}</span>
                        {excluded && <Check size={13} className="text-destructive shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-border/50 dark:border-neutral-800 bg-card dark:bg-neutral-900 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground underline"
              >
                {t.clearFilters}
              </button>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="cursor-pointer flex-1 rounded-2xl bg-primary text-primary-foreground font-bold py-2.5 text-xs text-center shadow-xs hover:bg-primary/90 transition-all"
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ITEM LIGHTBOX DETAIL MODAL */}
      {/* ======================================================== */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-background dark:bg-neutral-900 border border-border/80 dark:border-neutral-800 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="cursor-pointer absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-xs"
            >
              <X size={18} />
            </button>

            {/* Modal Image */}
            {selectedItem.imageUrl && (
              <div className="relative h-64 sm:h-72 w-full bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="size-full object-cover"
                />
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-border/50 dark:border-neutral-800 pb-3">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground dark:text-neutral-100">
                    {selectedItem.translations?.[locale]?.name ?? selectedItem.name}
                  </h3>
                  {selectedItem.priceNote && (
                    <p className="text-xs text-muted-foreground dark:text-neutral-400 mt-0.5">
                      {selectedItem.priceNote}
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold tabular-nums text-foreground dark:text-neutral-100 shrink-0">
                  {formatPrice(selectedItem.price, locale)}
                </span>
              </div>

              {(selectedItem.translations?.[locale]?.description ?? selectedItem.description) && (
                <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                  {selectedItem.translations?.[locale]?.description ?? selectedItem.description}
                </p>
              )}

              {/* Dietary Tags */}
              {selectedItem.dietary.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-foreground dark:text-neutral-300">
                    {t.dietaryFilterTitle}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.dietary.map((k) => {
                      const label = dietaryLabel(k, locale);
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-xs font-bold text-primary"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Allergens Tags */}
              {selectedItem.allergens.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40 dark:border-neutral-800">
                  <p className="text-xs font-bold text-foreground dark:text-neutral-300 flex items-center gap-1">
                    <AlertCircle size={14} className="text-destructive" />
                    <span>{t.allergenWarningTitle}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.allergens.map((k) => {
                      const label = allergenLabel(k, locale);
                      return (
                        <span
                          key={k}
                          className="rounded-lg border border-border/80 bg-muted/60 dark:border-neutral-800 dark:bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-foreground dark:text-neutral-300"
                        >
                          {label ?? k}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.status === "unavailable" && (
                <div className="rounded-2xl bg-destructive/10 p-3 text-xs font-bold text-destructive text-center">
                  {t.unavailable}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}