export function formatPrice(
  value: number | string | null | undefined,
  locale: "ja" | "en" | "zh" | "ko" = "ja",
): string {
  const n = Number(value ?? 0);
  const formatted = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : "ko-KR",
  ).format(n);
  return locale === "ja" ? `${formatted}円` : `¥${formatted}`;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}