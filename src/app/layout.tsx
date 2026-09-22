import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "ArigatoMenu | 紙のメニューを、もっと自由に。",
    template: "%s · ArigatoMenu",
  },
  description:
    "多言語・写真・検索・アレルギー情報をひとつのメニューに。登録したメニューは、Web・QR・紙の印刷まで同じデータから生まれます。インバウンドにちゃんと伝わる、レストランのためのデジタルメニュー。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}