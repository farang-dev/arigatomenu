"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Columns, LayoutList, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allergenLabel, dietaryLabel } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PrintLocale = "ja" | "en" | "zh" | "ko";

export type PrintItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  status: "available" | "unavailable";
  dietary: string[];
  allergens: string[];
};

export type PrintCategory = {
  id: string;
  name: string;
  items: PrintItem[];
};

export type PrintRestaurant = {
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
};

const LANG_OPTIONS: { value: PrintLocale; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
];

const UI: Record<
  PrintLocale,
  {
    unavailable: string;
    allergens: string;
    back: string;
    print: string;
    hint: string;
    empty: string;
    scanForDetails: string;
  }
> = {
  ja: {
    unavailable: "品切れ",
    allergens: "アレルゲン",
    back: "← 店の管理に戻る",
    print: "印刷・PDF保存",
    hint: "ブラウザの印刷画面から PDF にも保存できます",
    empty: "商品がまだ登録されていません。編集画面から追加してください。",
    scanForDetails: "スマホで写真・詳細を見る",
  },
  en: {
    unavailable: "Sold out",
    allergens: "Allergens",
    back: "← Back to store",
    print: "Print / Save as PDF",
    hint: "You can also save as PDF from the browser print dialog",
    empty: "No items yet. Add them from the editor.",
    scanForDetails: "Scan for photos & details",
  },
  zh: {
    unavailable: "已售罄",
    allergens: "过敏原",
    back: "← 返回店铺管理",
    print: "打印 / 保存为 PDF",
    hint: "也可以从浏览器打印界面保存为 PDF",
    empty: "尚未登记商品。请从编辑页面添加。",
    scanForDetails: "扫码查看图片与详情",
  },
  ko: {
    unavailable: "품절",
    allergens: "알레르기",
    back: "← 매장 관리로 돌아가기",
    print: "인쇄 / PDF 저장",
    hint: "브라우저 인쇄 화면에서 PDF로 저장할 수도 있습니다",
    empty: "아직 상품이 등록되지 않았습니다. 편집 화면から 추가하세요.",
    scanForDetails: "스마트폰으로 사진·상세 보기",
  },
};

