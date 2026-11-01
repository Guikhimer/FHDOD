import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";
import { requireProfile } from "@/lib/auth";
import { filterDates, parseFilters } from "@/lib/filters";
import { z } from "zod";
const reportPageSchema = z.object({ items: z.array(z.object({
  id: z.uuid(), sector_id: z.uuid(), sector_name: z.string(), nps: z.number().int().min(0).max(10),
  attended_at: z.string().nullable(), created_at: z.string(),
  answers: z.array(z.object({ questionId: z.uuid(), questionText: z.string(), score: z.number().int().min(1).max(5) })),
  complaint: z.object({ comment: z.string().nullable(), contact: z.string().nullable(), contactConsent: z.boolean(), status: z.enum(["open", "in_progress", "closed"]) }).nullable(),
})), limit: z.number(), offset: z.number() });
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ReportRow = { id: string; sector_id: string; sector_name: string; nps: number; attended_at: string | null; created_at: string; answers: { questionId: string; questionText: string; score: number }[]; complaint: { comment: string | null; contact: string | null; contactConsent: boolean; status: string } | null };
export async function GET(request: NextRequest) {
  const profile = await requireProfile();
  if (profile.role === "sector_manager") return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  let filters;
  try { filters = parseFilters(Object.fromEntries(request.nextUrl.searchParams)); }
  catch { return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 }); }
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      const demoBook = new ExcelJS.Workbook();
      const demoSheet = demoBook.addWorksheet("Demonstração");
      demoSheet.addRow(["DADOS FICTÍCIOS · DEMONSTRAÇÃO"]);
      demoSheet.addRow(["Setor", "Total de respostas", "NPS"]);
      demoSheet.addRow(["Pronto Atendimento", 0, "—"]);
      demoSheet.getRow(1).font = { bold: true };
      demoSheet.getRow(2).font = { bold: true };
      const demoBytes = await demoBook.xlsx.writeBuffer();
      return new NextResponse(new Uint8Array(demoBytes), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="fhdod-demonstracao.xlsx"', "Cache-Control": "private, no-store" } });
    }
    const { from, to } = filterDates(filters);
    const query = new URLSearchParams();
    if (filters.sector) query.set("sectorId", filters.sector);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const rows: ReportRow[] = [];
    for (let offset = 0; offset <= 100000; offset += 100) {
      query.set("limit", "100"); query.set("offset", String(offset));
      const page = await apiRequest(`/reports/responses?${query}`, {}, reportPageSchema);
      rows.push(...page.items);
      if (page.items.length < 100) break;
      if (offset === 100000) return NextResponse.json({ error: "Use filtros para reduzir o relatório e exportar todos os registros." }, { status: 413 });
    }
    const book = new ExcelJS.Workbook();
    const responses = book.addWorksheet("Respostas");
    responses.addRow(["ID", "Setor", "Data do atendimento", "Data do envio", "NPS (0 a 10)"]);
    for (const row of rows) responses.addRow([row.id, row.sector_name, row.attended_at ? new Date(row.attended_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "", new Date(row.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), row.nps]);
    const answers = book.addWorksheet("Notas das perguntas");
    answers.addRow(["Resposta", "Pergunta", "Nota (1 a 5)"]);
    for (const row of rows) for (const answer of row.answers ?? []) answers.addRow([row.id, answer.questionText, answer.score]);
    if (profile.role === "admin" || profile.role === "ombudsman") {
      const complaints = book.addWorksheet("Ouvidoria");
      complaints.addRow(["Resposta", "Comentário", "Contato", "Consentimento", "Status"]);
      for (const row of rows) if (row.complaint) complaints.addRow([row.id, row.complaint.comment, row.complaint.contact, row.complaint.contactConsent ? "Sim" : "Não", row.complaint.status]);
    }
    book.eachSheet((sheet) => { sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }]; });
    const bytes = await book.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="fhdod-satisfacao.xlsx"', "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Não foi possível gerar o relatório." }, { status: 502 }); }
}
