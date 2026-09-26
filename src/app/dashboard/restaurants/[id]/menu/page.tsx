import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Printer, QrCode, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  moveCategory,
  moveItem,
  removeItemImage,
  toggleItemStatus,
  translateMenu,
  updateCategory,
  updateItem,
  uploadItemImage,
} from "@/app/dashboard/actions";
import { MenuEditor, type CategoryData, type ItemData } from "./menu-editor";
import { TranslateMenuButton } from "./translate-menu-button";

export const metadata: Metadata = {
  title: "メニュー編集",
};

export default async function MenuEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, is_published")
    .eq("id", id)
    .single();
  if (!restaurant || restaurant.id !== id || restaurant.slug === null) {
    notFound();
  }
  const ownerCheck = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ownerCheck.data) notFound();

  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", id)
    .order("position")
    .limit(1);
  const menuId = menus?.[0]?.id;

  const categories: CategoryData[] = [];
  const items: ItemData[] = [];

  if (menuId) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, position, created_at")
      .eq("menu_id", menuId)
      .is("parent_id", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    const categoryIds = (cats ?? []).map((c) => c.id);

    const { data: catTrans } = await supabase
      .from("category_translations")
      .select("category_id, locale, name")
      .in("category_id", categoryIds);
    const catTransByCat = new Map<string, { en: string; zh: string; ko: string }>();
    for (const row of catTrans ?? []) {
      const m = catTransByCat.get(row.category_id) ?? { en: "", zh: "", ko: "" };
      const record = m as Record<string, string>;
      if (row.locale === "en" || row.locale === "zh" || row.locale === "ko") {
        record[row.locale] = row.name;
      }
      catTransByCat.set(row.category_id, m);
    }

    for (const c of cats ?? []) {
      categories.push({
        id: c.id,
        name: c.name,
        translations: catTransByCat.get(c.id) ?? { en: "", zh: "", ko: "" },
      });
    }

    if (categoryIds.length) {
      const { data: rawItems } = await supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, price_note, status, position, created_at")
        .in("category_id", categoryIds)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      const itemIds = (rawItems ?? []).map((i) => i.id);
      const [dlRes, alRes, trRes, imgRes] = await Promise.all([
        supabase
          .from("menu_item_dietary_labels")
          .select("item_id, label_id")
          .in("item_id", itemIds),
        supabase
          .from("menu_item_allergens")
          .select("item_id, allergen_id")
          .in("item_id", itemIds),
        supabase
          .from("menu_item_translations")
          .select("item_id, locale, name, description")
          .in("item_id", itemIds),
        supabase
          .from("menu_item_images")
          .select("item_id, url")
          .in("item_id", itemIds)
          .order("position"),
      ]);

      const dietaryByItem = new Map<string, string[]>();
      for (const row of dlRes.data ?? []) {
        dietaryByItem.set(row.item_id, [
          ...(dietaryByItem.get(row.item_id) ?? []),
          row.label_id,
        ]);
      }
      const allergensByItem = new Map<string, string[]>();
      for (const row of alRes.data ?? []) {
        allergensByItem.set(row.item_id, [
          ...(allergensByItem.get(row.item_id) ?? []),
          row.allergen_id,
        ]);
      }
      const transByItem = new Map<string, Record<string, { name: string; description: string | null }>>();
      for (const row of trRes.data ?? []) {
        const m = transByItem.get(row.item_id) ?? {};
        m[row.locale] = { name: row.name, description: row.description };
        transByItem.set(row.item_id, m);
      }
      const imageByItem = new Map<string, string>();
      for (const row of imgRes.data ?? []) {
        if (!imageByItem.has(row.item_id)) imageByItem.set(row.item_id, row.url);
      }

      for (const it of rawItems ?? []) {
          const translations = transByItem.get(it.id) ?? {};
          items.push({
            id: it.id,
            categoryId: it.category_id,
            name: it.name,
            description: it.description ?? "",
            price: Number(it.price),
            priceNote: it.price_note ?? "",
            status: it.status as ItemData["status"],
            dietary: dietaryByItem.get(it.id) ?? [],
            allergens: allergensByItem.get(it.id) ?? [],
            imageUrl: imageByItem.get(it.id),
            translationNames: {
              en: translations.en?.name ?? "",
              zh: translations.zh?.name ?? "",
              ko: translations.ko?.name ?? "",
            },
            translationDescriptions: {
              en: translations.en?.description ?? "",
              zh: translations.zh?.description ?? "",
              ko: translations.ko?.description ?? "",
            },
          });
        }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              ダッシュボード
            </Link>
            <span>/</span>
            <Link href={`/dashboard/restaurants/${id}`} className="hover:text-foreground">
              {restaurant.name}
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">メニュー編集</span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight">
            メニューを編集
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {restaurant.name} — カテゴリーと料理の登録・並び順変更・品切れ設定ができます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <ExternalLink size={13} /> 公開メニュー
          </Link>
          <TranslateMenuButton action={translateMenu.bind(null, id)} />
          <Link
            href={`/dashboard/restaurants/${id}/qr`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <QrCode size={13} /> 卓上POP・QR
          </Link>
          <Link
            href={`/dashboard/restaurants/${id}/print`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <Printer size={13} /> 印刷メニュー
          </Link>
        </div>
      </div>

      <MenuEditor
        restaurantId={id}
        categories={categories}
        items={items}
        createCategory={createCategory.bind(null, menuId ?? "")}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
        moveCategory={moveCategory}
        createItem={createItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
        moveItem={moveItem}
        toggleItemStatus={toggleItemStatus}
        uploadItemImage={uploadItemImage}
        removeItemImage={removeItemImage}
      />
    </div>
  );
}