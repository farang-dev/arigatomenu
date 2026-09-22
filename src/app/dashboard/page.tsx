import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient, type DashboardRestaurantItem } from "./dashboard-client";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

function publicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/r/${slug}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, tagline, slug, is_published, logo_url, updated_at, created_at")
    .order("created_at", { ascending: false });

  const restaurantIds = (restaurants ?? []).map((r) => r.id);

  let restaurantItems: DashboardRestaurantItem[] = [];

  if (restaurantIds.length > 0) {
    const { data: menus } = await supabase
      .from("menus")
      .select("id, restaurant_id")
      .in("restaurant_id", restaurantIds);

    const menuIds = (menus ?? []).map((m) => m.id);
    const menuByRestaurant = new Map<string, string>();
    for (const m of menus ?? []) {
      menuByRestaurant.set(m.restaurant_id, m.id);
    }

    const catCountByMenu = new Map<string, number>();
    const itemCountByMenu = new Map<string, number>();
    const availableCountByMenu = new Map<string, number>();

    if (menuIds.length > 0) {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, menu_id")
        .in("menu_id", menuIds)
        .is("parent_id", null);

      const catIds = (cats ?? []).map((c) => c.id);
      for (const c of cats ?? []) {
        catCountByMenu.set(c.menu_id, (catCountByMenu.get(c.menu_id) ?? 0) + 1);
      }

      if (catIds.length > 0) {
        const { data: items } = await supabase
          .from("menu_items")
          .select("id, category_id, status")
          .in("category_id", catIds);

        const catToMenu = new Map<string, string>();
        for (const c of cats ?? []) {
          catToMenu.set(c.id, c.menu_id);
        }

        for (const item of items ?? []) {
          const mId = catToMenu.get(item.category_id);
          if (mId) {
            itemCountByMenu.set(mId, (itemCountByMenu.get(mId) ?? 0) + 1);
            if (item.status === "available") {
              availableCountByMenu.set(mId, (availableCountByMenu.get(mId) ?? 0) + 1);
            }
          }
        }
      }
    }

    restaurantItems = (restaurants ?? []).map((r) => {
      const mId = menuByRestaurant.get(r.id);
      return {
        id: r.id,
        name: r.name,
        tagline: r.tagline,
        slug: r.slug,
        isPublished: r.is_published,
        logoUrl: r.logo_url,
        updatedAt: r.updated_at,
        categoryCount: mId ? catCountByMenu.get(mId) ?? 0 : 0,
        itemCount: mId ? itemCountByMenu.get(mId) ?? 0 : 0,
        availableCount: mId ? availableCountByMenu.get(mId) ?? 0 : 0,
        publicUrl: publicUrl(r.slug),
      };
    });
  }

  return (
    <DashboardClient
      userEmail={user.email ?? "店舗管理者"}
      restaurants={restaurantItems}
    />
  );
}