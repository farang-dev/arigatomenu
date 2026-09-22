import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "無料ではじめる",
};

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">無料ではじめる</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        クレジットカード不要。メールとパスワードだけで登録できます。
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          ログイン
        </Link>
      </p>
    </>
  );
}