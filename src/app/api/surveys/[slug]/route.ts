import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/survey-validation";
export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).origin;
  if (request.headers.get("origin") !== siteOrigin) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const { slug } = await params;
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16384) return NextResponse.json({ error: "Dados muito extensos." }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Confira as respostas e tente novamente." }, { status: 400 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl) return NextResponse.json({ ok: true, demonstration: true }, { headers: { "Cache-Control": "no-store" } });
  const response = await fetch(`${apiUrl}/api/v1/surveys/public/${encodeURIComponent(slug)}/responses`, {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "Idempotency-Key": parsed.data.submissionId },
    body: JSON.stringify({ attendedAt: parsed.data.attendedAt, npsScore: parsed.data.nps, answers: parsed.data.answers.map((answer) => ({ questionId: answer.question_id, score: answer.value, questionText: answer.question_text })), ...(parsed.data.comment || parsed.data.contact ? { complaint: { comment: parsed.data.comment || null, contact: parsed.data.contact || undefined, consent: parsed.data.consent } } : {}) }),
  });
  if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Aguarde um pouco e tente novamente." : "Não foi possível enviar. Suas respostas foram mantidas." }, { status: response.status === 429 ? 429 : 400 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
