const faqs = [
  {
    q: "注文システムやモバイルオーダーとは、どう違うの？",
    a: "当サービスは「メニューを見せる」ためのものです。注文の受け付けや決済は行いません。注文は呼び込み・端末など、いまの方法のまま。オペレーションは一切変わりません。",
  },
  {
    q: "日本語以外の原稿を用意する必要がある？",
    a: "ありません。日本語で登録した内容を自動で翻訳します（英語・中国語・韓国語）。追加料金も発生しません。お客さまには、最初から自国の言語で表示されます。",
  },
  {
    q: "紙のメニューは、どうするの？",
    a: "同じデータからA4・A5の印刷用PDFを出力できます。スマートフォンを使わないお客さまに渡す紙メニューとして、そのままご利用いただけます。",
  },
  {
    q: "QRコードは、どうやって使うの？",
    a: "店専用のURLとQRコードを、その場で発行します。印刷してテーブル・入口・伝票に置くだけです。読み取ったお客さまのスマホに、メニューが表示されます。",
  },
  {
    q: "始めるのに、どれくらいかかる？",
    a: "アカウント登録はメールアドレスだけで、クレジットカードは不要です。現在は無料でお使いいただけます。有料プランへの切り替えを検討する際は、事前にお知らせいたします。",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-y border-border bg-muted">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-xs font-bold tracking-widest text-primary">
            06 · FAQ
          </p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            <span className="text-primary">よくある</span>質問
          </h2>
        </div>
        <div className="mt-14 flex max-w-2xl flex-col gap-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-[26px] border border-border bg-card px-7 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {f.q}
                <span className="text-primary transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-md text-[0.8125rem] leading-6 text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}