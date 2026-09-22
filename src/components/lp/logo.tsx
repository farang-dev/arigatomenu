import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** フッター向け。マークを大きく、キャプションを添える。 */
  variant?: "header" | "footer";
};

export function Logo({ className, variant = "header" }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {variant === "footer" && (
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-[26px] bg-primary text-2xl font-black text-background"
        >
          あ
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-black tracking-tight",
            variant === "header" ? "text-lg" : "text-xl",
          )}
        >
          Arigato
          <span className="text-primary">Menu</span>
        </span>
        {variant === "footer" && (
          <span className="mt-1 text-[0.6875rem] font-medium text-muted-foreground">
            ありがとうメニュー
          </span>
        )}
      </span>
    </span>
  );
}