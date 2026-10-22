import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";
import { Brand } from "@/components/Brand";
import { MetricsCards } from "@/components/MetricsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getMetrics } from "@/lib/dashboard";
import { requireProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
export default async function TVWall() {
  await requireProfile();
  const metrics = await getMetrics();
  return (
    <main id="main" className="tv-wall">
      <header>
        <Brand dark />
        <span>
          <Monitor size={24} aria-hidden="true" /> Experiência do paciente
        </span>
        <Link href="/dashboard">
          <ArrowLeft size={20} aria-hidden="true" /> Voltar
        </Link>
      </header>
      <div className="tv-title">
        <div>
          <p className="eyebrow">ESCUTAR PARA CUIDAR MELHOR</p>
          <h1>A sua opinião transforma o cuidado.</h1>
        </div>
        <RealtimeRefresh demo={!hasSupabase()} />
      </div>
      <MetricsCards metrics={metrics} tv />
      <DashboardCharts metrics={metrics} />
      <footer>
        FHDOD · Indicadores consolidados de todos os períodos e dos setores autorizados.
      </footer>
    </main>
  );
}
