"use client";

import { useActionState, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Globe2,
  MoveDown,
  MoveUp,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALLERGENS, DIETARY_LABELS } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/dashboard/actions";

export type CategoryData = {
  id: string;
  name: string;
  translations: { en: string; zh: string; ko: string };
};

export type ItemData = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  status: "available" | "unavailable";
  dietary: string[];
  allergens: string[];
  translationNames: { en: string; zh: string; ko: string };
  translationDescriptions: { en: string; zh: string; ko: string };
};

type ActionWithPrev = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type ArgAction = (
  id: string,
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type MoveAction = (
  id: string,
  direction: "up" | "down",
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const statusLabels: Record<ItemData["status"], string> = {
  available: "提供中",
  unavailable: "品切れ",
};

export function MenuEditor({
  categories,
  items,
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategory,
  createItem,
  updateItem,
  deleteItem,
  moveItem,
  toggleItemStatus,
}: {
  categories: CategoryData[];
  items: ItemData[];
  createCategory: ActionWithPrev;
  updateCategory: ArgAction;
  deleteCategory: ArgAction;
  moveCategory: MoveAction;
  createItem: (categoryId: string, prevState: ActionState, formData: FormData) => Promise<ActionState>;
  updateItem: ArgAction;
  deleteItem: ArgAction;
  moveItem: MoveAction;
  toggleItemStatus: ArgAction;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");

  const totalItems = items.length;
  const availableItems = items.filter((i) => i.status === "available").length;
  const unavailableItems = items.filter((i) => i.status === "unavailable").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Category Creation Bar */}
      <CategoryInput action={createCategory} />

      {/* Quick Search & Filter Bar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
          {/* Keyword Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品名・説明文・アレルゲンで検索…"
              className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-8 py-1.5 text-xs outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                statusFilter === "all"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              すべて ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("available")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                statusFilter === "available"
                  ? "bg-background text-accent shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              提供中 ({availableItems})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unavailable")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                statusFilter === "unavailable"
                  ? "bg-background text-destructive shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              品切れ ({unavailableItems})
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/80 bg-card py-16 text-center">
          <FolderPlus className="mx-auto mb-3 text-muted-foreground" size={28} strokeWidth={1.5} />
          <h3 className="font-serif text-lg font-bold">カテゴリーを登録してください</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            「フード」「ドリンク」「ランチセット」など、カテゴリーを追加すると商品の登録ができます。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category, catIdx) => {
            let catItems = items.filter((i) => i.categoryId === category.id);
            if (statusFilter !== "all") {
              catItems = catItems.filter((i) => i.status === statusFilter);
            }
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              catItems = catItems.filter(
                (i) =>
                  i.name.toLowerCase().includes(q) ||
                  i.description.toLowerCase().includes(q) ||
                  i.translationNames.en.toLowerCase().includes(q) ||
                  i.translationNames.zh.toLowerCase().includes(q) ||
                  i.translationNames.ko.toLowerCase().includes(q) ||
                  i.allergens.some((a) => a.toLowerCase().includes(q)) ||
                  i.dietary.some((d) => d.toLowerCase().includes(q)),
              );
            }

            return (
              <CategoryBlock
                key={category.id}
                category={category}
                items={catItems}
                catIndex={catIdx}
                catCount={categories.length}
                updateCategory={updateCategory.bind(null, category.id)}
                deleteCategory={deleteCategory.bind(null, category.id)}
                moveCategoryUp={moveCategory.bind(null, category.id, "up")}
                moveCategoryDown={moveCategory.bind(null, category.id, "down")}
                createItem={createItem.bind(null, category.id)}
                updateItem={updateItem}
                deleteItem={deleteItem}
                moveItem={moveItem}
                toggleItemStatus={toggleItemStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryInput({ action }: { action: ActionWithPrev }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderPlus size={18} className="text-primary" />
          <span className="font-serif text-sm font-bold">新しいカテゴリーを追加</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-muted-foreground"
        >
          {open ? "多言語入力を閉じる" : "+ 多言語名も同時入力"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          name="name"
          placeholder="カテゴリー名（日本語・必須 例: おすすめ料理）"
          className="sm:max-w-md"
          required
        />
        <Button type="submit" variant="default" size="default" disabled={pending} className="font-bold shadow-xs">
          <Plus size={14} /> カテゴリーを追加
        </Button>
      </div>

      {open && (
        <div className="grid gap-2 sm:grid-cols-3 pt-2 border-t border-border/50">
          <div>
            <label className="text-[0.6875rem] font-semibold text-muted-foreground">🇬🇧 English</label>
            <Input name="name_en" placeholder="Category Name" className="mt-1" />
          </div>
          <div>
            <label className="text-[0.6875rem] font-semibold text-muted-foreground">🇨🇳 中文</label>
            <Input name="name_zh" placeholder="分类名称" className="mt-1" />
          </div>
          <div>
            <label className="text-[0.6875rem] font-semibold text-muted-foreground">🇰🇷 한국어</label>
            <Input name="name_ko" placeholder="카테고리 이름" className="mt-1" />
          </div>
        </div>
      )}

      {state?.error && <p className="text-xs font-semibold text-destructive">{state.error}</p>}
    </form>
  );
}

function CategoryBlock({
  category,
  items,
  catIndex,
  catCount,
  updateCategory,
  deleteCategory,
  moveCategoryUp,
  moveCategoryDown,
  createItem,
  updateItem,
  deleteItem,
  moveItem,
  toggleItemStatus,
}: {
  category: CategoryData;
  items: ItemData[];
  catIndex: number;
  catCount: number;
  updateCategory: ActionWithPrev;
  deleteCategory: ActionWithPrev;
  moveCategoryUp: ActionWithPrev;
  moveCategoryDown: ActionWithPrev;
  createItem: ActionWithPrev;
  updateItem: ArgAction;
  deleteItem: ArgAction;
  moveItem: MoveAction;
  toggleItemStatus: ArgAction;
}) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editing, setEditing] = useState(false);

  const [moveUpState, moveUpAction, movingUp] = useActionState<ActionState, FormData>(
    moveCategoryUp,
    undefined,
  );
  const [moveDownState, moveDownAction, movingDown] = useActionState<ActionState, FormData>(
    moveCategoryDown,
    undefined,
  );

  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-2xs overflow-hidden">
      {/* Category Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Category Reordering Buttons */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-background p-0.5">
            <form action={moveUpAction}>
              <button
                type="submit"
                disabled={catIndex === 0 || movingUp}
                title="カテゴリーを上へ移動"
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <ChevronUp size={14} />
              </button>
            </form>
            <form action={moveDownAction}>
              <button
                type="submit"
                disabled={catIndex === catCount - 1 || movingDown}
                title="カテゴリーを下へ移動"
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-serif text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{category.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {items.length}品
              </span>
            </h2>
            {(category.translations.en || category.translations.zh || category.translations.ko) && (
              <p className="text-[0.6875rem] text-muted-foreground">
                {[category.translations.en, category.translations.zh, category.translations.ko]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {items.length === 0 && (
            <DeleteCategoryButton action={deleteCategory} />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil size={13} /> 編集
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => setShowAddItem((v) => !v)}
            className="text-xs font-bold shadow-2xs"
          >
            <Plus size={14} /> 商品を追加
          </Button>
        </div>
      </header>

      {/* Category Edit Form */}
      {editing && (
        <div className="border-b border-border/50 bg-muted/10 p-5">
          <CategoryEditForm
            category={category}
            action={updateCategory}
            onDone={() => setEditing(false)}
          />
        </div>
      )}

      {/* New Item Form */}
      {showAddItem && (
        <div className="border-b border-border/50 bg-primary/5 p-5">
          <ItemForm
            action={createItem}
            title={`${category.name} に商品を追加`}
            onSuccess={() => setShowAddItem(false)}
            onCancel={() => setShowAddItem(false)}
          />
        </div>
      )}

      {/* Item List */}
      {items.length === 0 ? (
        <div className="py-8 px-5 text-center text-xs text-muted-foreground">
          商品がありません。「商品を追加」からメニューを登録してください。
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.map((item, itemIdx) => (
            <ItemRow
              key={item.id}
              item={item}
              itemIndex={itemIdx}
              itemCount={items.length}
              updateAction={updateItem.bind(null, item.id)}
              deleteAction={deleteItem.bind(null, item.id)}
              moveItemUp={moveItem.bind(null, item.id, "up")}
              moveItemDown={moveItem.bind(null, item.id, "down")}
              toggleStatusAction={toggleItemStatus.bind(null, item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryEditForm({
  category,
  action,
  onDone,
}: {
  category: CategoryData;
  action: ActionWithPrev;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="font-serif text-xs font-bold text-foreground">カテゴリー情報を編集</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="カテゴリー名（日本語）" defaultValue={category.name} required />
        <div className="flex items-center gap-2">
          <Button size="sm" type="submit" disabled={pending} className="font-bold">
            {pending ? "保存中…" : "カテゴリーを保存"}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={onDone}>
            キャンセル
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 pt-2">
        <div>
          <label className="text-[0.625rem] font-semibold text-muted-foreground">🇬🇧 English</label>
          <Input name="name_en" placeholder="English" defaultValue={category.translations?.en ?? ""} className="mt-0.5" />
        </div>
        <div>
          <label className="text-[0.625rem] font-semibold text-muted-foreground">🇨🇳 中文</label>
          <Input name="name_zh" placeholder="中文" defaultValue={category.translations?.zh ?? ""} className="mt-0.5" />
        </div>
        <div>
          <label className="text-[0.625rem] font-semibold text-muted-foreground">🇰🇷 한국어</label>
          <Input name="name_ko" placeholder="한국어" defaultValue={category.translations?.ko ?? ""} className="mt-0.5" />
        </div>
      </div>
      {state?.error && <p className="text-xs font-semibold text-destructive">{state.error}</p>}
    </form>
  );
}

function ItemRow({
  item,
  itemIndex,
  itemCount,
  updateAction,
  deleteAction,
  moveItemUp,
  moveItemDown,
  toggleStatusAction,
}: {
  item: ItemData;
  itemIndex: number;
  itemCount: number;
  updateAction: ActionWithPrev;
  deleteAction: ActionWithPrev;
  moveItemUp: ActionWithPrev;
  moveItemDown: ActionWithPrev;
  toggleStatusAction: ActionWithPrev;
}) {
  const [editing, setEditing] = useState(false);

  const [moveUpState, moveUpFormAction, movingUp] = useActionState<ActionState, FormData>(
    moveItemUp,
    undefined,
  );
  const [moveDownState, moveDownFormAction, movingDown] = useActionState<ActionState, FormData>(
    moveItemDown,
    undefined,
  );
  const [statusState, statusFormAction, togglingStatus] = useActionState<ActionState, FormData>(
    toggleStatusAction,
    undefined,
  );

  if (editing) {
    return (
      <li className="p-5 bg-muted/15">
        <ItemForm
          action={updateAction}
          title="商品を編集"
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          defaults={{
            name: item.name,
            description: item.description,
            price: item.price,
            priceNote: item.priceNote,
            status: item.status,
            dietary: item.dietary,
            allergens: item.allergens,
            translationNames: item.translationNames,
            translationDescriptions: item.translationDescriptions,
          }}
        />
      </li>
    );
  }

  const isAvailable = item.status === "available";

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
      {/* Left Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Item Reorder Buttons */}
        <div className="flex flex-col rounded-md border border-border/60 bg-background p-0.5 shrink-0">
          <form action={moveUpFormAction}>
            <button
              type="submit"
              disabled={itemIndex === 0 || movingUp}
              title="商品を上へ移動"
              className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 cursor-pointer block"
            >
              <ChevronUp size={12} />
            </button>
          </form>
          <form action={moveDownFormAction}>
            <button
              type="submit"
              disabled={itemIndex === itemCount - 1 || movingDown}
              title="商品を下へ移動"
              className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 cursor-pointer block"
            >
              <ChevronDown size={12} />
            </button>
          </form>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={cn("font-bold text-sm", !isAvailable && "line-through text-muted-foreground")}>
              {item.name}
            </span>
            <span className="font-bold text-sm text-foreground tabular-nums">
              {formatPrice(item.price, "ja")}
            </span>
            {item.priceNote && (
              <span className="text-[0.6875rem] text-muted-foreground">{item.priceNote}</span>
            )}
          </div>

          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {item.description}
            </p>
          )}

          {/* Badges: Translations, Dietary, Allergens */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.625rem]">
            {/* Translation badges */}
            {(item.translationNames.en || item.translationNames.zh || item.translationNames.ko) && (
              <span className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-muted-foreground">
                <Globe2 size={10} />
                {item.translationNames.en && "EN "}
                {item.translationNames.zh && "ZH "}
                {item.translationNames.ko && "KO"}
              </span>
            )}

            {/* Dietary */}
            {item.dietary.map((k) => {
              const label = DIETARY_LABELS.find((d) => d.key === k);
              return label ? (
                <span key={k} className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {label.label.ja}
                </span>
              ) : null;
            })}

            {/* Allergens */}
            {item.allergens.map((k) => {
              const label = ALLERGENS.find((a) => a.key === k);
              return (
                <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {label?.label.ja ?? k}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Controls: 1-Click Status Toggle & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Fast 1-Click Status Toggle */}
        <form action={statusFormAction}>
          <button
            type="submit"
            disabled={togglingStatus}
            title={isAvailable ? "クリックして品切れにする" : "クリックして提供中にする"}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-bold transition-all",
              isAvailable
                ? "bg-accent/15 text-accent hover:bg-accent/25"
                : "bg-destructive/15 text-destructive hover:bg-destructive/25",
            )}
          >
            {isAvailable ? "● 提供中" : "✕ 品切れ"}
          </button>
        </form>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil size={13} /> 編集
        </Button>

        <DeleteItemButton action={deleteAction} />
      </div>
    </li>
  );
}

function DeleteCategoryButton({ action }: { action: ActionWithPrev }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("このカテゴリーを削除しますか？")) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-xs text-destructive hover:bg-destructive/10"
        disabled={pending}
      >
        <Trash2 size={13} /> 削除
      </Button>
    </form>
  );
}

function DeleteItemButton({ action }: { action: ActionWithPrev }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("この商品を削除しますか？")) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-xs text-destructive hover:bg-destructive/10"
        disabled={pending}
      >
        <Trash2 size={13} />
      </Button>
    </form>
  );
}

type ItemDefaults = {
  name?: string;
  description?: string;
  price?: number;
  priceNote?: string;
  status?: ItemData["status"];
  dietary?: string[];
  allergens?: string[];
  translationNames?: ItemData["translationNames"];
  translationDescriptions?: ItemData["translationDescriptions"];
};

function ItemForm({
  action,
  title,
  defaults,
  onSuccess,
  onCancel,
}: {
  action: ActionWithPrev;
  title: string;
  defaults?: ItemDefaults;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [langTab, setLangTab] = useState<"ja" | "en" | "zh" | "ko">("ja");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <p className="font-serif text-sm font-bold text-foreground">{title}</p>

        {/* Form Language Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 p-0.5 text-xs">
          {[
            { key: "ja", flag: "🇯🇵", label: "日本語" },
            { key: "en", flag: "🇬🇧", label: "English" },
            { key: "zh", flag: "🇨🇳", label: "中文" },
            { key: "ko", flag: "🇰🇷", label: "한국어" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setLangTab(tab.key as typeof langTab)}
              className={cn(
                "rounded px-2 py-0.5 font-semibold transition-all cursor-pointer",
                langTab === tab.key
                  ? "bg-background text-foreground font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tab.flag}</span> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Canonical Fields (Japanese) */}
      <div className={cn("space-y-3", langTab === "ja" ? "block" : "hidden")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              商品名（日本語） <span className="text-primary">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="例: 特製醤油らーめん"
              defaultValue={defaults?.name}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="price">価格（円・税込）</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="1200"
              defaultValue={defaults?.price ?? ""}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="description">説明・こだわり（日本語・任意）</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="スープや麺、具材のこだわりなどを記載します。"
            defaultValue={defaults?.description}
            className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Foreign Language Fields (Always rendered in DOM so FormData captures all) */}
      {(["en", "zh", "ko"] as const).map((lang) => (
        <div
          key={lang}
          className={cn("space-y-3", langTab === lang ? "block" : "hidden")}
        >
          <div className="rounded-xl bg-muted/40 p-2.5 text-[0.6875rem] text-muted-foreground border border-border/50">
            {lang === "en" && "🇬🇧 English: 外国人観光客向けの英語表記です。未入力時は日本語が表示されます。"}
            {lang === "zh" && "🇨🇳 中文: 中国語圏の旅行者向けの簡体字表記です。"}
            {lang === "ko" && "🇰🇷 한국어: 韓国からの旅行者向けのハングル表記です。"}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`name_${lang}`}>商品名 ({lang.toUpperCase()})</Label>
            <Input
              id={`name_${lang}`}
              name={`name_${lang}`}
              placeholder={lang === "en" ? "Special Shoyu Ramen" : lang === "zh" ? "特制酱油拉面" : "특제 간장 라멘"}
              defaultValue={defaults?.translationNames?.[lang]}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`description_${lang}`}>説明 ({lang.toUpperCase()})</Label>
            <textarea
              id={`description_${lang}`}
              name={`description_${lang}`}
              rows={2}
              placeholder={`Description in ${lang.toUpperCase()}...`}
              defaultValue={defaults?.translationDescriptions?.[lang]}
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>
      ))}

      {/* Dietary & Allergens Selection */}
      <div className="pt-2 border-t border-border/50 space-y-3">
        <ChipGroup
          name="dietary"
          options={DIETARY_LABELS.map((l) => ({ key: l.key, label: l.label.ja }))}
          defaults={defaults?.dietary}
          label="食の配慮（ベジタリアン・ハラール・グルテンフリーなど）"
        />

        <ChipGroup
          name="allergens"
          options={ALLERGENS.map((l) => ({ key: l.key, label: l.label.ja }))}
          defaults={defaults?.allergens}
          label="アレルゲン（特定原材料等28品目）"
        />
      </div>

      {/* Status Selection */}
      <div className="grid gap-1.5 sm:w-1/2 pt-2 border-t border-border/50">
        <Label htmlFor="status">提供ステータス</Label>
        <SelectStatus name="status" defaults={defaults?.status} />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state && !state.error && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Check size={14} /> 保存しました。
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Button type="submit" disabled={pending} size="default" className="font-bold shadow-xs">
          {pending ? "保存中…" : defaults ? "変更を保存" : "この商品を登録"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="default" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}

function ChipGroup({
  name,
  options,
  defaults,
  label,
}: {
  name: string;
  options: { key: string; label: string }[];
  defaults?: string[];
  label: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaults ?? []),
  );
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt.key);
          return (
            <label
              key={opt.key}
              className={cn(
                "cursor-pointer select-none rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:border-foreground/30",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={opt.key}
                checked={active}
                onChange={() => toggle(opt.key)}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SelectStatus({
  name,
  defaults,
}: {
  name: string;
  defaults?: ItemData["status"];
}) {
  const [value, setValue] = useState<ItemData["status"]>(defaults ?? "available");
  const options: ItemData["status"][] = ["available", "unavailable"];
  return (
    <div className="flex rounded-xl border border-input p-0.5 bg-muted/20">
      {options.map((opt) => (
        <label
          key={opt}
          className={cn(
            "flex-1 cursor-pointer py-1.5 text-center text-xs font-bold transition-all rounded-lg",
            value === opt
              ? opt === "available"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "bg-destructive text-destructive-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => setValue(opt)}
            className="sr-only"
          />
          {statusLabels[opt]}
        </label>
      ))}
    </div>
  );
}