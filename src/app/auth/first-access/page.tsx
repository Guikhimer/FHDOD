import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Brand } from "@/components/Brand";
import { ActionForm } from "@/components/ActionForm";
import { setPassword } from "@/app/auth/actions";
export default async function FirstAccess() {
  if (!hasSupabase()) redirect("/login");
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client
    .from("profiles")
    .select("active")
    .eq("id", user.id)
    .single();
  if (!profile?.active) redirect("/login?error=inactive");
  return (
    <div className="auth-shell">
      <header>
        <Brand />
      </header>
      <main id="main" className="auth-card">
        <h1>Defina sua senha</h1>
        <p>Antes de acessar o painel, escolha uma senha pessoal com pelo menos 12 caracteres.</p>
        <ActionForm action={setPassword} label="Salvar senha e continuar">
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
          <label htmlFor="confirmation">Repita a senha</label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </ActionForm>
      </main>
    </div>
  );
}
