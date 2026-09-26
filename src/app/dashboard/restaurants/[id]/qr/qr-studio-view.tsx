"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Grid,
  Info,
  Layers,
  Palette,
  Printer,
  QrCode,
  RotateCcw,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QrErrorCorrection } from "@/app/dashboard/actions";

export type QrStudioRestaurant = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  slug: string;
  logoUrl: string | null;
  isPublished: boolean;
  initialDark: string;
  initialLight: string;
  initialEc: string;
  url: string;
};

type TemplateType = "stand-portrait" | "stand-tent" | "sticker-sheet" | "mini-card" | "single-export";
type PaperSize = "a4" | "a5" | "postcard";
type StickerGrid = "6" | "8" | "12";
type StickerStyle = "badge" | "circle" | "compact";

const DARK_COLOR_PRESETS = [
  { value: "#1B1B1B", label: "ジェットブラック", color: "#1B1B1B" },
  { value: "#FF5406", label: "エンバーオレンジ", color: "#FF5406" },
  { value: "#00B33F", label: "フォレストグリーン", color: "#00B33F" },
  { value: "#1E3A5F", label: "ディープネイビー", color: "#1E3A5F" },
  { value: "#4A2C17", label: "エスプレッソ", color: "#4A2C17" },
  { value: "#8B1E3F", label: "ボルドー", color: "#8B1E3F" },
];

const LIGHT_COLOR_PRESETS = [
  { value: "#FFFFFF", label: "ホワイト", color: "#FFFFFF" },
  { value: "#FFF8F0", label: "アイボリー", color: "#FFF8F0" },
  { value: "#FFF1EA", label: "エンバーティント", color: "#FFF1EA" },
  { value: "#F5F5F5", label: "ライトフォグ", color: "#F5F5F5" },
];

const HEADLINE_PRESETS = [
  "スマホでメニューを見る",
  "スマートフォンで簡単注文・閲覧",
  "多言語メニューはこちら",
  "写真つきメニューを見る",
  "Order & View Menu",
];

const SUBHEAD_PRESETS = [
  "写真・アレルギー情報・多言語対応",
  "カメラをかざすだけでアプリ不要で開きます",
  "英語・中国語・韓国語に対応しています",
  "Scan with your smartphone camera",
];

