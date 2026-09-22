import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView, type PublicCategory, type PublicItem } from "./menu-view";

export const metadata: Metadata = {
  title: "ArigatoMenu",
};

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale = lang === "en" || lang === "zh" || lang === "ko" ? lang : "ja";

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, tagline, description, is_published, updated_at, slug, logo_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  if (!restaurant.is_published) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-serif text-xl font-bold tracking-tight">
            Arigato<span className="text-primary">Menu</span>
          </p>
          <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            このメニューはただいま公開準備中です。
          </p>
        </div>
      </div>
    );
  }

  const { data: menus } = await supabase
    .from("menus")
    .select("id, name")
    .eq("restaurant_id", restaurant.id)
    .order("position")
    .limit(1);
  const menuId = menus?.[0]?.id;

  const { data: restaurantTrans } = await supabase
    .from("restaurant_translations")
    .select("locale, name, tagline, description")
    .eq("restaurant_id", restaurant.id);
  const restaurantTransByLocale = new Map<string, { name: string | null; tagline: string | null; description: string | null }>();
  for (const tr of restaurantTrans ?? []) {
    restaurantTransByLocale.set(tr.locale, tr);
  }

  const LANGUAGE_OFF = locale !== "ja";
  const rt = LANGUAGE_OFF ? restaurantTransByLocale.get(locale) : undefined;

  const categories: PublicCategory[] = [];
  if (menuId) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .eq("menu_id", menuId)
      .is("parent_id", null)
      .order("position")
      .order("created_at");
    const categoryIds = (cats ?? []).map((c) => c.id);

    const { data: catTrans } = await supabase
      .from("category_translations")
      .select("category_id, locale, name")
      .in("category_id", categoryIds);
    const catTransByCat = new Map<string, Record<string, string>>();
    for (const row of catTrans ?? []) {
      catTransByCat.set(row.category_id, {
        ...(catTransByCat.get(row.category_id) ?? {}),
        [String(row.locale)]: row.name,
      });
    }

    let rawItems: Array<Record<string, unknown>> = [];
    if (categoryIds.length) {
      const { data } = await supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, price_note, status, position")
        .in("category_id", categoryIds)
        .order("position")
        .order("created_at");
      rawItems = (data ?? []) as unknown as Array<Record<string, unknown>>;
    }

    const itemIds = rawItems.map((i) => i.id as string);
    const [dlRes, alRes, trRes] = await Promise.all([
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
    ]);

    const dietaryByItem = new Map<string, string[]>();
    for (const row of dlRes.data ?? []) {
      dietaryByItem.set(row.item_id, [...(dietaryByItem.get(row.item_id) ?? []), row.label_id]);
    }
    const allergensByItem = new Map<string, string[]>();
    for (const row of alRes.data ?? []) {
      allergensByItem.set(row.item_id, [...(allergensByItem.get(row.item_id) ?? []), row.allergen_id]);
    }
    const transByItem = new Map<string, Record<string, { name: string; description: string | null }>>();
    for (const row of trRes.data ?? []) {
      const m = transByItem.get(row.item_id) ?? {};
      m[row.locale] = { name: row.name, description: row.description };
      transByItem.set(row.item_id, m);
    }

    const itemsByCategory = new Map<string, PublicItem[]>();
    for (const raw of rawItems) {
      const id = raw.id as string;
      const translations = transByItem.get(id) ?? {};
      const t = translations[locale];

      const item: PublicItem = {
        id,
        name: LANGUAGE_OFF
          ? t?.name || (raw.name as string)
          : (raw.name as string),
        description: LANGUAGE_OFF
          ? t?.description ?? ((raw.description as string) ?? "")
          : ((raw.description as string) ?? ""),
        price: Number(raw.price),
        priceNote: LANGUAGE_OFF ? "" : ((raw.price_note as string) ?? ""),
        status: (raw.status as string) as PublicItem["status"],
        dietary: dietaryByItem.get(id) ?? [],
        allergens: allergensByItem.get(id) ?? [],
        translations,
      };
      const catId = raw.category_id as string;
      itemsByCategory.set(catId, [...(itemsByCategory.get(catId) ?? []), item]);
    }

    for (const c of cats ?? []) {
      const tName = LANGUAGE_OFF
        ? catTransByCat.get(c.id)?.[locale] ?? (c.name as string)
        : (c.name as string);
      categories.push({
        id: c.id,
        name: tName,
        items: itemsByCategory.get(c.id) ?? [],
      });
    }
  }

  return (
    <MenuView
      restaurant={{
        name: LANGUAGE_OFF ? rt?.name || restaurant.name : restaurant.name,
        tagline: LANGUAGE_OFF ? rt?.tagline ?? null : restaurant.tagline,
        description: LANGUAGE_OFF ? rt?.description ?? null : restaurant.description,
        updatedAt: restaurant.updated_at,
        logoUrl: restaurant.logo_url,
      }}
      locale={locale}
      categories={categories}
    />
  );
}