"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/dashboard/actions";

export function RestaurantLogoForm({
  logoUrl,
  coverUrl,
  uploadLogoAction,
  removeLogoAction,
  uploadCoverAction,
  removeCoverAction,
}: {
  logoUrl: string | null;
  coverUrl?: string | null;
  uploadLogoAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  removeLogoAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  uploadCoverAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  removeCoverAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  // Logo state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [logoUploadState, logoUploadFormAction, logoUploading] = useActionState<ActionState, FormData>(
    uploadLogoAction,
    undefined,
  );
  const [logoRemoveState, logoRemoveFormAction, logoRemoving] = useActionState<ActionState, FormData>(
    removeLogoAction,
    undefined,
  );

  // Cover state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [coverUploadState, coverUploadFormAction, coverUploading] = useActionState<ActionState, FormData>(
    uploadCoverAction ?? (async () => undefined),
    undefined,
  );
  const [coverRemoveState, coverRemoveFormAction, coverRemoving] = useActionState<ActionState, FormData>(
    removeCoverAction ?? (async () => undefined),
    undefined,
  );

  const currentLogo = logoRemoveState?.message ? null : (logoPreview || logoUrl);
  const currentCover = coverRemoveState?.message ? null : (coverPreview || coverUrl);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-2xs">
      <div>
        <p className="font-serif text-base font-bold text-foreground">店舗イメージ・ロゴ設定</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          店舗のロゴマークと、ストアフロント（トップページ）に掲載するメイン画像（カバー写真）を設定できます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/50">
        {/* 1. Store Logo */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold text-foreground">店舗ロゴ</p>
            <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
              正方形または円形（PNG, JPEG, WebP, SVG / 2MB以下）
            </p>
          </div>

          <div className="flex items-center gap-4">
            {currentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentLogo}
                alt="店舗ロゴ"
                className="size-16 shrink-0 rounded-2xl border-2 border-border/70 object-cover shadow-2xs bg-white"
              />
            ) : (
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/40 text-muted-foreground">
                <ImageIcon size={22} strokeWidth={1.5} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <form action={logoUploadFormAction} className="flex flex-wrap items-center gap-1.5">
                <input
                  ref={logoInputRef}
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedLogo(f);
                      setLogoPreview(URL.createObjectURL(f));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs gap-1 h-8"
                >
                  <Upload size={12} />
                  {selectedLogo ? selectedLogo.name : "ロゴ選択"}
                </Button>

                {selectedLogo && (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={logoUploading}
                    className="text-xs font-bold h-8 shadow-2xs"
                  >
                    {logoUploading ? "保存中…" : "設定"}
                  </Button>
                )}
              </form>

              {logoUrl && !selectedLogo && (
                <form action={logoRemoveFormAction} className="mt-1">
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:bg-destructive/10 gap-1 h-7 p-0 px-2"
                    disabled={logoRemoving}
                  >
                    <Trash2 size={11} /> ロゴ削除
                  </Button>
                </form>
              )}
            </div>
          </div>

          {(logoUploadState?.message ?? logoRemoveState?.message) && (
            <p className="flex items-center gap-1 text-[0.6875rem] font-semibold text-primary">
              <Check size={12} /> {logoUploadState?.message ?? logoRemoveState?.message}
            </p>
          )}
          {(logoUploadState?.error ?? logoRemoveState?.error) && (
            <p className="text-[0.6875rem] font-semibold text-destructive">
              {logoUploadState?.error ?? logoRemoveState?.error}
            </p>
          )}
        </div>

        {/* 2. Store Cover Image */}
        {uploadCoverAction && (
          <div className="flex flex-col gap-3 md:border-l md:border-border/50 md:pl-6">
            <div>
              <p className="text-xs font-bold text-foreground">店舗メイン画像（カバー写真）</p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                横長推奨（PNG, JPEG, WebP / 5MB以下）
              </p>
            </div>

            <div className="flex items-center gap-4">
              {currentCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentCover}
                  alt="店舗メイン画像"
                  className="h-16 w-24 shrink-0 rounded-2xl border-2 border-border/70 object-cover shadow-2xs bg-muted"
                />
              ) : (
                <div className="grid h-16 w-24 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/40 text-muted-foreground">
                  <ImageIcon size={22} strokeWidth={1.5} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <form action={coverUploadFormAction} className="flex flex-wrap items-center gap-1.5">
                  <input
                    ref={coverInputRef}
                    type="file"
                    name="cover"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setSelectedCover(f);
                        setCoverPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-xs gap-1 h-8"
                  >
                    <Upload size={12} />
                    {selectedCover ? selectedCover.name : "カバー選択"}
                  </Button>

                  {selectedCover && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={coverUploading}
                      className="text-xs font-bold h-8 shadow-2xs"
                    >
                      {coverUploading ? "保存中…" : "設定"}
                    </Button>
                  )}
                </form>

                {coverUrl && !selectedCover && removeCoverAction && (
                  <form action={coverRemoveFormAction} className="mt-1">
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:bg-destructive/10 gap-1 h-7 p-0 px-2"
                      disabled={coverRemoving}
                    >
                      <Trash2 size={11} /> カバー削除
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {(coverUploadState?.message ?? coverRemoveState?.message) && (
              <p className="flex items-center gap-1 text-[0.6875rem] font-semibold text-primary">
                <Check size={12} /> {coverUploadState?.message ?? coverRemoveState?.message}
              </p>
            )}
            {(coverUploadState?.error ?? coverRemoveState?.error) && (
              <p className="text-[0.6875rem] font-semibold text-destructive">
                {coverUploadState?.error ?? coverRemoveState?.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}