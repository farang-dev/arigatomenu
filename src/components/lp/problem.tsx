const problems = [
  {
    num: "01",
    title: "ことばの壁",
    text: "英語・中文・한국어のメニューをそろえても、更新のたびに作り直しになる。来てくれるお客さまの言語は、ひとつではない。",
  },
  {
    num: "02",
    title: "写真が伝わらない",
    text: "紙ではすすめたい料理の写真や、香りや食感を伝えきれない。「これを看板にしたい」は、紙には描けない。",
  },
  {
    num: "03",
    title: "「食べられない」の不安",
    text: "甲殻類や乳、そば。知りたいお客さまにとって、アレルゲン情報はあって当然。小さな活字では、安心に届かない。",
  },
  {
    num: "04",
    title: "変わるスピード",
    text: "本日のおすすめ、数量限定、季節の一品。紙に書けば、捨てることになる。いちばん伝えたい情報が、いちばん頻繁に変わる。",
  },
  {
    num: "05",
    title: "刷り直しのコスト",
    text: "価格改定、仕入れの変化、閉店時間。そのたびに印刷し直す手間と在庫とコストは、静かに積み重なっていく。",
  },
];

export function Problem() {
  return (
    <section id="problem" className="border-y border-border bg-muted">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-xs font-bold tracking-[0.25em] text-primary">
            PROBLEMS
          </p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            <span className="text-primary">紙のメニューには、</span>
            限界がある
          </h2>
        </div>
        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {problems.map((p) => (
            <li
              key={p.num}
              className="grid grid-cols-[auto_1fr] gap-x-5 rounded-[26px] border border-border bg-card p-7"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-sm font-black text-background">
                {p.num}
              </span>
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-2 max-w-md text-[0.8125rem] leading-6 text-muted-foreground">
                  {p.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}