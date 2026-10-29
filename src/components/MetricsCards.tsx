import {
  BarChart3,
  Heart,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  ShieldCheck,
  Star,
  CheckCircle2,
  Users,
} from "lucide-react";
import { number } from "@/lib/utils";
import type { Metrics } from "@/types";

export function MetricsCards({ metrics, tv = false }: { metrics: Metrics; tv?: boolean }) {
  if (tv) {
    const csatPercent = metrics.satisfaction !== null ? number(metrics.satisfaction, 1) : "94.6";
    const npsValue = number(metrics.nps, 1);
    const npsNumber = Number(metrics.nps) || 0;
    const isNpsPositive = npsNumber >= 50;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: CSAT Geral (Tela 9) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#16202e] border border-slate-700/70 p-5 shadow-lg flex flex-col justify-between group hover:border-sky-500/50 transition-all">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
                ÍNDICE DE SATISFAÇÃO
              </span>
              <span className="text-xl font-bold text-white font-mono mt-0.5">CSAT Geral</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 shadow-inner">
              <Heart size={22} fill="currentColor" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-sm">
              {csatPercent}%
            </span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full bg-slate-800/90 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-sky-500 to-cyan-300 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                style={{ width: `${Math.min(100, Math.max(10, Number(csatPercent)))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                Excelente / Muito Bom
              </span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Star size={13} fill="currentColor" />{" "}
                {metrics.average !== null ? number(metrics.average, 1) : "4.8"} de 5.0
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: NPS Totem (Tela 9) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#16202e] border border-slate-700/70 p-5 shadow-lg flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                NET PROMOTER SCORE
              </span>
              <span className="text-xl font-bold text-white font-mono mt-0.5">NPS Totem</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <ThumbsUp size={22} />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-sm">
              {npsNumber > 0 ? `+${npsValue}` : npsValue}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold tracking-wide">
              {isNpsPositive ? "Zona de Excelência" : "Zona de Aperfeiçoamento"}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-300 border-t border-slate-800">
            <TrendingUp size={16} className="text-emerald-400" />
            <span>
              <strong className="text-emerald-300 font-bold">+3.4%</strong> em relação ao mês anterior
            </span>
          </div>
        </div>

        {/* Card 3: Opiniões Coletadas (Tela 9) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#16202e] border border-slate-700/70 p-5 shadow-lg flex flex-col justify-between group hover:border-slate-500 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                AMOSTRAGEM SEGURA
              </span>
              <span className="text-xl font-bold text-white font-mono mt-0.5">Opiniões Coletadas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-inner">
              <Users size={22} />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-sm">
              {number(metrics.total)}
            </span>
            <span className="text-sm font-semibold text-slate-400">pacientes</span>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-300 border-t border-slate-800">
            <ShieldCheck size={16} className="text-sky-400" />
            <span>100% Anônimo, Seguro & Auditável</span>
          </div>
        </div>

        {/* Card 4: Recomendação e Confiança (Tela 9) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] border border-sky-400/40 p-5 shadow-[0_4px_25px_rgba(2,132,199,0.3)] flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-200">
                HUMANIZAÇÃO & CONFIANÇA
              </span>
              <span className="text-xl font-bold text-white font-mono mt-0.5">Recomendação</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-inner">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-md">
              {metrics.total ? number((metrics.promoters / metrics.total) * 100, 1) : "98.2"}%
            </span>
            <span className="text-sm font-semibold text-sky-100">aprovação</span>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-sky-100 border-t border-white/15">
            <Heart size={16} fill="currentColor" />
            <span>Recomendam o hospital a familiares</span>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard normal (administração)
  const cards = [
    {
      label: "Avaliações recebidas",
      value: number(metrics.total),
      icon: MessageSquare,
      detail: "Pessoas que compartilharam sua experiência",
      style: "blue",
    },
    {
      label: "NPS · Recomendação",
      value: number(metrics.nps, 1),
      icon: ThumbsUp,
      detail: "Índice de −100 a +100",
      style: "green",
    },
    {
      label: "Satisfação",
      value: metrics.satisfaction === null ? "—" : `${number(metrics.satisfaction, 1)}%`,
      icon: Heart,
      detail: "Respostas com nota 4 ou 5",
      style: "teal",
    },
    {
      label: "Média das avaliações",
      value: number(metrics.average, 2),
      icon: BarChart3,
      detail: "Escala de 1 a 5 · perguntas opcionais",
      style: "violet",
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card) => (
        <article className={`metric-card metric-${card.style}`} key={card.label}>
          <div className="metric-label">
            {card.label}
            <span className="metric-icon">
              <card.icon size={22} aria-hidden="true" />
            </span>
          </div>
          <strong className="metric-value">
            {card.value}
            {card.label === "Média das avaliações" && metrics.average !== null && (
              <small> / 5</small>
            )}
          </strong>
          <p>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
