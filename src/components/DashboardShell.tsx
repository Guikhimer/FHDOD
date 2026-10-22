"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Settings2,
  ClipboardList,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { signOut } from "@/app/auth/actions";
import type { Profile } from "@/types";
export function DashboardShell({
  profile,
  demo,
  children,
}: {
  profile: Profile;
  demo: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const links = [
    { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { href: "/dashboard/manage", label: "Pesquisas e gestão", icon: ClipboardList },
    { href: "/dashboard/tv-wall", label: "Painel TV", icon: Monitor },
  ];
  if (path === "/dashboard/tv-wall") return <>{children}</>;
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Brand dark />
        <div className="sidebar-caption">ESCUTAR PARA CUIDAR MELHOR</div>
        <nav aria-label="Área da equipe">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={22} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">
            <ArrowUpRight size={20} aria-hidden="true" /> Abrir página de avaliação
          </Link>
          <div className="staff-card">
            <span className="staff-avatar">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <div>
              <strong>{profile.full_name || "Equipe FHDOD"}</strong>
              <small>{profile.role === "admin" ? "Administrador" : "Gestor de setor"}</small>
            </div>
          </div>
          {!demo && (
            <form action={signOut}>
              <button className="sidebar-signout">
                <LogOut size={20} aria-hidden="true" /> Sair da conta
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <span>
            <span className="status-dot" /> Gestão da experiência do paciente
          </span>
          <span className="topbar-label">
            <Settings2 size={18} aria-hidden="true" />{" "}
            {demo ? "Demonstração" : "Ambiente conectado"}
          </span>
        </header>
        {demo && (
          <div className="dashboard-demo">
            Dados fictícios para demonstração. Configure o Supabase para receber avaliações reais.
          </div>
        )}
        <main id="main" className="dashboard-main">
          {children}
        </main>
        <footer className="dashboard-footer">
          Fundação Hospitalar Dr. Oswaldo Diesel · Sua opinião transforma o cuidado.
        </footer>
      </div>
    </div>
  );
}
