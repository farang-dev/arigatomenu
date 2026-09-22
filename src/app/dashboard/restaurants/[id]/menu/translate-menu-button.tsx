"use client";

import { useActionState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/dashboard/actions";

export function TranslateMenuButton({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="inline-block">
      <Button type="submit" size="sm" disabled={pending} className="font-bold">
        {pending ? <Loader2 className="animate-spin" /> : <Languages />}
        {pending ? "翻訳中…" : "AIで翻訳（英・中・韓）"}
      </Button>
      {(state?.message || state?.error) && (
        <p
          role={state?.error ? "alert" : undefined}
          className={`mt-2 max-w-72 text-xs leading-5 ${
            state?.error ? "text-destructive" : "text-primary"
          }`}
        >
          {state?.message ?? state?.error}
        </p>
      )}
    </form>
  );
}