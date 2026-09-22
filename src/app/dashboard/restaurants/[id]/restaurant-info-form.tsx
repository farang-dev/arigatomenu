"use client";

import { useActionState, useState } from "react";
import { Check, Globe2, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/dashboard/actions";

type LangTab = "ja" | "en" | "zh" | "ko";

const LANGS: { key: LangTab; label: string; flag: string; native: string }[] = [
  { key: "ja", label: "日本語", flag: "🇯🇵", native: "標準 / メイン" },
  { key: "en", label: "English", flag: "🇬🇧", native: "英語" },
  { key: "zh", label: "中文", flag: "🇨🇳", native: "中国語（簡体字）" },
  { key: "ko", label: "한국어", flag: "🇰🇷", native: "韓国語" },
];

export function RestaurantInfoForm({
  restaurant,
  translationDefaults,
  action,
}: {
  restaurant: {
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    slug: string;
  };
  translationDefaults: Record<string, Record<string, string>>;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [activeTab, setActiveTab] = useState<LangTab>("ja");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  const t = (lang: string, field: string) => translationDefaults[lang]?.[field] ?? "";

  const hasTranslation = (lang: string) => {
    return Boolean(t(lang, "name") || t(lang, "tagline") || t(lang, "description"));
  };

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-6 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div>
          <p className="font-serif text-base font-bold text-foreground">店舗基本情報・多言語設定</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            言語ごとに店名・キャッチコピー・紹介文を設定できます。
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/30 p-1">
          {LANGS.map((tab) => {
            const isFilled = tab.key === "ja" || hasTranslation(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.flag}</span>
                <span>{tab.label}</span>
                {isFilled && tab.key !== "ja" && (
                  <span className="size-1.5 rounded-full bg-accent" title="入力済み" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <input type="hidden" name="slug" value={restaurant.slug} />

      {/* Japanese (Canonical) Fields */}
      <div className={cn("space-y-4", activeTab === "ja" ? "block" : "hidden")}>
        <div className="grid gap-1.5">
          <Label htmlFor="name">
            店名（日本語） <span className="text-primary">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={restaurant.name}
            placeholder="例: 麺や 青柳"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tagline">キャッチコピー（日本語・任意）</Label>
          <Input
            id="tagline"
            name="tagline"
            defaultValue={restaurant.tagline ?? ""}
            placeholder="例: 毎日打ちたての自家製麺と煮干し出汁"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="description">店の紹介・こだわり（日本語・任意）</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={restaurant.description ?? ""}
            placeholder="店の歴史やこだわり、おすすめの楽しみ方などをお書きください。"
            className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Foreign Language Tabs (Always rendered in DOM for FormData) */}
      {(["en", "zh", "ko"] as const).map((lang) => {
        const info = LANGS.find((l) => l.key === lang)!;
        return (
          <div
            key={lang}
            className={cn("space-y-4", activeTab === lang ? "block" : "hidden")}
          >
            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2 border border-border/50">
              <Globe2 size={15} className="text-primary shrink-0" />
              <span>
                {info.flag} {info.label} ({info.native}) の表示情報です。未入力の場合は日本語の内容が表示されます。
              </span>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`name_${lang}`}>店名 ({info.label})</Label>
              <Input
                id={`name_${lang}`}
                name={`name_${lang}`}
                defaultValue={t(lang, "name")}
                placeholder={`例: ${lang === "en" ? "Menya Aoyagi Ramen" : lang === "zh" ? "青柳拉面馆" : "멘야 아오야기"}`}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`tagline_${lang}`}>キャッチコピー ({info.label})</Label>
              <Input
                id={`tagline_${lang}`}
                name={`tagline_${lang}`}
                defaultValue={t(lang, "tagline")}
                placeholder={`例: ${lang === "en" ? "Handcrafted noodles & rich dashi broth" : lang === "zh" ? "每日新鲜手作拉面与秘制高汤" : "매일 직접 뽑는 수제 면과 진한 육수"}`}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`description_${lang}`}>店の紹介 ({info.label})</Label>
              <textarea
                id={`description_${lang}`}
                name={`description_${lang}`}
                rows={3}
                defaultValue={t(lang, "description")}
                placeholder={`About the restaurant in ${info.label}...`}
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground"
              />
            </div>
          </div>
        );
      })}

      {state?.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {state && !state.error && (
        <p className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary">
          <Check size={14} /> 店舗情報を保存しました。公開メニューと印刷メニューに反映されます。
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <Button type="submit" disabled={pending} size="default" className="font-bold shadow-xs">
          {pending ? "保存中…" : "店舗情報を保存する"}
        </Button>

        <span className="text-[0.6875rem] text-muted-foreground">
          右上の「AIで翻訳」で英・中・韓を一括自動翻訳することもできます
        </span>
      </div>
    </form>
  );
}