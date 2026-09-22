import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PrintMenuView,
  type PrintCategory,
  type PrintLocale,
  type PrintRestaurant,
} from "./print-menu-view";

export const metadata: Metadata = {
  title: "印刷用メニュー",
};

function publicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/r/${slug}`;
}

export default async function PrintMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;
  const locale: PrintLocale =
    lang === "en" || lang === "zh" || lang === "ko" ? lang : "ja";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, tagline, description, logo_url, slug")
    .eq("id", id)
    .single();
  if (!restaurant) notFound();
  const ownerCheck = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ownerCheck.data) notFound();

  const restaurantInfo: PrintRestaurant = {
    name: restaurant.name,
    tagline: restaurant.tagline,
    description: restaurant.description,
    logoUrl: restaurant.logo_url,
  };
  if (locale !== "ja") {
    const { data: rt } = await supabase
      .from("restaurant_translations")
      .select("name, tagline, description")
      .eq("restaurant_id", id)
      .eq("locale", locale)
      .maybeSingle();
    if (rt) {
      restaurantInfo.name = rt.name || restaurant.name;
      restaurantInfo.tagline = rt.tagline ?? restaurant.tagline;
      restaurantInfo.description = rt.description ?? restaurant.description;
    }
  }

  const categories: PrintCategory[] = [];

  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", id)
    .order("position")
    .limit(1);
  const menuId = menus?.[0]?.id;

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
      .select("category_id, name")
      .in("category_id", categoryIds)
      .eq("locale", locale);
    const catNameByCat = new Map<string, string>();
    for (const row of catTrans ?? []) catNameByCat.set(row.category_id, row.name);

    const itemsByCategory = new Map<string, PrintCategory["items"]>();
    if (categoryIds.length) {
      const { data: rawItems } = await supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, price_note, status")
        .in("category_id", categoryIds)
        .order("position")
        .order("created_at");
      const itemIds = (rawItems ?? []).map((i) => i.id);

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
      const transByItem = new Map<string, { name: string; description: string | null }>();
      for (const row of trRes.data ?? []) {
        if (row.locale === locale) {
          transByItem.set(row.item_id, {
            name: row.name,
            description: row.description,
          });
        }
      }

      for (const it of rawItems ?? []) {
        const t = transByItem.get(it.id);
        const item: PrintCategory["items"][number] = {
          id: it.id,
          name: (locale === "ja" ? (it.name as string) : (t?.name ?? (it.name as string))),
          description: (locale === "ja" ? ((it.description as string) ?? "") : (t?.description ?? ((it.description as string) ?? ""))),
          price: Number(it.price),
          priceNote: it.price_note ?? "",
          status: it.status as PrintCategory["items"][number]["status"],
          dietary: dietaryByItem.get(it.id) ?? [],
          allergens: allergensByItem.get(it.id) ?? [],
        };
        itemsByCategory.set(it.category_id, [
          ...(itemsByCategory.get(it.category_id) ?? []),
          item,
        ]);
      }
    }

    for (const c of cats ?? []) {
      const name =
        locale === "ja" ? (c.name as string) : (catNameByCat.get(c.id) ?? (c.name as string));
      categories.push({
        id: c.id,
        name,
        items: itemsByCategory.get(c.id) ?? [],
      });
    }
  }

  const url = publicUrl(restaurant.slug);

  return (
    <PrintMenuView
      restaurant={restaurantInfo}
      categories={categories}
      locale={locale}
      restaurantId={id}
      url={url}
    />
  );
}