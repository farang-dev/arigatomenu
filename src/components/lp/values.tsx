import { Check } from "lucide-react";

const steps = [
  {
    title: "登録する",
    text: "メールアドレスとパスワードだけ。クレジットカードは不要です。",
  },
  {
    title: "メニューを入れる",
    text: "いまの紙を見ながら入力しても、CSVで一括投入してもかまいません。",
  },
  {
    title: "公開する",
    text: "店専用のURLとQRコードが、その場で発行されます。",
  },
  {
    title: "おくだけ",
    text: "テーブルに、入口に。置くだけで、来店客のメニュー体験が変わります。",
  },
];

const themes = ["和", "現代的", "上品", "温かい", "カジュアル"];

export function Values() {
  return (
    <>
      <section id="guide">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="text-xs font-bold tracking-widest text-primary">
              04 · GUIDE
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              <span className="text-primary">導入は、</span>
              これだけ
            </h2>
          </div>
          <ol className="mt-14 grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-5 rounded-[26px] border border-border bg-card p-7"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-black text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1.5 max-w-sm text-[0.8125rem] leading-6 text-muted-foreground">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-24 grid gap-x-14 gap-y-10 border-t border-border pt-14 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-5">
              <p className="text-xs font-bold tracking-widest text-accent">
                05 · YOUR STYLE
              </p>
              <div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  <span className="text-primary">あなたの店の色で、</span>
                  迎える
                </h2>
                <p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-muted-foreground">
                  テーマを選ぶだけでは終わりません。アクセント、背景、書体まで、
                  あなたの店の顔に合わせて整えられます。
                  <span className="mt-3 block font-bold text-foreground">
                    パッケージらしさは、残しません。
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-5 rounded-[26px] border border-border bg-card p-8 lg:max-w-xs">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-foreground">麺や 青柳</p>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.625rem] font-bold text-primary">
                  theme · 和
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-card px-3 py-1 text-[0.6875rem] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                {["#A4272E", "#C68A2E", "#2E5444", "#7A613F"].map((c) => (
                  <span
                    key={c}
                    className="size-7 rounded-full border border-foreground/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className="ml-2 flex items-center gap-1 text-[0.625rem] font-medium text-muted-foreground">
                  <Check size={12} strokeWidth={2} />
                  背景・文字色も可
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}