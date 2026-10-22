"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/components/ActionForm";
async function authorize(admin = false) {
  const profile = await requireProfile();
  if (!hasSupabase()) return "As alterações ficam disponíveis após configurar o Supabase.";
  if (admin && profile.role !== "admin")
    return "Esta ação está disponível apenas para administradores.";
  return null;
}
const failure = { error: "Não foi possível salvar. Confira os campos e suas permissões." };
export async function createSector(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize(true);
  if (denied) return { error: denied };
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      slug: z
        .string()
        .max(100)
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Informe o nome e um endereço usando letras minúsculas, números e hífens." };
  const client = await createClient();
  const { error } = await client.from("sectors").insert(parsed.data);
  if (error) return failure;
  revalidatePath("/dashboard/manage");
  return { success: "Setor criado. Cadastre uma pesquisa para publicar o link." };
}
export async function createSurvey(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize();
  if (denied) return { error: denied };
  const parsed = z
    .object({
      sector_id: z.uuid(),
      title: z.string().trim().min(2).max(150),
      tablet_reset_seconds: z.coerce.number().int().min(10).max(120),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure;
  const client = await createClient();
  const { error } = await client.from("surveys").insert({ ...parsed.data, status: "published" });
  if (error)
    return { error: "Não foi possível publicar. O setor pode já ter uma pesquisa publicada." };
  revalidatePath("/dashboard/manage");
  return { success: "Pesquisa publicada. O link do setor já pode receber avaliações." };
}
export async function createQuestion(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize();
  if (denied) return { error: denied };
  const profile = await requireProfile();
  const sector = form.get("sector_id");
  if (!sector && profile.role !== "admin") return failure;
  const parsed = z
    .object({
      text: z.string().trim().min(3).max(300),
      position: z.coerce.number().int().min(0).max(1000),
      sector_id: z.uuid().nullable(),
    })
    .safeParse({
      text: form.get("text"),
      position: form.get("position"),
      sector_id: sector || null,
    });
  if (!parsed.success) return failure;
  const client = await createClient();
  const { error } = await client.from("questions").insert({ ...parsed.data, kind: "rating" });
  if (error) return failure;
  revalidatePath("/dashboard/manage");
  return { success: "Pergunta adicionada à pesquisa." };
}
export async function archiveQuestion(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize();
  if (denied) return { error: denied };
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return failure;
  const client = await createClient();
  const { data, error } = await client
    .from("questions")
    .update({ active: false })
    .eq("id", id.data)
    .eq("kind", "rating")
    .select("id");
  if (error || !data?.length) return failure;
  revalidatePath("/dashboard/manage");
  return { success: "Pergunta desativada. As respostas anteriores foram preservadas." };
}
export async function inviteUser(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize(true);
  if (denied) return { error: denied };
  const parsed = z
    .object({
      email: z.email(),
      full_name: z.string().trim().min(2).max(150),
      role: z.enum(["admin", "sector_manager"]),
      sectors: z.array(z.uuid()),
    })
    .safeParse({ ...Object.fromEntries(form), sectors: form.getAll("sectors") });
  if (!parsed.success || (parsed.data.role === "sector_manager" && !parsed.data.sectors.length))
    return { error: "Confira o nome, e-mail e os setores sob responsabilidade do gestor." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });
  if (error || !data.user)
    return {
      error:
        "Não foi possível enviar o convite. Confira se o usuário já existe e se o e-mail está configurado.",
    };
  // Profiles are inactive until role and assignments are successfully configured.
  const { error: assignmentError } =
    parsed.data.role === "sector_manager"
      ? await admin
          .from("sector_managers")
          .insert(parsed.data.sectors.map((sector_id) => ({ profile_id: data.user.id, sector_id })))
      : { error: null };
  if (assignmentError)
    return {
      error:
        "Convite enviado, mas o acesso ficou inativo porque os setores não puderam ser atribuídos. Corrija o cadastro no Supabase.",
    };
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, active: true, must_change_password: true })
    .eq("id", data.user.id);
  if (profileError)
    return {
      error: "Convite enviado, mas o perfil não pôde ser ativado. Confira o cadastro no Supabase.",
    };
  revalidatePath("/dashboard/manage");
  return { success: "Convite enviado. O usuário deverá definir uma senha no primeiro acesso." };
}
export async function saveSettings(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize(true);
  if (denied) return { error: denied };
  const emails = String(form.get("emails") || "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const parsed = z.array(z.email()).max(20).safeParse(emails);
  if (!parsed.success) return { error: "Informe e-mails válidos, separados por vírgula." };
  const enabled = form.get("enabled") === "on";
  if (enabled && !emails.length)
    return { error: "Informe pelo menos um destinatário para ativar os avisos." };
  const client = await createClient();
  const { error } = await client
    .from("app_settings")
    .update({
      notification_emails: parsed.data,
      notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return failure;
  revalidatePath("/dashboard/manage");
  return { success: "Preferências de notificação salvas." };
}
export async function updateComplaint(_state: FormState, form: FormData): Promise<FormState> {
  const denied = await authorize(true);
  if (denied) return { error: denied };
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(["open", "in_progress", "closed"]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure;
  const client = await createClient();
  const { error } = await client
    .from("complaints")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) return failure;
  revalidatePath("/dashboard/manage");
  return { success: "Situação atualizada." };
}
