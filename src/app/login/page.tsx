import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ActionForm } from "@/components/ActionForm";
import { login, magicLink } from "@/app/auth/actions";
import { hasSupabase } from "@/lib/env";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="auth-shell">
      <header>
        <Brand />
      </header>
      <main id="main" className="auth-card">
        <p className="eyebrow">ÁREA DA EQUIPE</p>
        <h1>Bem-vindo de volta.</h1>
        <p>Acesse os resultados e cuide de cada experiência.</p>
        {error && (
          <p className="form-error" role="alert">
            {error === "inactive"
              ? "Seu acesso ainda não foi liberado. Fale com o administrador."
              : "O link de acesso expirou ou é inválido. Solicite outro abaixo."}
          </p>
        )}
        <ActionForm action={login} label="Entrar">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </ActionForm>
        <details className="magic-link">
          <summary>Receber um link de acesso por e-mail</summary>
          <ActionForm action={magicLink} label="Enviar link de acesso">
            <label htmlFor="magic-email">E-mail cadastrado</label>
            <input id="magic-email" name="email" type="email" autoComplete="email" required />
          </ActionForm>
        </details>
        {!hasSupabase() && (
          <p className="demo-note">
            O ambiente ainda está em demonstração. <Link href="/dashboard">Explorar painel</Link>
          </p>
        )}
        <Link className="auth-back" href="/">
          Voltar ao Início
        </Link>
      </main>
    </div>
  );
}
