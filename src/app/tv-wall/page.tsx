import Link from "next/link";
import { ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { MetricsCards } from "@/components/MetricsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { DigitalClock } from "@/components/DigitalClock";
import { getPublicMetrics } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function TVWall() {
  const metrics = await getPublicMetrics();
  return (
    <main id="main" className="tv-wall min-h-screen bg-[#0c131e] text-slate-100 flex flex-col">
      <header className="w-full bg-[#0f172a]/95 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Brand dark />
          <div className="hidden md:block h-8 w-px bg-slate-800" />
          <div>
            <h1 className="text-sm font-semibold text-slate-200">Painel público de satisfação</h1>
            <p className="text-xs text-sky-300">Indicadores agregados das avaliações</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <RealtimeRefresh demo={!process.env.NEXT_PUBLIC_API_URL} />
          <DigitalClock />
          <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> Acesso da equipe
          </Link>
        </div>
      </header>
      <section className="w-full px-6 py-3 bg-[#101927] border-b border-slate-800 flex items-center gap-3 text-sm text-slate-300">
        <ShieldCheck size={18} className="text-emerald-400" aria-hidden="true" />
        Este painel apresenta somente totais e distribuições. Respostas individuais, comentários e contatos não são exibidos.
      </section>
      <div className="w-full max-w-[1700px] mx-auto px-6 py-8 flex-1 flex flex-col gap-8">
        <MetricsCards metrics={metrics} tv />
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#16202e] border border-slate-700/70 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-5">
              <HeartPulse size={22} className="text-sky-400" aria-hidden="true" />
              <h2 className="text-xl font-bold">Distribuição das avaliações</h2>
            </div>
            <DashboardCharts metrics={metrics} />
          </div>
          <div className="lg:col-span-5 bg-[#16202e] border border-slate-700/70 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-5">Avaliações por nota</h2>
            <div className="space-y-4">
              {metrics.distribution.map(({ value, count }) => {
                const percent = metrics.ratings ? Math.round((count / metrics.ratings) * 100) : 0;
                return <div key={value}>
                  <div className="flex justify-between text-sm mb-1"><span>{value} de 5</span><span>{count} · {percent}%</span></div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden" role="img" aria-label={`Nota ${value}: ${count} avaliações, ${percent}%`}>
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${percent}%` }} />
                  </div>
                </div>;
              })}
            </div>
            {metrics.sectors.length > 0 && <div className="mt-8 border-t border-slate-700 pt-5">
              <h3 className="font-semibold mb-3">Resumo por setor</h3>
              <ul className="space-y-2">{metrics.sectors.map((sector) => <li key={sector.id} className="flex justify-between gap-3 text-sm">
                <span>{sector.name}</span><span>{sector.total} respostas · NPS {sector.nps ?? "—"}</span>
              </li>)}</ul>
            </div>}
          </div>
        </section>
      </div>
      <footer className="w-full bg-[#0a0f18] border-t border-slate-800 py-4 px-6 text-xs text-slate-400 flex flex-wrap justify-between gap-3">
        <span>FHDOD · Indicadores consolidados</span>
        <span>Dados atualizados periodicamente · Nenhum relato individual é publicado</span>
      </footer>
    </main>
  );
}
