"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { ComponentProps } from "react";
import { Globe, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/app/dashboard/actions";

export function NewRestaurantForm({
  action,
}: {
  action: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
}) {
  const [slugValue, setSlugValue] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  const handleSlugChange = (val: string) => {
    // Auto-clean to lowercase letters, numbers, and hyphens
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    setSlugValue(cleaned);
  };

  return (
    <form
      action={formAction}
      className="grid max-w-xl gap-5 rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-2xs"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="name">
          店名（日本語） <span className="text-primary">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="例: 麺や 青柳"
          required
          autoFocus
        />
        <p className="text-[0.6875rem] text-muted-foreground">
          英語・中国語・韓国語の表示名は後から追加できます。
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="slug">
          店舗専用メニューURL <span className="text-primary">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-2 rounded-xl border border-border/60">
            /r/
          </span>
          <Input
            id="slug"
            name="slug"
            value={slugValue}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="menya-aoyagi"
            pattern="[a-z0-9-]+"
            required
            className="font-mono"
          />
        </div>
        {slugValue && (
          <p className="flex items-center gap-1.5 text-xs text-primary font-mono mt-0.5">
            <Globe size={13} /> 公開URL: arigatomenu.com/r/{slugValue}
          </p>
        )}
        <p className="text-[0.6875rem] text-muted-foreground">
          半角英数字とハイフン。QRコードの読み取り先URLになります。
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tagline">キャッチコピー（任意）</Label>
        <Input
          id="tagline"
          name="tagline"
          placeholder="例: 毎日自家製麺を打っています"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">店の紹介・こだわり（任意）</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="店のこだわりや看板メニュー、営業時間などをお書きください。"
          className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="pt-2 border-t border-border/50">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto font-bold shadow-xs gap-2"
        >
          <Sparkles size={16} /> {pending ? "作成しています…" : "レストランを作成してメニュー登録へ"}
        </Button>
      </div>
    </form>
  );
}

export type NewRestaurantFormProps = ComponentProps<typeof NewRestaurantForm>;