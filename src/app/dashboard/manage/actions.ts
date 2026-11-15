"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import type { FormState } from "@/components/ActionForm";
const failure = { error: "Não foi possível salvar. Confira os campos e suas permissões." };
async function canManage(admin = false) {
  const profile = await requireProfile();
  if (profile.role === "sector_manager") return "Gestores têm acesso somente de consulta ao dashboard.";
  if (admin && profile.role !== "admin") return "Esta ação está disponível apenas para o Admin.";
  return null;
}
export async function createSector(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const parsed = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure;
  try { await apiRequest("/sectors", { method: "POST", body: JSON.stringify(parsed.data) }); revalidatePath("/dashboard/manage"); return { success: "Setor criado." }; } catch { return failure; }
}
export async function createSurvey(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const parsed = z.object({ sector_id: z.uuid(), title: z.string().trim().min(2).max(150), tablet_reset_seconds: z.coerce.number().int().min(10).max(120) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure;
  try { await apiRequest("/surveys", { method: "POST", body: JSON.stringify(parsed.data) }); revalidatePath("/dashboard/manage"); return { success: "Pesquisa publicada." }; } catch { return { error: "Não foi possível publicar. O setor pode já ter uma pesquisa publicada." }; }
}
export async function createQuestion(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const parsed = z.object({ text: z.string().trim().min(3).max(300), position: z.coerce.number().int().min(0).max(1000), sector_id: z.uuid().nullable() }).safeParse({ ...Object.fromEntries(form), sector_id: form.get("sector_id") || null });
  if (!parsed.success) return failure;
  try { await apiRequest("/questions", { method: "POST", body: JSON.stringify(parsed.data) }); revalidatePath("/dashboard/manage"); return { success: "Pergunta adicionada." }; } catch { return failure; }
}
export async function archiveQuestion(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const id = z.uuid().safeParse(form.get("id")); if (!id.success) return failure;
  try { await apiRequest(`/questions/${id.data}`, { method: "PATCH", body: JSON.stringify({ active: false }) }); revalidatePath("/dashboard/manage"); return { success: "Pergunta desativada." }; } catch { return failure; }
}
export async function inviteUser(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage(true)) return { error: "Somente Admin pode criar logins." };
  const parsed = z.object({
    full_name: z.string().trim().min(2).max(150),
    email: z.email().max(254),
    role: z.enum(["admin", "ombudsman", "sector_manager"]),
    temporary_password: z.string().min(12).max(200),
  }).safeParse(Object.fromEntries(form));
  const sectorIds = z.array(z.uuid()).max(100).safeParse(form.getAll("sectors"));
  if (!parsed.success || !sectorIds.success) return { error: "Confira nome, e-mail, senha temporária e setores." };
  if ((parsed.data.role === "sector_manager" && !sectorIds.data.length) || (parsed.data.role !== "sector_manager" && sectorIds.data.length)) {
    return { error: "Gestores precisam de ao menos um setor; os demais perfis não recebem setores." };
  }
  try {
    await apiRequest("/users", { method: "POST", body: JSON.stringify({
      email: parsed.data.email,
      fullName: parsed.data.full_name,
      role: parsed.data.role,
      temporaryPassword: parsed.data.temporary_password,
      sectorIds: sectorIds.data,
    }) });
    revalidatePath("/dashboard/manage");
    return { success: "Conta criada. Entregue a senha temporária por um canal seguro; a troca será exigida no primeiro acesso." };
  } catch { return failure; }
}
export async function saveSettings(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const emails = String(form.get("emails") || "").split(/[\s,;]+/).filter(Boolean);
  const parsed = z.array(z.email()).max(20).safeParse(emails); const enabled = form.get("enabled") === "on";
  if (!parsed.success || (enabled && !emails.length)) return { error: "Informe destinatários válidos para ativar os avisos." };
  try { await apiRequest("/settings/notifications", { method: "PUT", body: JSON.stringify({ notification_emails: parsed.data, notifications_enabled: enabled }) }); revalidatePath("/dashboard/manage"); return { success: "Preferências salvas." }; } catch { return failure; }
}
export async function updateComplaint(_state: FormState, form: FormData): Promise<FormState> {
  if (await canManage()) return { error: "Ação não autorizada." };
  const parsed = z.object({ id: z.uuid(), status: z.enum(["open", "in_progress", "closed"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure;
  try { await apiRequest(`/complaints/${parsed.data.id}`, { method: "PATCH", body: JSON.stringify({ status: parsed.data.status }) }); revalidatePath("/dashboard/manage"); return { success: "Situação atualizada." }; } catch { return failure; }
}
