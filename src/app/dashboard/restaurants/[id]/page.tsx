import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, PencilLine, Printer, QrCode, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deleteRestaurant,
  removeRestaurantLogo,
  setRestaurantPublished,
  translateMenu,
  updateQrDesign,
  updateRestaurant,
  uploadRestaurantLogo,
} from "@/app/dashboard/actions";
import { RestaurantInfoForm } from "./restaurant-info-form";
import { RestaurantLogoForm } from "./restaurant-logo-form";
import { PublishButton, DeleteButton } from "./publish-button";
import { QrCard } from "./qr-card";
import { TranslateMenuButton } from "./menu/translate-menu-button";

export const metadata: Metadata = {
  title: "レストラン管理",
};

function publicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/r/${slug}`;
}

export default async function RestaurantDetailPage({
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
    .select("*")
    .eq("id", id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    notFound();
  }

  const { data: restaurantTranslations } = await supabase
    .from("restaurant_translations")
    .select("locale, name, tagline, description")
    .eq("restaurant_id", id);
  const translationDefaults = {
    en: {},
    zh: {},
    ko: {},
  } as Record<string, Record<string, string>>;
  for (const tr of restaurantTranslations ?? []) {
    translationDefaults[tr.locale] = {
      name: tr.name ?? "",
      tagline: tr.tagline ?? "",
      description: tr.description ?? "",
    };
  }

  const url = publicUrl(restaurant.slug);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6 print:hidden">
        <div>
          <Link
            href="/dashboard"
            className="text-xs tracking-widest text-muted-foreground"
          >
            ← ダッシュボード
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Store size={14} /> 店舗管理
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-[0.8125rem]")}
          >
            <ExternalLink size={13} /> 公開メニューを見る
          </Link>
          <Link
            href={`/dashboard/restaurants/${id}/menu`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-[0.8125rem]")}
          >
            <PencilLine size={13} /> メニューを編集
          </Link>
          <Link
            href={`/dashboard/restaurants/${id}/print`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-[0.8125rem]")}
          >
            <Printer size={13} /> 印刷用紙メニュー
          </Link>
          <Link
            href={`/dashboard/restaurants/${id}/qr`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "text-[0.8125rem] font-bold shadow-xs")}
          >
            <QrCode size={13} /> 卓上POP・QRステッカー
          </Link>
          <TranslateMenuButton action={translateMenu.bind(null, id)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-6 print:hidden">
          <RestaurantLogoForm
            logoUrl={restaurant.logo_url}
            uploadAction={uploadRestaurantLogo.bind(null, id)}
            removeAction={removeRestaurantLogo.bind(null, id)}
          />
          <RestaurantInfoForm
            restaurant={restaurant}
            translationDefaults={translationDefaults}
            action={updateRestaurant.bind(null, id)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <PublishButton
              published={restaurant.is_published}
              action={setRestaurantPublished.bind(
                null,
                id,
                !restaurant.is_published,
              )}
            />
            <DeleteButton action={deleteRestaurant.bind(null, id)} />
          </div>
        </div>

        <div className="lg:w-80">
          <QrCard
            restaurantId={id}
            url={url}
            slug={restaurant.slug}
            isPublished={restaurant.is_published}
            initialDark={restaurant.qr_dark ?? "#1B1B1B"}
            initialLight={restaurant.qr_light ?? "#FFFFFF"}
            saveAction={updateQrDesign.bind(null, id)}
          />
        </div>
      </div>
    </div>
  );
}