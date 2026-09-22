import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "ログイン",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">おかえりなさい</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        アカウントにログインして、メニューを管理しましょう。
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        はじめてですか？{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          無料でアカウントをつくる
        </Link>
      </p>
    </>
  );
}