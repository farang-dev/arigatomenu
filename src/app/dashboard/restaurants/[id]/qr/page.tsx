import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QrStudioView, type QrStudioRestaurant } from "./qr-studio-view";

export const metadata: Metadata = {
  title: "卓上POP・QRステッカー作成スタジオ",
};

function publicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/r/${slug}`;
}

export default async function QrStudioPage({
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
    .select("id, name, tagline, description, slug, logo_url, is_published, qr_dark, qr_light, qr_error_correction, owner_id")
    .eq("id", id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    notFound();
  }

  const url = publicUrl(restaurant.slug);

  const restaurantInfo: QrStudioRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    tagline: restaurant.tagline,
    description: restaurant.description,
    slug: restaurant.slug,
    logoUrl: restaurant.logo_url,
    isPublished: restaurant.is_published,
    initialDark: restaurant.qr_dark ?? "#1B1B1B",
    initialLight: restaurant.qr_light ?? "#FFFFFF",
    initialEc: restaurant.qr_error_correction ?? "Q",
    url,
  };

  return <QrStudioView restaurant={restaurantInfo} />;
}
