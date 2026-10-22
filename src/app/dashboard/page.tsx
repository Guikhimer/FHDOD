import Link from "next/link";
import { Download, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricsCards } from "@/components/MetricsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { getMetrics, getSectors } from "@/lib/dashboard";
import { requireProfile } from "@/lib/auth";
import { parseFilters } from "@/lib/filters";
import { number, shifts } from "@/lib/utils";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireProfile();
  const input = await searchParams;
  const result = (() => {
    try {
      return { filters: parseFilters(input), error: "" };
    } catch {
      return { filters: {}, error: "Confira as datas e os filtros informados." };
    }
  })();
  const filters = result.filters;
  const [metrics, sectors] = await Promise.all([getMetrics(filters), getSectors()]);
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXPERIÊNCIA DO PACIENTE</p>
          <h1>Escutar. Entender. Melhorar.</h1>
          <p>Acompanhe o que nossos pacientes têm a dizer.</p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/reports?${query}`}>
            <Download size={20} aria-hidden="true" /> Exportar Excel
          </a>
        </Button>
      </div>
      <form className="filter-panel" action="/dashboard">
        <span className="filter-title">
          <SlidersHorizontal size={22} aria-hidden="true" /> Filtrar
        </span>
        <div>
          <label htmlFor="sector">Setor</label>
          <select id="sector" name="sector" defaultValue={filters.sector || ""}>
            <option value="">Todos os setores</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from">De</label>
          <input id="from" type="date" name="from" defaultValue={filters.from} />
        </div>
        <div>
          <label htmlFor="to">Até</label>
          <input id="to" type="date" name="to" defaultValue={filters.to} />
        </div>
        <div>
          <label htmlFor="shift">Plantão</label>
          <select id="shift" name="shift" defaultValue={filters.shift || ""}>
            <option value="">Todos</option>
            {Object.entries(shifts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Aplicar</Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Limpar</Link>
        </Button>
      </form>
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      <MetricsCards metrics={metrics} />
      {metrics.total === 0 && (
        <p className="empty-state">
          Nenhuma avaliação neste período. Ajuste os filtros ou compartilhe o link da pesquisa.
        </p>
      )}
      <DashboardCharts metrics={metrics} />
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Um olhar para cada setor</h2>
            <p>Indicadores do período selecionado</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/manage">
              Gerenciar pesquisas <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Resultados por setor</caption>
            <thead>
              <tr>
                <th>Setor</th>
                <th>Avaliações</th>
                <th>NPS</th>
                <th>Média · 1 a 5</th>
              </tr>
            </thead>
            <tbody>
              {metrics.sectors.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>{number(s.total)}</td>
                  <td>
                    <span className="nps-pill">{number(s.nps, 1)}</span>
                  </td>
                  <td>{number(s.average, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="metric-definition">
        Satisfação: percentual de respostas 4 ou 5. Média: média das notas de 1 a 5. NPS: indicador
        independente, calculado com a nota de recomendação de 0 a 10.
      </p>
    </>
  );
}
