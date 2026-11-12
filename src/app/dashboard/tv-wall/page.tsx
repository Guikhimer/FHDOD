import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { MetricsCards } from "@/components/MetricsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { DigitalClock } from "@/components/DigitalClock";
import { getMetrics } from "@/lib/dashboard";
import { requireProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";

export default async function TVWall() {
  await requireProfile();
  const metrics = await getMetrics();

  return (
    <main id="main" className="tv-wall">
      <header>
        <div className="tv-brand-group">
          <Brand dark />
          <div className="tv-brand-copy">
            <strong>Experiência do paciente</strong>
            <span>Indicadores gerais da pesquisa</span>
          </div>
        </div>
        <div className="tv-tools">
          <RealtimeRefresh demo={!hasSupabase()} />
          <DigitalClock />
          <Link href="/dashboard" className="tv-back-link">
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Voltar ao painel</span>
          </Link>
        </div>
      </header>

      <div className="tv-content">
        <div className="tv-intro">
          <p className="eyebrow">FUNDAÇÃO HOSPITALAR DR. OSWALDO DIESEL</p>
          <h1>A experiência de cuidado, em números.</h1>
          <p>Resultados consolidados das avaliações registradas no sistema.</p>
        </div>

        <MetricsCards metrics={metrics} tv />

        {metrics.total === 0 ? (
          <p className="empty-state tv-empty-state">
            Ainda não há avaliações registradas. Os indicadores aparecerão aqui quando houver
            respostas registradas.
          </p>
        ) : (
          <DashboardCharts metrics={metrics} />
        )}

        <section className="tv-invitation">
          <span className="tv-invitation-icon">
            <ClipboardCheck size={24} aria-hidden="true" />
          </span>
          <div>
            <h2>Sua experiência também pode ajudar.</h2>
            <p>Acesse as pesquisas disponíveis e compartilhe sua opinião com a equipe.</p>
          </div>
          <Link href="/" className="tv-invitation-link">
            Ver pesquisas <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <footer>FHDOD · Escutar para cuidar melhor</footer>
    </main>
  );
}
