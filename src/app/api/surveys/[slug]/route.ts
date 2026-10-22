import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/survey-validation";
import { hasSupabase } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoSurvey } from "@/lib/demo";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (request.headers.get("origin") !== new URL(origin).origin)
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 16384)
    return NextResponse.json({ error: "Dados muito extensos." }, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16384)
    return NextResponse.json({ error: "Dados muito extensos." }, { status: 413 });
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    return NextResponse.json({ error: "Pesquisa inválida." }, { status: 404 });
  if (!hasSupabase()) {
    const survey = demoSurvey(slug);
    if (!survey) return NextResponse.json({ error: "Pesquisa indisponível." }, { status: 404 });
    if (
      parsed.data.answers.some(
        (a) => !survey.questions.some((q) => q.id === a.question_id && q.kind === "rating"),
      )
    )
      return NextResponse.json({ error: "Pergunta inválida." }, { status: 400 });
    return NextResponse.json(
      { ok: true, demo: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const secret = process.env.SURVEY_COOKIE_SECRET;
  if (!secret || secret.length < 32 || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json(
      { error: "A pesquisa ainda não está pronta para receber respostas." },
      { status: 503 },
    );
  const session = request.cookies.get("fhdod-survey-session")?.value || randomUUID();
  const hash = createHmac("sha256", secret).update(session).digest("hex");
  const admin = createAdminClient();
  const data = parsed.data;
  const { error } = await admin.rpc("submit_survey", {
    p_slug: slug,
    p_submission_id: data.submissionId,
    p_session_hash: hash,
    p_nps: data.nps,
    p_answers: data.answers,
    p_comment: data.comment || null,
    p_contact: data.contact || null,
    p_consent: data.consent,
  });
  const response = error
    ? NextResponse.json(
        {
          error: error.message.includes("PLEASE_WAIT")
            ? "Aguarde alguns segundos antes de enviar uma nova avaliação."
            : "Não foi possível enviar. Suas escolhas foram mantidas. Tente novamente.",
        },
        { status: error.message.includes("PLEASE_WAIT") ? 429 : 400 },
      )
    : NextResponse.json({ ok: true });
  response.cookies.set("fhdod-survey-session", session, {
    httpOnly: true,
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  // Durable outbox is delivered by the scheduled Edge Function, not a fire-and-forget request.
  return response;
}
