import type { Metadata } from "next";
import Link from "next/link";
import { createRestaurant } from "@/app/dashboard/actions";
import { NewRestaurantForm } from "./new-restaurant-form";

export const metadata: Metadata = {
  title: "レストランを追加",
};

export default function NewRestaurantPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-border/60 pb-6">
        <Link
          href="/dashboard"
          className="text-xs tracking-widest text-muted-foreground"
        >
          ← ダッシュボード
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight">
          レストランを追加
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          まずは店の名前とURLだけ。メニューは次の画面で入力できます。
        </p>
      </div>
      <NewRestaurantForm action={createRestaurant} />
    </div>
  );
}