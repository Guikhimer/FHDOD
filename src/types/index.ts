export type Role = "admin" | "sector_manager";
export type Shift = "morning" | "afternoon" | "night";
export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  active: boolean;
  must_change_password: boolean;
};
export type Sector = { id: string; name: string; slug: string; active: boolean };
export type Question = {
  id: string;
  text: string;
  kind: "rating" | "nps";
  sector_id: string | null;
  position: number;
};
export type Survey = {
  id: string;
  title: string;
  sector_id: string;
  sector_name: string;
  sector_slug: string;
  tablet_reset_seconds: number;
  questions: Question[];
};
export type Metrics = {
  total: number;
  nps: number | null;
  average: number | null;
  satisfaction: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  ratings: number;
  distribution: { value: number; count: number }[];
  sectors: {
    id: string;
    name: string;
    total: number;
    nps: number | null;
    average: number | null;
  }[];
};
export type DashboardFilters = { sector?: string; from?: string; to?: string; shift?: Shift };
