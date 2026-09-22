"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Check, ExternalLink, Download, Printer, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionState, QrErrorCorrection } from "@/app/dashboard/actions";

type QrCardProps = {
  restaurantId: string;
  url: string;
  slug: string;
  isPublished: boolean;
  initialDark: string;
  initialLight: string;
  saveAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

const DARK_OPTIONS: { value: string; label: string }[] = [
  { value: "#1B1B1B", label: "黒" },
  { value: "#FF5406", label: "エンバー" },
  { value: "#00B33F", label: "グリーン" },
  { value: "#1E3A5F", label: "ネイビー" },
  { value: "#4A2C17", label: "焦茶" },
];

const LIGHT_OPTIONS: { value: string; label: string }[] = [
  { value: "#FFFFFF", label: "白" },
  { value: "#FFF8F0", label: "アイボリー" },
  { value: "#FFF1EA", label: "エンバーティント" },
  { value: "#EEFBF2", label: "ミント" },
  { value: "#F0F8FC", label: "スカイ" },
];

function qrCodeToDataUrl(
  url: string,
  params: { dark: string; light: string; ec: QrErrorCorrection; width: number },
) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: params.ec,
    margin: 4,
    width: params.width,
    color: { dark: params.dark, light: params.light },
  });
}

export function QrCard({
  restaurantId,
  url,
  slug,
  isPublished,
  initialDark,
  initialLight,
  saveAction,
}: QrCardProps) {
  const [dark, setDark] = useState(initialDark);
  const [light, setLight] = useState(initialLight);
  const ec: QrErrorCorrection = "Q";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    qrCodeToDataUrl(url, { dark, light, ec, width: 480 })
      .then((d) => {
        if (!cancelled) setPreviewUrl(d);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, dark, light, ec]);

  useEffect(() => {
    let cancelled = false;
    qrCodeToDataUrl(url, { dark, light, ec, width: 2000 })
      .then((d) => {
        if (!cancelled) setDownloadUrl(d);
      })
      .catch(() => {
        if (!cancelled) setDownloadUrl(null);
      });

    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: ec,
      margin: 2,
      color: { dark, light },
    })
      .then((svg) => {
        if (!cancelled) setSvgString(svg);
      })
      .catch(() => {
        if (!cancelled) setSvgString(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url, dark, light, ec]);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveAction,
    undefined,
  );

  const dirty = dark !== initialDark || light !== initialLight;

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `arigatomenu-${slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const swatch = (options: { value: string; label: string }[], selected: string, onSelect: (v: string) => void) =>
    options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onSelect(opt.value)}
        title={opt.label}
        className={cn(
          "cursor-pointer rounded-full border p-0.5 transition-shadow",
          selected === opt.value
            ? "border-ring shadow-[0_0_0_3px] shadow-ring/25"
            : "border-border/70",
        )}
      >
        <span
          className="block size-7 rounded-full border border-black/5"
          style={{ backgroundColor: opt.value }}
        />
      </button>
    ));

  return (
    <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
      <div className="flex flex-col items-center gap-3">
        <p className="text-[0.6875rem] font-bold tracking-[0.2em] text-primary">
          {isPublished
            ? "配信中のQRコード"
            : "公開するとお客さまに届きます"}
        </p>
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt={`QRコード: ${url}`}
            width={200}
            height={200}
            className="size-48 rounded-xl border border-border/50 p-1 bg-white"
          />
        ) : (
          <div className="grid size-48 animate-pulse place-items-center rounded-xl border border-border/50 text-xs text-muted-foreground">
            生成中…
          </div>
        )}
        <div className="text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold break-all">
            {slug}
          </p>
          <p className="mt-1 text-xs text-muted-foreground break-all">{url}</p>
        </div>
      </div>

      {/* Featured CTA: Studio Link */}
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
          <Sparkles size={14} /> 卓上スタンド & ステッカー作成
        </div>
        <p className="mt-1 text-[0.6875rem] text-muted-foreground leading-snug">
          A4/A5スタンドPOP、テーブル連番ステッカーシートを一括作成・印刷できます
        </p>
        <Link
          href={`/dashboard/restaurants/${restaurantId}/qr`}
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "mt-3 w-full justify-center gap-1.5 text-xs font-bold shadow-xs",
          )}
        >
          <Printer size={14} /> 印刷・ステッカー スタジオを開く
        </Link>
      </div>

      <form action={formAction} className="mt-5 flex flex-col gap-4 border-t border-border/40 pt-5">
        <div>
          <p className="text-xs font-bold text-foreground">配色（前景／背景）</p>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-10 shrink-0 text-[0.6875rem] text-muted-foreground">前景</span>
              {swatch(DARK_OPTIONS, dark, setDark)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-10 shrink-0 text-[0.6875rem] text-muted-foreground">背景</span>
              {swatch(LIGHT_OPTIONS, light, setLight)}
            </div>
          </div>
        </div>

        <input type="hidden" name="qr_dark" value={dark} readOnly />
        <input type="hidden" name="qr_light" value={light} readOnly />
        <input type="hidden" name="qr_error_correction" value={ec} readOnly />

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.message && (
          <p className="flex items-center gap-1.5 text-sm text-accent font-semibold">
            <Check size={14} /> {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="default" size="sm" disabled={pending || !dirty}>
            {pending ? "保存中…" : dirty ? "デザインを保存" : "保存済み"}
          </Button>
          <Link
            href={url}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink size={13} /> 開いて確認
          </Link>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={`arigatomenu-${slug}.png`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download size={13} /> PNG
            </a>
          )}
          {svgString && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSvg}
            >
              <Download size={13} /> SVG (ベクター)
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}