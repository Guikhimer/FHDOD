import { BarChart3, Heart, MessageSquare, ThumbsUp, Users } from "lucide-react";
import { number } from "@/lib/utils";
import type { Metrics } from "@/types";

export function MetricsCards({ metrics, tv = false }: { metrics: Metrics; tv?: boolean }) {
  if (tv) {
    return (
      <div className="metrics-grid tv-metrics-grid">
        {[
          {
            label: "Índice de recomendação · NPS",
            value: number(metrics.nps, 1),
            detail: "De −100 a +100 · notas de 0 a 10",
            icon: ThumbsUp,
          },
          {
            label: "Satisfação",
            value: metrics.satisfaction === null ? "—" : `${number(metrics.satisfaction, 1)}%`,
            detail: "Respostas com nota 4 ou 5",
            icon: Heart,
          },
          {
            label: "Avaliações recebidas",
            value: number(metrics.total),
            detail: "Total registrado no sistema",
            icon: Users,
          },
          {
            label: "Média das avaliações",
            value: number(metrics.average, 2),
            detail: "Escala de 1 a 5 · perguntas opcionais",
            icon: BarChart3,
          },
        ].map((card) => (
          <article className="metric-card tv-metric-card" key={card.label}>
            <div className="metric-label">
              {card.label}
              <span className="metric-icon">
                <card.icon size={20} aria-hidden="true" />
              </span>
            </div>
            <strong className="metric-value">{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
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
