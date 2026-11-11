import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiRequest } from "@/lib/api";
import { Brand } from "@/components/Brand";
import { ActionForm } from "@/components/ActionForm";
import { setPassword } from "@/app/auth/actions";
import { profileSchema } from "@/lib/api-schemas";
export default async function FirstAccess() {
  const token = (await cookies()).get("fhdod_access")?.value;
  if (!token) redirect("/login");
  try { await apiRequest("/auth/me", {}, profileSchema); } catch { redirect("/login"); }
  return (
    <div className="auth-shell">
      <header>
        <Brand />
      </header>
      <main id="main" className="auth-card">
        <h1>Defina sua senha</h1>
        <p>Antes de acessar o painel, escolha uma senha pessoal com pelo menos 12 caracteres.</p>
        <ActionForm action={setPassword} label="Salvar senha e continuar">
          <label htmlFor="current-password">Senha temporária atual</label>
          <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
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
