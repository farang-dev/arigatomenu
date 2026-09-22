import {
  Languages,
  Leaf,
  Image,
  Search,
  Zap,
  ReceiptText,
} from "lucide-react";

const features = [
  {
    en: "Update in seconds",
    ja: "更新は、そのまま反映される",
    text: "値上げ・売り切れ・新商品・本日のおすすめ。ダッシュボードで直せば、サイトとQRの中身がすぐ変わります。刷り直しの手配も、手書きの貼り紙もいりません。",
    icon: Zap,
  },
  {
    en: "Write in Japanese, born in 5 languages",
    ja: "書き下ろしは、日本語だけでいい",
    text: "商品は日本語で登録するだけ。英語・中国語（簡体／繁体）・韓国語に自動で翻訳され、お客さまには最初から自国の言語で表示されます。原稿を何言語も用意する必要はありません。",
    icon: Languages,
  },
  {
    en: "Allergens & dietary needs",
    ja: "「食べられない」を理由に、帰らせない",
    text: "アレルゲンを明示。ビーガン・ハラール・グルテンフリーは、チップひとつで絞り込めます。伝えそびれによる事故も、機会の取りこぼしも防ぎます。",
    icon: Leaf,
  },
  {
    en: "Find it fast",
    ja: "品数が多くても、迷わせない",
    text: "料理名を打てば、その商品へすぐたどり着けます。多言語のメニューを探し回る手間もいっしょに消えます。",
    icon: Search,
  },
  {
    en: "Photos that sell",
    ja: "おすすめの一皿が、注文の決め手になる",
    text: "写真は一皿のいちばんの情報源です。複数枚の掲載、拡大表示、詳しい説明まで。紙では伝えられない魅力を、そのまま見せられます。",
    icon: Image,
  },
  {
    en: "Your operations stay the same",
    ja: "注文も会計も、今までどおり",
    text: "私たちの仕事は「メニューを見せること」だけ。注文の集計も、呼び出しも、会計も、いまの運用のままで大丈夫です。",
    icon: ReceiptText,
  },
];

export function DigitalAdvantage() {
  return (
    <section id="features" className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-xs font-bold tracking-widest text-primary">
            02 · FEATURES
          </p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            <span className="text-primary">デジタルなら、</span>
            もっとできる
          </h2>
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <li
              key={f.en}
              className="group flex flex-col gap-4 rounded-[26px] border border-border bg-card p-7"
            >
              <div
                className={
                  i % 2 === 0
                    ? "grid size-11 place-items-center rounded-[26px] bg-primary/10 text-primary"
                    : "grid size-11 place-items-center rounded-[26px] bg-accent/10 text-accent"
                }
              >
                <f.icon size={20} strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[0.625rem] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  {f.en}
                </p>
                <h3 className="text-[0.9375rem] font-bold">{f.ja}</h3>
              </div>
              <p className="text-[0.8125rem] leading-6 text-muted-foreground">
                {f.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}