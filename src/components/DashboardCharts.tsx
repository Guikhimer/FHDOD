import { RatingFace, ratingLabels } from "@/components/RatingFace";
import { number } from "@/lib/utils";
import type { Metrics } from "@/types";
export function DashboardCharts({ metrics }: { metrics: Metrics }) {
  const max = Math.max(1, ...metrics.distribution.map((d) => d.count));
  const npsGroups = [
    { name: "Promotores", range: "Notas 9 e 10", count: metrics.promoters, cls: "promoters" },
    { name: "Neutros", range: "Notas 7 e 8", count: metrics.passives, cls: "passives" },
    { name: "Detratores", range: "Notas 0 a 6", count: metrics.detractors, cls: "detractors" },
  ];
  return (
    <div className="chart-grid">
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h2>Como foi o atendimento?</h2>
            <p>Distribuição das {number(metrics.ratings)} respostas de 1 a 5</p>
          </div>
          <span className="small-tag">Satisfação</span>
        </div>
        <div className="rating-chart">
          {metrics.distribution.map((d) => (
            <div className="rating-chart-row" key={d.value}>
              <div className="chart-rating-label">
                <RatingFace value={d.value} />
                <span>
                  {d.value} · {ratingLabels[d.value - 1]}
                </span>
              </div>
              <div className="chart-bar-track">
                <div
                  className={`chart-bar bar-${d.value}`}
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <strong>{number(d.count)}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h2>Quem nos recomendaria?</h2>
            <p>NPS = % promotores − % detratores</p>
          </div>
          <span className="small-tag">NPS</span>
        </div>
        <div className="nps-summary">
          <strong>{number(metrics.nps, 1)}</strong>
          <span>índice de recomendação</span>
        </div>
        <div className="nps-stacked" aria-hidden="true">
          {npsGroups.map((g) => (
            <div
              key={g.name}
              className={g.cls}
              style={{ width: `${metrics.total ? (g.count / metrics.total) * 100 : 0}%` }}
            />
          ))}
        </div>
        <div className="nps-legend">
          {npsGroups.map((g) => (
            <div key={g.name}>
              <span className={`legend-dot ${g.cls}`} />
              <span>
                <strong>{g.name}</strong>
                <small>{g.range}</small>
              </span>
              <strong>
                {metrics.total ? number((g.count / metrics.total) * 100, 1) : "0"}%{" "}
                <small>({number(g.count)})</small>
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
