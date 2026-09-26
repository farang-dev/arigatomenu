"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileImage,
  Globe2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OcrExtractedCategory, OcrExtractedItem } from "@/lib/ocr";
import {
  batchImportOcrMenu,
  ocrAnalyzeMenuImage,
} from "@/app/dashboard/actions";

type ReviewItem = OcrExtractedItem & { selected: boolean; uid: string };
type ReviewCategory = Omit<OcrExtractedCategory, "items"> & {
  selected: boolean;
  items: ReviewItem[];
};

export function OcrImportModal({
  restaurantId,
  isOpen,
  onClose,
}: {
  restaurantId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"upload" | "analyzing" | "review" | "importing">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted and editable data
  const [extractedCategories, setExtractedCategories] = useState<ReviewCategory[]>([]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleStartOcr = async () => {
    if (!selectedFile) return;
    setStage("analyzing");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await ocrAnalyzeMenuImage(restaurantId, formData);
      if (response.error || !response.data) {
        setErrorMessage(response.error || "画像解析に失敗しました。");
        setStage("upload");
        return;
      }

      // Prepare review data with selection state and unique IDs
      const mapped = response.data.categories.map((cat, cIdx) => ({
        ...cat,
        selected: true,
        items: cat.items.map((item, iIdx) => ({
          ...item,
          selected: true,
          uid: `${cIdx}-${iIdx}-${Date.now()}`,
        })),
      }));

      setExtractedCategories(mapped);
      setStage("review");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "画像解析中にエラーが発生しました。");
      setStage("upload");
    }
  };

  const handleToggleItem = (catIdx: number, itemIdx: number) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      const target = next[catIdx].items[itemIdx];
      target.selected = !target.selected;
      return next;
    });
  };

  const handleToggleCategory = (catIdx: number) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      const newSel = !next[catIdx].selected;
      next[catIdx].selected = newSel;
      next[catIdx].items.forEach((i) => (i.selected = newSel));
      return next;
    });
  };

  const handleUpdateItemName = (catIdx: number, itemIdx: number, name: string) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      next[catIdx].items[itemIdx].name = name;
      return next;
    });
  };

  const handleUpdateItemPrice = (catIdx: number, itemIdx: number, price: number) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      next[catIdx].items[itemIdx].price = price;
      return next;
    });
  };

  const handleUpdateCategoryName = (catIdx: number, name: string) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      next[catIdx].name = name;
      return next;
    });
  };

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    setExtractedCategories((prev) => {
      const next = [...prev];
      next[catIdx].items.splice(itemIdx, 1);
      return next;
    });
  };

  const selectedItemCount = extractedCategories.reduce(
    (acc, cat) => acc + cat.items.filter((i) => i.selected).length,
    0,
  );

  const handleBatchImport = async () => {
    if (selectedItemCount === 0) return;
    setStage("importing");
    setErrorMessage(null);

    // Filter out unselected categories & items
    const payload: OcrExtractedCategory[] = extractedCategories
      .map((cat) => ({
        name: cat.name,
        translations: cat.translations,
        items: cat.items.filter((i) => i.selected).map(({ selected, uid, ...rest }) => rest),
      }))
      .filter((cat) => cat.items.length > 0);

    try {
      const res = await batchImportOcrMenu(restaurantId, payload);
      if (res?.error) {
        setErrorMessage(res.error);
        setStage("review");
        return;
      }
      onClose();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "一括登録中にエラーが発生しました。");
      setStage("review");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl border border-border/80 bg-card text-foreground shadow-2xl transition-all my-8",
          stage === "review" ? "max-w-4xl" : "max-w-xl",
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Camera size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-bold tracking-tight">
                  紙メニューAI一括読み込み
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-bold text-primary">
                  BETA
                </span>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                写真から料理名・価格・カテゴリー・多言語を自動抽出して一括登録
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stage 1: Upload */}
          {stage === "upload" && (
            <div className="flex flex-col gap-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                  previewSrc
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewSrc ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt="メニュー写真"
                      className="max-h-56 rounded-xl border border-border/60 object-contain shadow-xs bg-white"
                    />
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <FileImage size={14} />
                      <span>{selectedFile?.name}</span>
                    </div>
                    <span className="text-[0.6875rem] text-muted-foreground">
                      クリックして別の写真に変更
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Upload size={24} />
                    </div>
                    <div>
                      <p className="font-serif text-sm font-bold">
                        紙メニューの写真をドラッグ＆ドロップ
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        またはクリックして画像ファイルを選択（PNG / JPEG / WebP、10MB以下）
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border/50 text-xs text-muted-foreground space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary" /> きれいに読み取るコツ
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[0.6875rem]">
                  <li>メニュー全体が明るく、文字が鮮明に写っている写真をご使用ください。</li>
                  <li>縦書き、手書き、ホワイトボード・黒板メニューの読み取りにも対応しています。</li>
                  <li>解析後に内容を確認・微調整できるので安心です。</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={onClose}>
                  キャンセル
                </Button>
                <Button
                  variant="default"
                  type="button"
                  disabled={!selectedFile}
                  onClick={handleStartOcr}
                  className="font-bold shadow-xs gap-1.5"
                >
                  <Sparkles size={14} /> AIでメニューを解析する
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2: Analyzing */}
          {stage === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="relative">
                <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">メニュー画像をAI解析中…</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  格安Visionモデルでカテゴリー、料理名、価格、アレルゲン、多言語翻訳を高速抽出しています。少々お待ちください。
                </p>
              </div>
            </div>
          )}

          {/* Stage 3: Review & Edit */}
          {stage === "review" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3.5 rounded-2xl border border-border/60">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-foreground">抽出結果の確認 & 編集</span>
                  <span className="text-muted-foreground">
                    （誤認識や不要な項目はここで修正・チェック解除できます）
                  </span>
                </div>
                <div className="text-xs font-bold text-primary">
                  選択中: {selectedItemCount} 品
                </div>
              </div>

              {/* Category & Item Review Tree */}
              <div className="space-y-5">
                {extractedCategories.map((cat, catIdx) => (
                  <div
                    key={catIdx}
                    className="rounded-2xl border border-border/70 bg-background overflow-hidden shadow-2xs"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between bg-muted/20 px-4 py-3 border-b border-border/50 gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(catIdx)}
                          className="text-primary hover:text-primary/80 cursor-pointer"
                        >
                          {cat.selected ? <CheckSquare size={17} /> : <Square size={17} />}
                        </button>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleUpdateCategoryName(catIdx, e.target.value)}
                          placeholder="カテゴリー名"
                          className="font-serif text-sm font-bold bg-transparent border-b border-transparent hover:border-border/80 focus:border-primary px-1 py-0.5 outline-none flex-1 max-w-xs"
                        />
                        {(cat.translations?.en || cat.translations?.zh || cat.translations?.ko) && (
                          <span className="text-[0.625rem] text-muted-foreground hidden sm:inline">
                            / {cat.translations.en || cat.translations.zh}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-muted-foreground">
                        {cat.items.length}品
                      </span>
                    </div>

                    {/* Category Items */}
                    <div className="divide-y divide-border/40 px-3">
                      {cat.items.map((item, itemIdx) => (
                        <div
                          key={item.uid}
                          className={cn(
                            "flex flex-wrap items-center justify-between gap-3 py-3 transition-colors",
                            !item.selected && "opacity-40",
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                            <button
                              type="button"
                              onClick={() => handleToggleItem(catIdx, itemIdx)}
                              className="text-primary hover:text-primary/80 cursor-pointer shrink-0"
                            >
                              {item.selected ? (
                                <CheckSquare size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>

                            <div className="grid gap-1 flex-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateItemName(catIdx, itemIdx, e.target.value)
                                }
                                placeholder="料理名"
                                className="text-xs font-bold bg-transparent border-b border-transparent hover:border-border/80 focus:border-primary px-1 py-0.5 outline-none"
                              />

                              {item.description && (
                                <p className="text-[0.6875rem] text-muted-foreground px-1 truncate max-w-md">
                                  {item.description}
                                </p>
                              )}

                              {/* Multi-language & allergen tags */}
                              <div className="flex flex-wrap items-center gap-1.5 px-1 text-[0.5625rem] text-muted-foreground">
                                {item.translations?.en && (
                                  <span className="rounded bg-muted/60 px-1.5 py-0.2">
                                    EN: {item.translations.en.name}
                                  </span>
                                )}
                                {item.dietary && item.dietary.length > 0 && (
                                  <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-primary font-bold">
                                    {item.dietary.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price & Delete */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-muted-foreground">¥</span>
                              <input
                                type="number"
                                min={0}
                                value={item.price}
                                onChange={(e) =>
                                  handleUpdateItemPrice(
                                    catIdx,
                                    itemIdx,
                                    Number(e.target.value),
                                  )
                                }
                                className="w-20 rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-bold tabular-nums outline-none focus:border-primary text-right"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(catIdx, itemIdx)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                              title="削除"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setStage("upload")}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw size={13} /> 別の写真を再解析
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    type="button"
                    disabled={selectedItemCount === 0}
                    onClick={handleBatchImport}
                    className="font-bold shadow-xs gap-1.5"
                  >
                    <Check size={14} /> 選択した {selectedItemCount} 品を一括登録する
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stage 4: Importing */}
          {stage === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">メニューを一括登録中…</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  カテゴリー、商品データ、多言語翻訳、アレルゲン情報を保存しています。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
