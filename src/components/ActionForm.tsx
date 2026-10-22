"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
export type FormState = { error?: string; success?: string };
export function ActionForm({
  action,
  children,
  label,
  disabled = false,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="action-form">
      <fieldset disabled={pending || disabled}>
        {children}
        <Button type="submit" disabled={pending || disabled}>
          {pending ? "Aguarde…" : label}
        </Button>
      </fieldset>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
