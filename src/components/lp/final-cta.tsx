import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-5 py-28 text-center sm:px-8">
        <p className="text-[0.6875rem] font-semibold tracking-[0.25em] text-primary-foreground/70">
          ARIGATOMENU
        </p>
        <h2 className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl">
          メニューを、来てもらう理由に。
        </h2>
        <p className="max-w-xl text-pretty text-[0.9375rem] leading-7 text-primary-foreground/80">
          来店客に安心を、店に自由を。
          最初の一杯分の時間で、あなたの店の新しいメニューをつくりましょう。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className={buttonVariants({
              size: "lg",
              className:
                "h-12 bg-foreground px-8 text-background hover:bg-foreground/90",
            })}
          >
            無料ではじめる
          </Link>
        </div>
        <p className="text-xs font-medium text-primary-foreground/70">
          クレジットカード不要・初期費用ゼロ
        </p>
      </div>
    </section>
  );
}