export function PrintMenuView({
  restaurant,
  categories,
  locale,
  restaurantId,
  url,
}: {
  restaurant: PrintRestaurant;
  categories: PrintCategory[];
  locale: PrintLocale;
  restaurantId: string;
  url?: string;
}) {
  const router = useRouter();
  const t = UI[locale];
  const [paperSize, setPaperSize] = useState<"a4" | "a5">("a4");
  const [columns, setColumns] = useState<"1" | "2">("1");
  const [showQr, setShowQr] = useState<boolean>(true);
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#1B1B1B", light: "#FFFFFF" },
    })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @page print-a5 { size: A5; margin: 0; }
        .paper-a5 { page: print-a5; }
        @media print {
          body { margin: 0; background: #ffffff !important; }
        }
      `}</style>

      <div className="min-h-dvh bg-muted/70 print:min-h-0 print:bg-white text-foreground">
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md print:hidden shadow-2xs">
          <div className="mx-auto flex h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 sm:px-8">
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/restaurants/${restaurantId}`}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {t.back}
              </a>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                / {restaurant.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center gap-0.5 rounded-full border border-border/70 p-0.5 bg-background">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => router.replace(`?lang=${opt.value}`, { scroll: false })}
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors",
                      locale === opt.value
                        ? "bg-foreground text-background font-bold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Paper Size */}
              <div className="flex items-center gap-0.5 rounded-full border border-border/70 p-0.5 bg-background">
                {(["a4", "a5"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPaperSize(size)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase transition-colors",
                      paperSize === size
                        ? "bg-foreground text-background font-bold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Columns Selector (A4 only) */}
              {paperSize === "a4" && (
                <div className="flex items-center gap-0.5 rounded-full border border-border/70 p-0.5 bg-background">
                  <button
                    type="button"
                    onClick={() => setColumns("1")}
                    title="1列レイアウト"
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold flex items-center gap-1 transition-colors",
                      columns === "1"
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <LayoutList size={12} /> 1列
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumns("2")}
                    title="2列（左右分割）レイアウト"
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold flex items-center gap-1 transition-colors",
                      columns === "2"
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Columns size={12} /> 2列
                  </button>
                </div>
              )}

              {/* QR Toggle */}
              {url && (
                <button
                  type="button"
                  onClick={() => setShowQr((v) => !v)}
                  className={cn(
                    "cursor-pointer rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold flex items-center gap-1 transition-colors",
                    showQr
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/70 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <QrCode size={12} /> QR掲載
                </button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="font-bold shadow-xs"
              >
                <Printer size={13} /> {t.print}
              </Button>
            </div>
          </div>
        </div>

        {/* Paper Container */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12 print:p-0">
          <p className="mb-4 text-center text-xs text-muted-foreground print:hidden">
            {t.hint}
          </p>

          <article
            className={cn(
              "relative mx-auto bg-white px-6 py-10 text-foreground shadow-sm sm:px-10 sm:py-12 print:max-w-none print:px-[14mm] print:py-[12mm] print:shadow-none print:rounded-none",
              paperSize === "a5" && "paper-a5",
            )}
          >
            {/* Header */}
            <header className="relative text-center border-b-2 border-foreground/80 pb-6">
              {showQr && qrSvg && (
                <div className="absolute right-0 top-0 hidden sm:flex flex-col items-center gap-1 p-1 bg-white border border-border/70 rounded-xl print:flex">
                  <div
                    className="size-16 [&_svg]:size-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                  <span className="text-[0.4375rem] text-muted-foreground font-semibold">
                    {t.scanForDetails}
                  </span>
                </div>
              )}

              {restaurant.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="mx-auto size-20 rounded-full object-cover border border-border/60 mb-2"
                />
              )}
              <h1 className="font-serif text-3xl font-black tracking-tight">
                {restaurant.name}
              </h1>
              {restaurant.tagline && (
                <p className="mt-1 text-sm text-muted-foreground font-medium">
                  {restaurant.tagline}
                </p>
              )}
              {restaurant.description && (
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground max-w-lg mx-auto">
                  {restaurant.description}
                </p>
              )}
            </header>

            {/* Menu Categories */}
            {categories.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t.empty}</p>
            ) : (
              <div
                className={cn(
                  "mt-8 gap-8",
                  columns === "2" && paperSize === "a4"
                    ? "grid grid-cols-1 md:grid-cols-2 print:grid-cols-2"
                    : "flex flex-col gap-8",
                )}
              >
                {categories.map((category, idx) => (
                  <section key={category.id} className="break-inside-avoid">
                    <h2 className="flex items-baseline gap-2.5 border-b-2 border-foreground/80 pb-1.5 mb-2">
                      <span className="font-serif text-xs font-bold tracking-widest text-primary">
                        0{idx + 1}
                      </span>
                      <span className="font-serif text-lg font-black tracking-tight">
                        {category.name}
                      </span>
                    </h2>

                    {category.items.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">—</p>
                    ) : (
                      <ul className="flex flex-col divide-y divide-border/40">
                        {category.items.map((item) => (
                          <li key={item.id} className="break-inside-avoid py-2.5">
                            <div className="flex items-baseline gap-2">
                              <span
                                className={cn(
                                  "text-sm",
                                  item.status === "unavailable"
                                    ? "font-medium text-muted-foreground line-through"
                                    : "font-bold",
                                )}
                              >
                                {item.name}
                              </span>
                              <span className="mx-1 flex-1 border-b border-dotted border-foreground/30" />
                              <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums">
                                {formatPrice(item.price, locale)}
                              </span>
                            </div>

                            {item.description && (
                              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>
                            )}

                            {(item.dietary.length > 0 || item.allergens.length > 0) && (
                              <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                                {item.dietary
                                  .map((k) => dietaryLabel(k, locale))
                                  .filter(Boolean)
                                  .join("・")}
                                {item.dietary.length > 0 && item.allergens.length > 0 && " ｜ "}
                                {item.allergens.length > 0 && (
                                  <>
                                    {t.allergens}:{" "}
                                    {item.allergens
                                      .map((k) => allergenLabel(k, locale))
                                      .filter(Boolean)
                                      .join(", ")}
                                  </>
                                )}
                              </p>
                            )}

                            {item.status === "unavailable" && (
                              <p className="mt-0.5 text-[0.625rem] font-bold text-destructive">
                                {t.unavailable}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}

            {/* Print Footer */}
            <footer className="mt-12 pt-4 border-t border-border/50 flex items-center justify-between text-[0.5625rem] text-muted-foreground/60 tracking-wider uppercase">
              <span>{restaurant.name}</span>
              <span>ArigatoMenu Digital Paper Service</span>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}