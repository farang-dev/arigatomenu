"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  file: File;
  /** Output edge length in pixels. */
  size?: number;
  mimeType?: "image/jpeg" | "image/webp";
  onCancel: () => void;
  onApply: (cropped: File) => void;
};

const VIEWPORT = 288;

/**
 * Square crop dialog: the user drags the image and zooms it so the part they
 * want sits inside the square frame, then we render that frame to a canvas and
 * hand back a square File. No cropping library needed.
 */
export function SquareImageCropper({
  file,
  size = 1000,
  mimeType = "image/jpeg",
  onCancel,
  onApply,
}: Props) {
  const [objectUrl] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  // How much the image may move before an edge would come inside the frame.
  const maxOffset = useCallback(() => {
    if (!natural) return { x: 0, y: 0 };
    const cover = Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h);
    const w = natural.w * cover * zoom;
    const h = natural.h * cover * zoom;
    return { x: Math.max(0, (w - VIEWPORT) / 2), y: Math.max(0, (h - VIEWPORT) / 2) };
  }, [natural, zoom]);

  const clamp = useCallback(
    (x: number, y: number) => {
      const max = maxOffset();
      return {
        x: Math.min(max.x, Math.max(-max.x, x)),
        y: Math.min(max.y, Math.max(-max.y, y)),
      };
    },
    [maxOffset],
  );

  // Clamped at the point of use, so a zoom change can never leave the frame unfilled.
  const view = clamp(offset.x, offset.y);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (saving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: view.x,
      baseY: view.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = clamp(
      drag.baseX + (e.clientX - drag.startX),
      drag.baseY + (e.clientY - drag.startY),
    );
    setOffset(next);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img || !natural || saving) return;

    setSaving(true);
    setError(null);
    try {
      // Same geometry as the preview: the image covers the frame, `zoom` enlarges it,
      // and `view` shifts its centre. k maps viewport pixels onto canvas pixels.
      const cover = Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) * zoom;
      const k = size / VIEWPORT;
      const drawW = natural.w * cover * k;
      const drawH = natural.h * cover * k;
      const centerX = (VIEWPORT / 2 + view.x) * k;
      const centerY = (VIEWPORT / 2 + view.y) * k;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas を初期化できませんでした。");

      // White backdrop so a transparent source does not become black in JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mimeType, 0.9),
      );
      if (!blob) throw new Error("画像の書き出しに失敗しました。");

      const ext = mimeType === "image/webp" ? "webp" : "jpg";
      onApply(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-square.${ext}`, { type: mimeType }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像のクロップに失敗しました。");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">正方形にクロップ</h3>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            キャンセル
          </button>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          画像をドラッグして位置を調整し、ズームで好きな部分を正方形の中に収めてください。
        </p>

        {/* Square crop viewport */}
        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-neutral-950"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {objectUrl ? (
            <img
              ref={imgRef}
              src={objectUrl}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
              className="absolute left-1/2 top-1/2 max-w-none object-cover"
              style={{
                width: natural ? natural.w * Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) * zoom : undefined,
                height: natural ? natural.h * Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) * zoom : undefined,
                transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px)`,
              }}
            />
          ) : null}

          {/* Rule-of-thirds guides */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="ズーム"
          />
          <ZoomIn size={16} className="shrink-0 text-muted-foreground" />
        </div>

        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 cursor-pointer rounded-xl border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving || !natural}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            この設定で保存
          </button>
        </div>
      </div>
    </div>
  );
}