export function QrStudioView({ restaurant }: { restaurant: QrStudioRestaurant }) {
  // Studio State
  const [template, setTemplate] = useState<TemplateType>("stand-portrait");
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [stickerGrid, setStickerGrid] = useState<StickerGrid>("8");
  const [stickerStyle, setStickerStyle] = useState<StickerStyle>("badge");

  // QR Customization
  const [dark, setDark] = useState(restaurant.initialDark);
  const [light, setLight] = useState(restaurant.initialLight);
  const [ec, setEc] = useState<QrErrorCorrection>(
    (restaurant.initialEc as QrErrorCorrection) || "Q",
  );

  // Content Customization
  const [headline, setHeadline] = useState("スマホでメニューを見る");
  const [subhead, setSubhead] = useState("写真・アレルギー情報・多言語対応");
  const [showLogo, setShowLogo] = useState(true);
  const [showMultilingual, setShowMultilingual] = useState(true);
  const [showWifi, setShowWifi] = useState(false);
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [showCutLines, setShowCutLines] = useState(true);

  // Single QR assets
  const [singleSvg, setSingleSvg] = useState<string>("");
  const [singlePngUrl, setSinglePngUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Pre-generate QR SVG for the restaurant URL
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(restaurant.url, {
      type: "svg",
      errorCorrectionLevel: ec,
      margin: 1,
      color: { dark, light },
    })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch((e) => {
        console.error("QR SVG generation error", e);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant.url, dark, light, ec]);

  // Generate Single QR SVG and High-Res PNG
  useEffect(() => {
    let cancelled = false;
    QRCode.toString(restaurant.url, {
      type: "svg",
      errorCorrectionLevel: ec,
      margin: 2,
      color: { dark, light },
    })
      .then((svg) => {
        if (!cancelled) setSingleSvg(svg);
      })
      .catch(() => {});

    QRCode.toDataURL(restaurant.url, {
      errorCorrectionLevel: ec,
      margin: 2,
      width: 2400,
      color: { dark, light },
    })
      .then((png) => {
        if (!cancelled) setSinglePngUrl(png);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [restaurant.url, dark, light, ec]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(restaurant.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPageClass = () => {
    if (template === "stand-tent") return "page-a4-landscape";
    if (paperSize === "a5") return "page-a5-portrait";
    if (paperSize === "postcard") return "page-postcard-portrait";
    return "page-a4-portrait";
  };

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @page print-a4-landscape {
          size: A4 landscape;
          margin: 0;
        }
        @page print-a5 {
          size: A5 portrait;
          margin: 0;
        }
        @page print-postcard {
          size: 100mm 148mm;
          margin: 0;
        }
        .page-a4-portrait {
          width: 210mm;
          min-height: 297mm;
        }
        .page-a4-landscape {
          width: 297mm;
          min-height: 210mm;
          page: print-a4-landscape;
        }
        .page-a5-portrait {
          width: 148mm;
          min-height: 210mm;
          page: print-a5;
        }
        .page-postcard-portrait {
          width: 100mm;
          min-height: 148mm;
          page: print-postcard;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      <div className="min-h-dvh bg-muted/60 text-foreground pb-20 print:p-0 print:bg-white print:min-h-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md no-print">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/restaurants/${restaurant.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={14} /> 店舗管理に戻る
              </Link>
              <span className="text-border">/</span>
              <span className="text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-none">
                {restaurant.name}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-bold text-primary">
                <Sparkles size={11} /> 印刷・ステッカー スタジオ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="hidden sm:inline-flex text-xs"
              >
                {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                {copied ? "URLコピー済み" : "URLをコピー"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="font-bold shadow-sm"
              >
                <Printer size={14} /> 印刷・PDF保存
              </Button>
            </div>
          </div>
        </header>

        {/* Main Studio Grid */}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
            {/* Left Controls Panel */}
            <aside className="no-print flex flex-col gap-6">
              {/* Template Selector Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-serif text-sm font-bold tracking-tight">
                    <Layers size={16} className="text-primary" /> テンプレート選択
                  </h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate("stand-portrait")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      template === "stand-portrait"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <FileText size={18} />
                    <span className="text-xs">卓上POPスタンド</span>
                    <span className="text-[0.625rem] text-muted-foreground font-normal">
                      アクリルスタンド・縦型
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate("stand-tent")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      template === "stand-tent"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <RotateCcw size={18} />
                    <span className="text-xs">三角折りPOP</span>
                    <span className="text-[0.625rem] text-muted-foreground font-normal">
                      A4横・2面両面自立
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate("sticker-sheet")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      template === "sticker-sheet"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <Grid size={18} />
                    <span className="text-xs">ステッカーシート</span>
                    <span className="text-[0.625rem] text-muted-foreground font-normal">
                      A4面付け（6/8/12面）
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate("mini-card")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      template === "mini-card"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <QrCode size={18} />
                    <span className="text-xs">伝票ミニカード</span>
                    <span className="text-[0.625rem] text-muted-foreground font-normal">
                      名刺サイズ・10面付け
                    </span>
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setTemplate("single-export")}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition-all",
                      template === "single-export"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Download size={15} />
                      <span className="text-xs">単体QR素材ダウンロード (PNG / SVG)</span>
                    </div>
                    <span className="text-[0.6875rem] text-muted-foreground font-normal">
                      ベクター入稿用
                    </span>
                  </button>
                </div>
              </div>

              {/* Template-specific Settings */}
              {template !== "single-export" && (
                <>
                  {/* Paper Size & Grid Configuration */}
                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                    <h2 className="flex items-center gap-2 font-serif text-sm font-bold tracking-tight">
                      <Printer size={16} className="text-primary" /> 用紙・レイアウト設定
                    </h2>

                    {template === "stand-portrait" && (
                      <div className="mt-4 space-y-3">
                        <label className="text-xs font-semibold text-foreground">
                          用紙サイズ
                        </label>
                        <div className="flex rounded-xl border border-border/80 p-1 bg-muted/30">
                          {(["a4", "a5", "postcard"] as const).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setPaperSize(size)}
                              className={cn(
                                "flex-1 rounded-lg py-1.5 text-xs font-bold uppercase transition-all",
                                paperSize === size
                                  ? "bg-background text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {size === "postcard" ? "はがき/A6" : size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {template === "sticker-sheet" && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-foreground">
                            1シートあたりの枚数（A4面付け）
                          </label>
                          <div className="mt-1.5 grid grid-cols-3 gap-2">
                            {[
                              { value: "6", label: "6面 (大)", desc: "85×85mm" },
                              { value: "8", label: "8面 (標準)", desc: "70×70mm" },
                              { value: "12", label: "12面 (小)", desc: "60×60mm" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStickerGrid(opt.value as StickerGrid)}
                                className={cn(
                                  "rounded-xl border p-2 text-center transition-all",
                                  stickerGrid === opt.value
                                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                                    : "border-border/70 text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <div className="text-xs">{opt.label}</div>
                                <div className="text-[0.625rem] opacity-75">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-foreground">
                            ステッカー形状スタイル
                          </label>
                          <div className="mt-1.5 grid grid-cols-3 gap-2">
                            {[
                              { value: "badge", label: "角丸バッジ" },
                              { value: "circle", label: "サークル" },
                              { value: "compact", label: "ミニマル" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStickerStyle(opt.value as StickerStyle)}
                                className={cn(
                                  "rounded-xl border py-1.5 text-xs transition-all",
                                  stickerStyle === opt.value
                                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                                    : "border-border/70 text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        切り取りガイド線（トンボ線）
                      </span>
                      <input
                        type="checkbox"
                        checked={showCutLines}
                        onChange={(e) => setShowCutLines(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Text & Content Customization */}
                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                    <h2 className="flex items-center gap-2 font-serif text-sm font-bold tracking-tight">
                      <FileText size={16} className="text-primary" /> テキスト・案内文
                    </h2>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">
                          メイン見出し
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {HEADLINE_PRESETS.slice(0, 3).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setHeadline(p)}
                              className="rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 text-[0.625rem] text-muted-foreground hover:text-foreground"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground">
                          サブ見出し・説明
                        </label>
                        <input
                          type="text"
                          value={subhead}
                          onChange={(e) => setSubhead(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {SUBHEAD_PRESETS.slice(0, 2).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSubhead(p)}
                              className="rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 text-[0.625rem] text-muted-foreground hover:text-foreground"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            店舗ロゴを表示
                          </span>
                          <input
                            type="checkbox"
                            checked={showLogo}
                            onChange={(e) => setShowLogo(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            4ヶ国語（日英中韓）案内ガイド
                          </span>
                          <input
                            type="checkbox"
                            checked={showMultilingual}
                            onChange={(e) => setShowMultilingual(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            Wi-Fi 接続情報を掲載
                          </span>
                          <input
                            type="checkbox"
                            checked={showWifi}
                            onChange={(e) => setShowWifi(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </div>

                        {showWifi && (
                          <div className="mt-2 rounded-xl bg-muted/40 p-3 space-y-2">
                            <div>
                              <label className="text-[0.6875rem] font-semibold text-muted-foreground">
                                Wi-Fi SSID（ネットワーク名）
                              </label>
                              <input
                                type="text"
                                value={wifiSsid}
                                onChange={(e) => setWifiSsid(e.target.value)}
                                placeholder="例: Free_Restaurant_WiFi"
                                className="mt-1 w-full rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="text-[0.6875rem] font-semibold text-muted-foreground">
                                パスワード
                              </label>
                              <input
                                type="text"
                                value={wifiPass}
                                onChange={(e) => setWifiPass(e.target.value)}
                                placeholder="例: welcome1234"
                                className="mt-1 w-full rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* QR Design & Colors */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                <h2 className="flex items-center gap-2 font-serif text-sm font-bold tracking-tight">
                  <Palette size={16} className="text-primary" /> QRコード配色 & 耐久性
                </h2>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      前景（QRコード色）
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DARK_COLOR_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setDark(p.value)}
                          title={p.label}
                          className={cn(
                            "size-7 rounded-full border p-0.5 transition-all cursor-pointer",
                            dark === p.value
                              ? "border-primary ring-2 ring-primary/30 scale-110"
                              : "border-border/70 hover:scale-105",
                          )}
                        >
                          <span
                            className="block size-full rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      背景色
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LIGHT_COLOR_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setLight(p.value)}
                          title={p.label}
                          className={cn(
                            "size-7 rounded-full border p-0.5 transition-all cursor-pointer",
                            light === p.value
                              ? "border-primary ring-2 ring-primary/30 scale-110"
                              : "border-border/70 hover:scale-105",
                          )}
                        >
                          <span
                            className="block size-full rounded-full border border-black/10"
                            style={{ backgroundColor: p.color }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      誤り訂正レベル
                    </label>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {[
                        { val: "L", label: "L (7%)", hint: "標準" },
                        { val: "M", label: "M (15%)", hint: "一般" },
                        { val: "Q", label: "Q (25%)", hint: "推奨" },
                        { val: "H", label: "H (30%)", hint: "最高" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setEc(opt.val as QrErrorCorrection)}
                          className={cn(
                            "rounded-lg border py-1.5 text-center text-xs transition-all",
                            ec === opt.val
                              ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                              : "border-border/70 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <div className="font-bold">{opt.val}</div>
                          <div className="text-[0.5625rem] opacity-80">{opt.hint}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[0.625rem] text-muted-foreground">
                      卓上の水滴や傷に強い「Q」または「H」が飲食店におすすめです。
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Preview & Print Area */}
            <main className="flex flex-col items-center">
              {/* Preview Notice Bar */}
              <div className="no-print mb-4 flex w-full items-center justify-between rounded-xl bg-primary/5 px-4 py-2 text-xs text-muted-foreground border border-primary/15">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Eye size={14} className="text-primary" /> 実物プレビュー（印刷時は用紙サイズに自動最適化されます）
                </span>
                <span className="text-[0.6875rem] text-muted-foreground">
                  {template === "stand-portrait" && `卓上スタンド (${paperSize.toUpperCase()})`}
                  {template === "stand-tent" && "三角折込POP (A4横)"}
                  {template === "sticker-sheet" && `ステッカーシート (${stickerGrid}面付け)`}
                  {template === "mini-card" && "伝票ミニカード (10面付け)"}
                  {template === "single-export" && "単体素材エクスポート"}
                </span>
              </div>

              {/* Render Selected Template */}
              {template === "stand-portrait" && (
                <div className="flex flex-col items-center gap-8 w-full">
                  <div
                    className={cn(
                      "print-container mx-auto overflow-hidden bg-white text-foreground shadow-lg border border-border/80 print:shadow-none print:border-none",
                      getPageClass(),
                    )}
                    style={{
                      padding: paperSize === "postcard" ? "12mm 10mm" : paperSize === "a5" ? "16mm 14mm" : "24mm 20mm",
                    }}
                  >
                      <div className="flex h-full flex-col justify-between items-center text-center border-2 border-foreground/15 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white via-white to-muted/20">
                        {/* Header: Logo & Restaurant Name */}
                        <div className="flex flex-col items-center">
                          {showLogo && restaurant.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={restaurant.logoUrl}
                              alt={restaurant.name}
                              className="size-16 sm:size-20 rounded-full object-cover border border-border/60 mb-2"
                            />
                          ) : (
                            <div className="size-12 sm:size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-2">
                              {restaurant.name.charAt(0)}
                            </div>
                          )}
                          <p className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            {restaurant.name}
                          </p>
                          {restaurant.tagline && (
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                              {restaurant.tagline}
                            </p>
                          )}
                        </div>

                        {/* Middle: Headline */}
                        <div className="my-4 flex flex-col items-center">
                          <h3 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-primary">
                            {headline}
                          </h3>
                          {subhead && (
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-foreground/80">
                              {subhead}
                            </p>
                          )}
                        </div>

                        {/* QR Code Graphic (High crisp SVG) */}
                        <div className="relative my-2 flex flex-col items-center justify-center rounded-2xl border-4 border-foreground/10 p-3 sm:p-4 bg-white shadow-xs">
                          {qrSvg ? (
                            <div
                              className="size-48 sm:size-64 [&_svg]:size-full [&_svg]:h-auto"
                              dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                          ) : (
                            <div className="grid size-48 sm:size-64 place-items-center bg-muted/40 animate-pulse text-xs text-muted-foreground">
                              QRコード生成中…
                            </div>
                          )}
                          <p className="mt-2 text-[0.625rem] font-mono text-muted-foreground truncate max-w-[200px]">
                            {restaurant.url}
                          </p>
                        </div>

                        {/* Wi-Fi Info Box (if enabled) */}
                        {showWifi && (wifiSsid || wifiPass) && (
                          <div className="my-2 flex items-center gap-4 rounded-xl border border-border/80 bg-muted/40 px-4 py-2 text-left">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Wifi size={16} />
                            </div>
                            <div className="text-[0.6875rem] font-medium leading-tight">
                              {wifiSsid && (
                                <div>
                                  <span className="text-muted-foreground">SSID: </span>
                                  <span className="font-bold text-foreground font-mono">{wifiSsid}</span>
                                </div>
                              )}
                              {wifiPass && (
                                <div>
                                  <span className="text-muted-foreground">PASS: </span>
                                  <span className="font-bold text-foreground font-mono">{wifiPass}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Multilingual Scan Instructions */}
                        {showMultilingual && (
                          <div className="mt-3 w-full border-t border-border/60 pt-3">
                            <div className="grid grid-cols-2 gap-2 text-[0.625rem] sm:text-[0.6875rem] font-medium text-foreground/80">
                              <div className="flex items-center gap-1.5 text-left">
                                <span className="text-xs">🇯🇵</span>
                                <span>カメラをかざしてメニュー表示</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-left">
                                <span className="text-xs">🇬🇧</span>
                                <span>Scan with camera to view menu</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-left">
                                <span className="text-xs">🇨🇳</span>
                                <span>使用手机相机扫码即可浏览</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-left">
                                <span className="text-xs">🇰🇷</span>
                                <span>카메라로 스캔하여 메뉴 보기</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer Branding */}
                        <div className="mt-3 text-[0.5625rem] tracking-widest text-muted-foreground/60 uppercase">
                          ArigatoMenu Digital Menu Service
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Template: Stand Tent (Foldable Triangle A4 Landscape) */}
              {template === "stand-tent" && (
                <div
                  className="print-container mx-auto overflow-hidden bg-white text-foreground shadow-lg border border-border/80 print:shadow-none print:border-none page-a4-landscape p-[12mm]"
                >
                  <div className="relative flex h-full w-full border-2 border-dashed border-border/70 rounded-2xl p-4">
                    {/* Center Fold Line */}
                    <div className="absolute inset-y-0 left-1/2 w-0 border-r-2 border-dashed border-primary/40 -translate-x-1/2 flex items-center justify-center">
                      <span className="bg-white px-2 text-[0.625rem] font-bold text-primary/70 tracking-widest uppercase -rotate-90">
                        山折り / Fold Line
                      </span>
                    </div>

                    {/* Left Panel */}
                    <div className="flex-1 flex flex-col justify-between items-center text-center p-6 pr-8">
                      <div>
                        <p className="font-serif text-xl font-black">{restaurant.name}</p>
                        <h4 className="mt-1 text-sm font-bold text-primary">{headline}</h4>
                        </div>

                      <div className="my-2 rounded-xl border border-border/80 p-2 bg-white">
                        {qrSvg ? (
                          <div
                            className="size-36 [&_svg]:size-full"
                            dangerouslySetInnerHTML={{
                              __html: qrSvg,
                            }}
                          />
                        ) : null}
                      </div>

                      {showMultilingual && (
                        <div className="text-[0.625rem] text-muted-foreground space-y-0.5">
                          <p>📷 カメラをかざすだけでメニューが開きます</p>
                          <p>Scan with smartphone camera</p>
                        </div>
                      )}
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 flex flex-col justify-between items-center text-center p-6 pl-8">
                      <div>
                        <p className="font-serif text-xl font-black">{restaurant.name}</p>
                        <h4 className="mt-1 text-sm font-bold text-primary">{headline}</h4>
                        </div>

                      <div className="my-2 rounded-xl border border-border/80 p-2 bg-white">
                        {qrSvg ? (
                          <div
                            className="size-36 [&_svg]:size-full"
                            dangerouslySetInnerHTML={{
                              __html: qrSvg,
                            }}
                          />
                        ) : null}
                      </div>

                      {showWifi && (wifiSsid || wifiPass) ? (
                        <div className="text-[0.625rem] font-mono bg-muted/40 px-3 py-1 rounded-lg">
                          Wi-Fi: {wifiSsid} / {wifiPass}
                        </div>
                      ) : (
                        <div className="text-[0.625rem] text-muted-foreground space-y-0.5">
                          <p>🇨🇳 扫码看菜单 / 🇰🇷 메뉴 보기</p>
                          <p>多言語・写真・アレルギー対応</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Template: Sticker Sheet (Multi-up A4) */}
              {template === "sticker-sheet" && (
                <div
                  className="print-container mx-auto overflow-hidden bg-white text-foreground shadow-lg border border-border/80 print:shadow-none print:border-none page-a4-portrait p-[14mm]"
                >
                  <div className="no-print mb-3 text-center text-xs font-semibold text-muted-foreground">
                    A4ステッカー用紙（または普通紙に印刷して切り取り）対応
                  </div>

                  <div
                    className={cn(
                      "grid h-full w-full gap-4",
                      stickerGrid === "6" && "grid-cols-2 grid-rows-3",
                      stickerGrid === "8" && "grid-cols-2 grid-rows-4",
                      stickerGrid === "12" && "grid-cols-3 grid-rows-4",
                    )}
                  >
                    {Array.from({ length: Number(stickerGrid) }).map((_, i) => (
                      <div
                        key={`sticker-${i}`}
                        className={cn(
                          "relative flex flex-col justify-between items-center text-center p-3 bg-white",
                          showCutLines && "border border-dashed border-border/80",
                          stickerStyle === "badge" && "rounded-2xl border-2 border-foreground/15 shadow-2xs",
                          stickerStyle === "circle" && "rounded-full border-2 border-foreground/20 aspect-square justify-center p-4",
                          stickerStyle === "compact" && "rounded-lg border border-border/70",
                        )}
                      >
                        {/* Cut Line Marker */}
                        {showCutLines && (
                          <span className="no-print absolute top-1 right-1 text-[0.5rem] text-muted-foreground/40 font-mono">
                            ✂
                          </span>
                        )}

                        {/* Top: Restaurant name */}
                        <div className="flex flex-col items-center">
                          <p className="font-serif text-xs sm:text-sm font-bold truncate max-w-[140px]">
                            {restaurant.name}
                          </p>
                        </div>

                        {/* Center: QR */}
                        <div className="my-1 rounded-xl p-1 bg-white">
                          {qrSvg ? (
                            <div
                              className={cn(
                                "[&_svg]:size-full",
                                stickerGrid === "6" ? "size-28" : stickerGrid === "8" ? "size-22" : "size-18",
                              )}
                              dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                          ) : (
                            <div className="size-20 bg-muted/30 animate-pulse" />
                          )}
                        </div>

                        {/* Bottom: Instructions */}
                        <div className="text-[0.5625rem] font-semibold text-foreground/80 leading-tight">
                          <p>📷 カメラでメニュー表示</p>
                          <p className="text-[0.5rem] text-muted-foreground font-normal">
                            Scan for Digital Menu
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template: Mini Card (10-up A4 Business Card Size) */}
              {template === "mini-card" && (
                <div
                  className="print-container mx-auto overflow-hidden bg-white text-foreground shadow-lg border border-border/80 print:shadow-none print:border-none page-a4-portrait p-[14mm]"
                >
                  <div className="no-print mb-3 text-center text-xs font-semibold text-muted-foreground">
                    A4 名刺10面用紙（91×55mm）対応 / 会計伝票クリップ・レジ横用
                  </div>

                  <div className="grid grid-cols-2 grid-rows-5 gap-3 h-full w-full">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "relative flex items-center justify-between p-3.5 bg-white rounded-xl border",
                          showCutLines ? "border-dashed border-border/80" : "border-border/40",
                        )}
                      >
                        <div className="flex flex-col justify-between h-full text-left max-w-[130px]">
                          <div>
                            <p className="font-serif text-xs font-bold text-foreground truncate">
                              {restaurant.name}
                            </p>
                            <p className="text-[0.625rem] font-semibold text-primary mt-0.5">
                              スマホでメニューを見る
                            </p>
                          </div>
                          <div className="text-[0.5rem] text-muted-foreground leading-tight">
                            <p>📷 カメラで読み取り</p>
                            <p>Scan for Menu</p>
                          </div>
                        </div>

                        <div className="size-16 shrink-0 rounded-lg p-0.5 bg-white border border-border/50">
                          {qrSvg ? (
                            <div
                              className="size-full [&_svg]:size-full"
                              dangerouslySetInnerHTML={{
                                __html: qrSvg,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template: Single QR Export Hub */}
              {template === "single-export" && (
                <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-white rounded-2xl border-2 border-border/60 shadow-xs">
                      {singleSvg ? (
                        <div
                          className="size-60 [&_svg]:size-full"
                          dangerouslySetInnerHTML={{ __html: singleSvg }}
                        />
                      ) : (
                        <div className="size-60 bg-muted/40 animate-pulse" />
                      )}
                    </div>

                    <h3 className="mt-4 font-serif text-xl font-bold">{restaurant.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                      {restaurant.url}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      {singleSvg && (
                        <Button
                          variant="default"
                          size="default"
                          onClick={() =>
                            handleDownloadSvg(singleSvg, `arigatomenu-${restaurant.slug}.svg`)
                          }
                          className="gap-2 font-bold"
                        >
                          <Download size={15} /> SVGベクターダウンロード
                        </Button>
                      )}

                      {singlePngUrl && (
                        <a
                          href={singlePngUrl}
                          download={`arigatomenu-${restaurant.slug}-300dpi.png`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
                        >
                          <Download size={15} /> 高解像度 PNG (2400px)
                        </a>
                      )}

                      <Button variant="outline" size="default" onClick={handleCopyUrl}>
                        {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                        {copied ? "コピーしました" : "URLコピー"}
                      </Button>
                    </div>

                    <div className="mt-8 rounded-xl bg-muted/40 p-4 text-left text-xs text-muted-foreground space-y-1.5 border border-border/50">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Info size={14} className="text-primary" />
                        ベクター形式（SVG）のご利用について
                      </div>
                      <p>
                        SVGファイルは拡大・縮小しても画質が劣化しないベクターデータです。
                      </p>
                      <p>
                        Canva, Adobe Illustrator, 印刷業者（ラクスル・グラフィック等）、アクリルスタンド製造業者などへの入稿データとしてそのままご利用いただけます。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
