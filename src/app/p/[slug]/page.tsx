import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/SurveyForm";
import { demoSurvey } from "@/lib/demo";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
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
  const demo = !hasSupabase();
  let survey: Survey | null;
  if (demo) survey = demoSurvey(slug);
  else {
    const client = await createClient();
    const { data, error } = await client.rpc("get_public_survey", { sector_slug: slug });
    if (error) throw new Error("Não foi possível carregar a pesquisa.");
    survey = data as Survey | null;
  }
  if (!survey || !survey.questions.some((q) => q.kind === "nps")) notFound();
  return <SurveyForm survey={survey} demo={demo} tablet={tablet === "1"} />;
}
