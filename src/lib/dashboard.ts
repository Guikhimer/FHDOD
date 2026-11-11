import "server-only";
import { apiRequest, publicApi } from "@/lib/api";
import { metricsSchema, sectorSchema } from "@/lib/api-schemas";
import { filterDates } from "@/lib/filters";
import { demoMetrics, demoSectors } from "@/lib/demo";
import type { DashboardFilters, Metrics, Sector } from "@/types";
export async function getSectors(): Promise<Sector[]> {
  if (!process.env.NEXT_PUBLIC_API_URL) return demoSectors;
  return apiRequest<Sector[]>("/sectors", {}, sectorSchema.array());
}
export async function getMetrics(filters: DashboardFilters = {}): Promise<Metrics> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    if (filters.sector || filters.from || filters.to)
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
  const query = new URLSearchParams();
  if (filters.sector) query.set("sectorId", filters.sector);
  const dates = filterDates(filters);
  if (dates.from) query.set("from", dates.from);
  if (dates.to) query.set("to", dates.to);
  return apiRequest<Metrics>(`/dashboard/metrics?${query}`, {}, metricsSchema);
}
export async function getPublicMetrics(): Promise<Metrics> {
  if (!process.env.NEXT_PUBLIC_API_URL) return demoMetrics;
  return publicApi<Metrics>("/tv/metrics", {}, metricsSchema);
}
