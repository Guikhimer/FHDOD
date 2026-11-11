import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/SurveyForm";
import { demoSurvey } from "@/lib/demo";
import { publicApi } from "@/lib/api";
import { publicSurveySchema } from "@/lib/api-schemas";
import type { Survey } from "@/types";
export const dynamic = "force-dynamic";
export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tablet?: string }>;
}) {
  const { slug } = await params;
  const { tablet } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const demo = !apiUrl;
  let survey: Survey | null = demo ? demoSurvey(slug) : null;
  if (apiUrl) {
    try {
      const data = await publicApi<{ title: string; tabletResetSeconds: number; sector: { id: string; name: string }; questions: { id: string; text: string; kind: "rating" | "nps"; required: boolean; sectorId: string | null }[] }>(`/surveys/public/${encodeURIComponent(slug)}`, undefined, publicSurveySchema);
      survey = { id: slug, title: data.title, sector_id: data.sector.id, sector_name: data.sector.name, sector_slug: slug, tablet_reset_seconds: data.tabletResetSeconds, questions: data.questions.map((question, position) => ({ id: question.id, text: question.text, kind: question.kind, sector_id: question.sectorId, position })) };
    } catch { survey = null; }
  }
  if (!survey || !survey.questions.some((q) => q.kind === "nps")) notFound();
  return <SurveyForm survey={survey} demo={demo} tablet={tablet === "1"} />;
}
