import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ActionForm } from "@/components/ActionForm";
import { login } from "@/app/auth/actions";
export default function Login() {
  return (
    <div className="auth-shell">
      <header>
        <Brand />
      </header>
      <main id="main" className="auth-card">
        <p className="eyebrow">ÁREA DA EQUIPE</p>
        <h1>Bem-vindo de volta.</h1>
        <p>Acesse os resultados e cuide de cada experiência.</p>
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
        {!process.env.NEXT_PUBLIC_API_URL && (
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
