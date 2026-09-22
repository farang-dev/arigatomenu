"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/dashboard/actions";

export function RestaurantLogoForm({
  logoUrl,
  uploadAction,
  removeAction,
}: {
  logoUrl: string | null;
  uploadAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  removeAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [uploadState, uploadFormAction, uploading] = useActionState<ActionState, FormData>(
    uploadAction,
    undefined,
  );
  const [removeState, removeFormAction, removing] = useActionState<ActionState, FormData>(
    removeAction,
    undefined,
  );

  const current = removeState?.message ? null : (previewSrc || logoUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewSrc(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewSrc(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-2xs">
      <div>
        <p className="font-serif text-base font-bold text-foreground">店舗ロゴ</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          正方形または円形の画像がおすすめです。公開メニュー・卓上POP・印刷用紙メニューのヘッダーに表示されます。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current}
            alt="店舗ロゴ"
            className="size-20 shrink-0 rounded-2xl border-2 border-border/70 object-cover shadow-2xs bg-white"
          />
        ) : (
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/40 text-muted-foreground">
            <ImageIcon size={26} strokeWidth={1.5} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
            対応フォーマット: PNG, JPEG, WebP, SVG（2MB以下）
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form
              action={uploadFormAction}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                ref={inputRef}
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="text-xs gap-1.5"
              >
                <Upload size={13} />
                {selectedFile ? selectedFile.name : "画像を選択する"}
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={!selectedFile || uploading}
                className="text-xs font-bold shadow-2xs"
              >
                {uploading ? "アップロード中…" : "ロゴを設定"}
              </Button>
            </form>

            {logoUrl && !selectedFile && (
              <form action={removeFormAction}>
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                  disabled={removing}
                >
                  <Trash2 size={13} /> 削除
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {(uploadState?.message ?? removeState?.message) && (
        <p className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary">
          <Check size={14} /> {uploadState?.message ?? removeState?.message}
        </p>
      )}

      {(uploadState?.error ?? removeState?.error) && (
        <p
          className={cn(
            "rounded-xl bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive",
          )}
          role="alert"
        >
          {uploadState?.error ?? removeState?.error}
        </p>
      )}
    </div>
  );
}