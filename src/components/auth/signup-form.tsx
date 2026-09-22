"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled — straight into the dashboard.
      router.push("/dashboard");
      router.refresh();
    } else {
      // Confirmation email sent.
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="grid gap-3 text-center">
        <p className="text-3xl">📬</p>
        <p className="font-semibold">確認メールを送信しました</p>
        <p className="text-sm text-muted-foreground">
          メールに記載のリンクから、アカウントを確認してください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">お名前</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="山田 花子"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@restaurant.jp"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 text-base"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">パスワード（6文字以上）</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12 text-base"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "登録しています…" : "無料ではじめる"}
      </Button>
    </form>
  );
}