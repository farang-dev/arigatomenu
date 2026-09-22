import { cn } from "@/lib/utils";

export function PhoneMock({ className }: { className?: string }) {
  return (
    <div className={cn("w-60 max-w-full", className)} aria-hidden>
      <div className="rounded-[26px] border border-border bg-white p-1.5">
        <div className="overflow-hidden rounded-[1.25rem] bg-white px-4 pb-4 pt-4">
          {/* brand row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-[26px] bg-foreground text-[0.625rem] font-black text-background">
                麺
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[0.6875rem] font-bold">麺や 青柳</p>
                <p className="text-[0.5rem] text-muted-foreground">
                  24品 · 多言語
                </p>
              </div>
            </div>
            <span className="rounded-full border border-border bg-card px-1.5 py-0.5 text-[0.4375rem] font-semibold">
              EN
            </span>
          </div>

          {/* featured */}
          <div className="mt-3 rounded-[26px] bg-accent/15 px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[0.5625rem] font-bold text-accent">おすすめ</p>
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.4375rem] font-bold text-accent-foreground">
                chef&apos;s choice
              </span>
            </div>
            <div className="mt-2 grid place-items-center rounded-[26px] bg-accent/90 py-4">
              <span className="text-4xl font-black text-accent-foreground">麺</span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <p className="text-[0.625rem] font-bold">特製 濃厚白湯ラーメン</p>
              <p className="text-[0.6875rem] font-black">¥1,500</p>
            </div>
          </div>

          {/* list */}
          <div className="mt-9">
            <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
              <p className="text-[0.5rem] font-bold tracking-[0.15em] text-muted-foreground">
                麺 · NOODLE
              </p>
              <p className="text-[0.5rem] font-medium text-muted-foreground">6品</p>
            </div>
            <ul className="divide-y divide-border/70">
              {[
                { n: "旨辛味噌ラーメン", d: "自家製味噌と芝麻醤", p: "¥1,100", veg: true },
                { n: "焦がし醤油ラーメン", d: "強火の香り", p: "¥1,000", v: false },
              ].map((f) => (
                <li key={f.n} className="flex items-center gap-2.5 py-2.5">
                  {f.veg ? (
                    <span className="grid size-13 shrink-0 place-items-center rounded-[26px] border border-border text-[0.625rem] text-muted-foreground">
                      麺
                    </span>
                  ) : (
                    <span className="grid size-13 shrink-0 place-items-center rounded-[26px] bg-muted text-[0.625rem] text-muted-foreground">
                      麺
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.625rem] font-bold">{f.n}</p>
                    <p className="truncate text-[0.5rem] text-muted-foreground">{f.d}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.625rem] font-black">{f.p}</p>
                    {f.veg && (
                      <p className="text-[0.375rem] font-bold text-accent">VEGETARIAN</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["全部", "麺", "ごはん", "アレルギーフォロー"].map((c, i) => (
              <span
                key={c}
                className={
                  i === 0
                    ? "rounded-full bg-foreground px-2 py-0.5 text-[0.4375rem] font-bold text-background"
                    : "rounded-full border border-border px-2 py-0.5 text-[0.4375rem] font-medium"
                }
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}