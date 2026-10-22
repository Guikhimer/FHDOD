import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { filterDates, parseFilters } from "@/lib/filters";
import { demoMetrics } from "@/lib/demo";
import { shifts } from "@/lib/utils";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ExportResponse = {
  id: string;
  survey_id: string;
  nps: number;
  shift: keyof typeof shifts;
  created_at: string;
  surveys: { sector_id: string; sectors: { name: string } };
};
type ExportAnswer = {
  response_id: string;
  question_id: string;
  question_text: string;
  value: number;
};
type ExportComplaint = {
  response_id: string;
  comment: string | null;
  contact: string | null;
  contact_consent: boolean;
  status: string;
};
export async function GET(request: NextRequest) {
  const profile = await requireProfile();
  let filters;
  try {
    filters = parseFilters(Object.fromEntries(request.nextUrl.searchParams));
  } catch {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
  }
  const workbook = new ExcelJS.Workbook();
  if (!hasSupabase()) {
    const sheet = workbook.addWorksheet("Demonstração");
    sheet.addRow(["Dados fictícios · não são avaliações reais"]);
    sheet.addRow(["Setor", "Avaliações", "NPS", "Média 1 a 5"]);
    demoMetrics.sectors
      .filter((s) => !filters.sector || s.id === filters.sector)
      .forEach((s) => sheet.addRow([s.name, s.total, s.nps, s.average]));
  } else {
    const client = await createClient();
    const { from, to } = filterDates(filters);
    const responseSheet = workbook.addWorksheet("Respostas");
    responseSheet.columns = [
      { header: "ID", key: "id", width: 38 },
      { header: "Setor", key: "sector", width: 30 },
      { header: "Data (São Paulo)", key: "date", width: 24 },
      { header: "Plantão", key: "shift", width: 26 },
      { header: "NPS (0 a 10)", key: "nps", width: 20 },
    ];
    const answerSheet = workbook.addWorksheet("Notas opcionais");
    answerSheet.columns = [
      { header: "Resposta", key: "response_id", width: 38 },
      { header: "Pergunta ID", key: "question_id", width: 38 },
      { header: "Pergunta no momento da resposta", key: "question_text", width: 70 },
      { header: "Nota (1 a 5)", key: "value", width: 18 },
    ];
    const complaintSheet = profile.role === "admin" ? workbook.addWorksheet("Ouvidoria") : null;
    if (complaintSheet)
      complaintSheet.columns = [
        { header: "Resposta", key: "response_id", width: 38 },
        { header: "Comentário", key: "comment", width: 60 },
        { header: "Contato", key: "contact", width: 25 },
        { header: "Autorizou contato", key: "contact_consent", width: 22 },
        { header: "Situação", key: "status", width: 22 },
      ];
    // Stable pagination avoids the Data API's default 1000-row truncation.
    const snapshot = new Date().toISOString();
    for (let offset = 0; ; offset += 500) {
      let query = client
        .from("responses")
        .select("id,survey_id,nps,shift,created_at,surveys!inner(sector_id,sectors!inner(name))")
        .lt("created_at", snapshot)
        .order("created_at")
        .order("id")
        .range(offset, offset + 499);
      if (filters.sector) query = query.eq("surveys.sector_id", filters.sector);
      if (filters.shift) query = query.eq("shift", filters.shift);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lt("created_at", to);
      const { data, error } = await query;
      if (error)
        return NextResponse.json({ error: "Não foi possível gerar o relatório." }, { status: 500 });
      const rows = data as unknown as ExportResponse[];
      if (!rows.length) break;
      rows.forEach((r) =>
        responseSheet.addRow({
          id: r.id,
          sector: r.surveys.sectors.name,
          date: new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          shift: shifts[r.shift],
          nps: r.nps,
        }),
      );
      for (let batchOffset = 0; batchOffset < rows.length; batchOffset += 100) {
        const ids = rows.slice(batchOffset, batchOffset + 100).map((r) => r.id);
        for (let answerOffset = 0; ; answerOffset += 1000) {
          const { data: answers, error: answerError } = await client
            .from("answers")
            .select("response_id,question_id,question_text,value")
            .in("response_id", ids)
            .order("id")
            .range(answerOffset, answerOffset + 999);
          if (answerError)
            return NextResponse.json(
              { error: "Não foi possível exportar as notas." },
              { status: 500 },
            );
          (answers as ExportAnswer[]).forEach((a) => answerSheet.addRow(a));
          if (answers.length < 1000) break;
        }
        if (complaintSheet) {
          const { data: complaints, error: complaintError } = await client
            .from("complaints")
            .select("response_id,comment,contact,contact_consent,status")
            .in("response_id", ids);
          if (complaintError)
            return NextResponse.json(
              { error: "Não foi possível exportar a ouvidoria." },
              { status: 500 },
            );
          (complaints as ExportComplaint[]).forEach((c) =>
            complaintSheet.addRow({ ...c, contact_consent: c.contact_consent ? "Sim" : "Não" }),
          );
        }
      }
      if (rows.length < 500) break;
    }
  }
  workbook.eachSheet((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  });
  // ExcelJS writes user strings as strings, never formula objects.
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="fhdod-satisfacao.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
