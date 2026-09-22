import { Globe, QrCode, Printer } from "lucide-react";

const uses = [
  {
    icon: QrCode,
    title: "店内用 — QRコードを置く",
    text: "テーブルのQRを読むだけ。アプリも、追加の機器も、要りません。スマホの画面に写真つきのメニューが開きます。",
  },
  {
    icon: Globe,
    title: "Web用 — 店のページとして公開",
    text: "メニューのURLを公開すれば、それ自体が店のWebメニューに。ホームページ、Googleマップ、SNSにも貼れます。",
  },
  {
    icon: Printer,
    title: "紙用 — 同じデータから印刷",
    text: "同じ原稿からA4・A5の印刷用PDFを出力。スマホを使わないお客さまにも渡せます。作り直しは不要です。",
  },
];

export function OneMenuEverywhere() {
  return (
    <section id="usage" className="border-y border-border bg-muted">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-xs font-bold tracking-widest text-primary">
            03 · USAGE
          </p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            <span className="text-primary">ひとつのメニューを、</span>
            3つの場所で
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {uses.map((u, i) => (
            <div
              key={u.title}
              className="flex flex-col gap-4 rounded-[26px] border border-border bg-card p-7"
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    i % 2 === 0
                      ? "grid size-10 place-items-center rounded-[26px] bg-primary/10 text-primary"
                      : "grid size-10 place-items-center rounded-[26px] bg-accent/10 text-accent"
                  }
                >
                  <u.icon size={18} strokeWidth={2} />
                </span>
                <span className="text-xs font-bold tracking-widest text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-base font-bold">{u.title}</h3>
              <p className="text-[0.8125rem] leading-6 text-muted-foreground">
                {u.text}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[0.6875rem] font-semibold tracking-[0.25em] text-muted-foreground">
          IN-STORE · WEB · PRINT — ONE MENU
        </p>
      </div>
    </section>
  );
}