import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const number = (value: number | null, digits = 0) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
export const shifts = {
  morning: "Manhã · 7h às 13h",
  afternoon: "Tarde · 13h às 19h",
  night: "Noite · 19h às 7h",
} as const;
