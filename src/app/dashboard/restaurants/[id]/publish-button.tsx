"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/dashboard/actions";

export function PublishButton({
  published,
  action,
}: {
  published: boolean;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  return (
    <form action={formAction}>
      {state?.error && (
        <p className="mb-2 text-xs font-semibold text-destructive">{state.error}</p>
      )}
      <Button
        type="submit"
        variant={published ? "outline" : "default"}
        disabled={pending}
        className="font-bold shadow-xs gap-1.5"
      >
        {pending ? (
          "処理中…"
        ) : published ? (
          <>
            <EyeOff size={14} /> 公開を停止する（下書きにする）
          </>
        ) : (
          <>
            <Eye size={14} /> メニューを公開する
          </>
        )}
      </Button>
    </form>
  );
}

export function DeleteButton({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("このレストランを削除しますか？\n登録したメニュー、翻訳、QRコード設定はすべて削除され、この操作は取り消せません。")) {
          e.preventDefault();
        }
      }}
    >
      {state?.error && (
        <p className="mb-2 text-xs font-semibold text-destructive">{state.error}</p>
      )}
      <Button
        type="submit"
        variant="ghost"
        className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 font-medium"
        disabled={pending}
      >
        <Trash2 size={14} />
        店舗を削除
      </Button>
    </form>
  );
}