import type { Metrics, Sector, Survey } from "@/types";
export const demoSectors: Sector[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Pronto Atendimento",
    slug: "pronto-atendimento",
    active: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Internação",
    slug: "internacao",
    active: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Ambulatório",
    slug: "ambulatorio",
    active: true,
  },
];
export function demoSurvey(slug: string): Survey | null {
  const sector = demoSectors.find((s) => s.slug === slug);
  if (!sector) return null;
  return {
    id: "20000000-0000-4000-8000-000000000001",
    title: "Como foi o seu atendimento?",
    sector_id: sector.id,
    sector_name: sector.name,
    sector_slug: sector.slug,
    tablet_reset_seconds: 20,
    questions: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        text: "Como você avalia a atenção da nossa equipe?",
        kind: "rating",
        sector_id: sector.id,
        position: 0,
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        text: "Como você avalia o tempo de espera?",
        kind: "rating",
        sector_id: sector.id,
        position: 1,
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        text: "Como você avalia a limpeza e o conforto do hospital?",
        kind: "rating",
        sector_id: null,
        position: 0,
      },
      {
        id: "30000000-0000-4000-8000-000000000004",
        text: "De 0 a 10, quanto você recomendaria este hospital a um familiar ou amigo?",
        kind: "nps",
        sector_id: null,
        position: 0,
      },
    ],
  };
}
export const demoMetrics: Metrics = {
  total: 248,
  nps: 72.6,
  average: 4.52,
  satisfaction: 88.5,
  promoters: 199,
  passives: 30,
  detractors: 19,
  ratings: 712,
  distribution: [
    { value: 1, count: 12 },
    { value: 2, count: 19 },
    { value: 3, count: 51 },
    { value: 4, count: 135 },
    { value: 5, count: 495 },
  ],
  sectors: demoSectors.map((s, i) => ({
    id: s.id,
    name: s.name,
    total: [112, 84, 52][i],
    nps: [75, 71.4, 69.2][i],
    average: [4.6, 4.5, 4.4][i],
  })),
};
