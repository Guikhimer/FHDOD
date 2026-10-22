import "server-only";
import { createClient } from "@/lib/supabase/server";
import { demoMetrics, demoSectors } from "@/lib/demo";
import { hasSupabase } from "@/lib/env";
import { filterDates } from "@/lib/filters";
import type { DashboardFilters, Metrics, Sector } from "@/types";
export async function getSectors(): Promise<Sector[]> {
  if (!hasSupabase()) return demoSectors;
  const client = await createClient();
  const { data, error } = await client.from("sectors").select("id,name,slug,active").order("name");
  if (error) throw new Error("Não foi possível carregar os setores.");
  return data as Sector[];
}
export async function getMetrics(filters: DashboardFilters = {}): Promise<Metrics> {
  if (!hasSupabase()) {
    if (filters.sector || filters.from || filters.to || filters.shift)
      return {
        total: 0,
        nps: null,
        average: null,
        satisfaction: null,
        promoters: 0,
        passives: 0,
        detractors: 0,
        ratings: 0,
        distribution: [1, 2, 3, 4, 5].map((value) => ({ value, count: 0 })),
        sectors: demoMetrics.sectors
          .filter((s) => !filters.sector || s.id === filters.sector)
          .map((s) => ({ ...s, total: 0, nps: null, average: null })),
      };
    return demoMetrics;
  }
  const { from, to } = filterDates(filters);
  const client = await createClient();
  const { data, error } = await client.rpc("dashboard_metrics", {
    p_sector: filters.sector || null,
    p_from: from,
    p_to: to,
    p_shift: filters.shift || null,
  });
  if (error) throw new Error("Não foi possível carregar os indicadores.");
  return data as Metrics;
}
