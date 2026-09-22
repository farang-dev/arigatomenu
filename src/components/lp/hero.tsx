import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-[2.75rem] font-black leading-[1.14] tracking-tight sm:text-6xl sm:leading-[1.12] lg:text-[4rem]">
            <span className="text-primary">紙のメニューを、</span>
            <br />
            もっと自由に。
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-[0.9375rem] leading-7 text-muted-foreground sm:text-base">
            テーブルの QR を読むだけで、多言語・写真・アレルギー情報つきの
            メニューが開きます。注文も会計も今までどおり。変わるのは、メニューを
            伝える<span className="font-bold text-foreground">自由さ</span>だけです。
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg", className: "h-12 px-7" })}
            >
              無料ではじめる
            </Link>
            <Link
              href="#features"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-12 px-7",
              })}
            >
              できることを詳しく
            </Link>
          </div>
          <p className="mt-5 text-xs font-medium text-muted-foreground">
            無料プランから。クレジットカード不要
          </p>
        </div>
      </div>
    </section>
  );
}
