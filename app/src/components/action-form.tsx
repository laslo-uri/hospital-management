"use client";

import { useActionState } from "react";
import { usePreferences } from "@/i18n/preferences";
import type { ActionResult } from "@/server/actions/auth";

export function ActionForm({
  action,
  children,
  className,
  successMessage,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const { t } = usePreferences();
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.ok === false ? (
        <p className="text-sm font-medium text-danger">{state.error}</p>
      ) : null}
      {state?.ok === true && successMessage ? (
        <p className="text-sm font-medium text-success">{successMessage}</p>
      ) : null}
      {pending ? <p className="text-sm text-muted">{t("working")}</p> : null}
    </form>
  );
}
