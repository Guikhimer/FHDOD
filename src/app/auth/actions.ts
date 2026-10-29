"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";

const api = () => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
async function post(path: string, body: unknown, token?: string) {
  const response = await fetch(`${api()}/api/v1${path}`, { method: path === "/auth/password" ? "PATCH" : "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return response;
}
export async function login(_state: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email: z.email(), password: z.string().min(1) }).safeParse(Object.fromEntries(form));
  if (!parsed.success || !api()) return { error: "Informe e-mail e senha e confira a configuração da API." };
  try {
    const response = await post("/auth/login", parsed.data);
    if (!response.ok) return { error: "Não foi possível entrar. Confira o e-mail e a senha." };
    const tokens = await response.json();
    const jar = await cookies();
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    jar.set("fhdod_access", tokens.accessToken, { ...options, maxAge: tokens.expiresIn });
    jar.set("fhdod_refresh", tokens.refreshToken, { ...options, maxAge: 30 * 24 * 3600 });
    redirect(tokens.mustChangePassword ? "/auth/first-access" : "/dashboard");
  } catch (error) { if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error; return { error: "API indisponível. Tente novamente." }; }
}
export async function magicLink(): Promise<FormState> { return { error: "A API atual não oferece acesso por link. Use e-mail e senha." }; }
export async function setPassword(_state: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ currentPassword: z.string().min(1), password: z.string().min(12), confirmation: z.string() }).refine((v) => v.password === v.confirmation).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Informe a senha temporária e uma nova senha de pelo menos 12 caracteres." };
  const jar = await cookies(); const token = jar.get("fhdod_access")?.value;
  if (!token) redirect("/login");
  try {
    const response = await post("/auth/password", { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.password }, token);
    if (!response.ok) return { error: "Não foi possível alterar a senha. Confira a senha atual." };
  } catch { return { error: "API indisponível. Tente novamente." }; }
  jar.delete("fhdod_access"); jar.delete("fhdod_refresh"); redirect("/login");
}
export async function signOut() {
  const jar = await cookies(); const refreshToken = jar.get("fhdod_refresh")?.value;
  if (refreshToken && api()) await post("/auth/logout", { refreshToken }).catch(() => undefined);
  jar.delete("fhdod_access"); jar.delete("fhdod_refresh"); redirect("/login");
}
