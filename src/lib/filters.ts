import { z } from "zod";
import type { DashboardFilters } from "@/types";
const date = z.iso.date().optional();
export const filtersSchema = z
  .object({
    sector: z.uuid().optional(),
    from: date,
    to: date,
    shift: z.enum(["morning", "afternoon", "night"]).optional(),
  })
  .refine((f) => !f.from || !f.to || f.from <= f.to, "O início deve ser anterior ao fim.");
export function parseFilters(
  input: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const clean = Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value === "string" && value !== ""),
  );
  return filtersSchema.parse(clean);
}
export function filterDates(filters: DashboardFilters) {
  // São Paulo uses UTC-03:00. The final day is included using an exclusive next-day bound.
  return {
    from: filters.from ? `${filters.from}T00:00:00-03:00` : null,
    to: filters.to
      ? new Date(new Date(`${filters.to}T00:00:00-03:00`).getTime() + 86400000).toISOString()
      : null,
  };
}
