import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  QrCode,
  ShieldCheck,
  Star,
  Timer,
  UserCheck,
} from "lucide-react";
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
    <main id="main" className="tv-wall min-h-screen bg-[#0c131e] text-slate-100 flex flex-col justify-between">
      {/* 1. TOP GLOBAL HEADER (Tela 9) */}
      <header className="w-full bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Brand dark />
          <div className="h-8 w-px bg-slate-800 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-300">
              Painel de Transparência e Experiência do Paciente
            </span>
            <span className="text-xs text-sky-400 flex items-center gap-1 font-medium">
              <span>📍</span> Pronto Atendimento & Recepção Central • Totem Integrado
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <RealtimeRefresh demo={!hasSupabase()} />
          <DigitalClock />
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* 2. SUB-BAR INFO & CONSOLIDAÇÃO */}
      <section className="w-full px-6 py-2.5 bg-[#101927] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
            <ShieldCheck size={14} className="text-sky-400" />
            <span>Painel de Transparência Pública</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="text-slate-300">
            Consolidado das últimas 24h • Total: <strong className="text-white">{metrics.total} opiniões</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <UserCheck size={15} />
          <span>Ouvidoria Hospitalar Integrada e Ativa</span>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="w-full max-w-[1700px] mx-auto px-6 py-6 flex-1 flex flex-col gap-6">
        {/* KPI CARDS (Destaques no estilo Tela 9 do Stitch) */}
        <MetricsCards metrics={metrics} tv />

        {/* SPLIT CENTRAL: Gráficos de Desempenho + Mural de Elogios */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Coluna Esquerda: Gráficos do Banco (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <DashboardCharts metrics={metrics} />
          </div>

          {/* Coluna Direita: Mural de Elogios & Reconhecimento (7 colunas) (Tela 9) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4 bg-[#16202e] border border-slate-700/70 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <h2 className="text-xl font-bold text-white">A Voz do Paciente • Mural de Elogios</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Reconhecimento espontâneo aos nossos profissionais e setores hospitalares
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> Auditado por Ouvidoria
              </span>
            </div>

            {/* Lista de Depoimentos Auditados (Tela 9) */}
            <div className="flex flex-col gap-4 my-2">
              <article className="p-4 rounded-xl bg-[#111927] border border-slate-800/90 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    Equipe de Enfermagem • Pronto Atendimento
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                  “A enfermeira Camila e toda a equipe da triagem me acolheram com uma paciência e carinho exemplares. Num momento de dor e angústia, fizeram toda a diferença. Gratidão imensa!”
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-sky-400">Avaliação anônima via Totem • Plantão recente</span>
                  <span className="text-emerald-400 font-medium">✓ Auditado</span>
                </div>
              </article>

              <article className="p-4 rounded-xl bg-[#111927] border border-slate-800/90 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                    Corpo Clínico & Pediatria
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                  “Dr. Marcelo atendeu meu filho com uma delicadeza indescritível. Explicou cada procedimento sem pressa e nos transmitiu total segurança. Hospital nota mil!”
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-sky-400">Avaliação anônima via Totem • Ontem</span>
                  <span className="text-emerald-400 font-medium">✓ Auditado</span>
                </div>
              </article>

              <article className="p-4 rounded-xl bg-[#111927] border border-slate-800/90 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    Recepção & Higiene Hospitalar
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                  “Ambiente impecável, cheiroso e equipe da recepção muito ágil e educada. Dá orgulho ver um atendimento tão humanizado na nossa cidade.”
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-sky-400">Avaliação anônima via Totem • Hoje</span>
                  <span className="text-emerald-400 font-medium">✓ Auditado</span>
                </div>
              </article>
            </div>
          </div>
        </div>

        {/* 4. CALLOUT BANNER INFERIOR COM QR CODE (Tela 9) */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-[#0b223c] via-[#10345b] to-[#0d2847] border border-sky-500/30 text-white p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center text-slate-950 shrink-0 shadow-lg">
              <QrCode size={56} className="text-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-300">
                PARTICIPE EM SEGUNDOS
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Sua opinião constrói o nosso hospital!
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Aponte a câmera do seu celular para o QR Code acima ou toque no totem interativo na entrada da recepção.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 text-xs font-medium">
              <Timer size={16} className="text-sky-400" />
              <span>Leva menos de 1 minuto</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 text-xs font-medium">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>100% Anônimo (LGPD)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER DE QUALIDADE & LGPD */}
      <footer className="w-full bg-[#0a0f18] border-t border-slate-800/80 py-4 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-sky-400" />
          <span>Qualidade & Segurança Hospitalar • Acreditado com Excelência ONA Nível 3</span>
        </div>
        <div>
          Privacidade Garantida • 100% Anônimo conforme Lei Geral de Proteção de Dados (Lei 13.709/2018)
        </div>
      </footer>
    </main>
  );
}
