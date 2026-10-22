"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/env";
import type { FormState } from "@/components/ActionForm";
export async function login(_state: FormState, form: FormData): Promise<FormState> {
  if (!hasSupabase()) return { error: "Configure o Supabase para entrar com uma conta real." };
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Informe seu e-mail e sua senha." };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Não foi possível entrar. Confira o e-mail e a senha." };
  redirect("/dashboard");
}
export async function magicLink(_state: FormState, form: FormData): Promise<FormState> {
  if (!hasSupabase()) return { error: "Configure o Supabase para enviar links de acesso." };
  const parsed = z.email().safeParse(form.get("email"));
  if (!parsed.success) return { error: "Informe um e-mail válido." };
  const client = await createClient();
  const { error } = await client.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error)
    return { error: "Não foi possível solicitar o link agora. Tente novamente mais tarde." };
  return {
    success: "Se o e-mail estiver cadastrado, você receberá um link de acesso de uso único.",
  };
}
export async function setPassword(_state: FormState, form: FormData): Promise<FormState> {
  if (!hasSupabase()) return { error: "Configure o Supabase para alterar a senha." };
  const parsed = z
    .object({ password: z.string().min(12), confirmation: z.string() })
    .refine((p) => p.password === p.confirmation)
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Use uma senha com pelo menos 12 caracteres e repita a mesma senha." };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Seu link expirou. Solicite um novo acesso." };
  const { error } = await client.auth.updateUser({ password: parsed.data.password });
  if (error)
    return {
      error: "Não foi possível definir a senha. Solicite um novo link de acesso e tente novamente.",
    };
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);
  if (profileError)
    return {
      error: "A senha foi alterada, mas não foi possível concluir o acesso. Tente novamente.",
    };
  redirect("/dashboard");
}
export async function signOut() {
  if (hasSupabase()) {
    const client = await createClient();
    await client.auth.signOut();
  }
  redirect("/login");
}
