import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getSectors } from "@/lib/dashboard";
import { apiRequest } from "@/lib/api";
import { redirect } from "next/navigation";
import { demoSurvey } from "@/lib/demo";
import { ActionForm } from "@/components/ActionForm";
import {
  createSector,
  createSurvey,
  createQuestion,
  archiveQuestion,
  inviteUser,
  saveSettings,
  updateComplaint,
} from "./actions";
import type { Question } from "@/types";
import { complaintSchema, managedUserSchema, notificationSettingsSchema, questionSchema } from "@/lib/api-schemas";
import { z } from "zod";
type Complaint = {
  id: string;
  comment: string | null;
  contact: string | null;
  status: string;
  created_at: string;
};
type ManagedUser = { id: string; email: string; full_name: string; role: "admin" | "ombudsman" | "sector_manager"; active: boolean; mustChangePassword: boolean; created_at: string };
export default async function Manage() {
  const profile = await requireProfile();
  if (profile.role === "sector_manager") redirect("/dashboard");
  const sectors = await getSectors();
  const demo = !process.env.NEXT_PUBLIC_API_URL;
  let questions: Question[] = demoSurvey("pronto-atendimento")!.questions;
  let complaints: Complaint[] = [];
  let users: ManagedUser[] = [];
  let emails = "";
  let enabled = false;
  if (!demo) {
    questions = await apiRequest<Question[]>("/questions", {}, questionSchema.array());
    const settings = await apiRequest<{ notification_emails: string[]; notifications_enabled: boolean }>("/settings/notifications", {}, notificationSettingsSchema);
    emails = settings.notification_emails.join(", "); enabled = settings.notifications_enabled;
    const feedback = await apiRequest<{ items: Complaint[] }>("/complaints?limit=50&offset=0", {}, z.object({ items: complaintSchema.array(), limit: z.number(), offset: z.number() })); complaints = feedback.items;
    if (profile.role === "admin") users = await apiRequest<ManagedUser[]>("/users", {}, managedUserSchema.array());
  }
  const sectorOptions = sectors.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PESQUISAS E GESTÃO</p>
          <h1>Organize a escuta.</h1>
          <p>{profile.role === "admin" ? "Administração completa do sistema." : "Gestão de pesquisas e acompanhamento da Ouvidoria."}</p>
        </div>
      </div>
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Links das pesquisas</h2>
            <p>Use o modo tablet para voltar automaticamente à tela inicial.</p>
          </div>
        </div>
        <div className="sector-links">
          {sectors.map((s) => (
            <div key={s.id}>
              <strong>{s.name}</strong>
              <Link href={`/p/${s.slug}`}>
                Abrir pesquisa <ExternalLink size={18} aria-hidden="true" />
              </Link>
              <Link href={`/p/${s.slug}?tablet=1`}>
                Modo tablet <ExternalLink size={18} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <div className="manage-grid">
          <section className="management-card">
            <h2>Criar setor</h2>
            <ActionForm action={createSector} label="Criar setor" disabled={demo}>
              <label htmlFor="sector-name">Nome do setor</label>
              <input id="sector-name" name="name" maxLength={100} required />
              <label htmlFor="sector-slug">Endereço do setor</label>
              <input
                id="sector-slug"
                name="slug"
                placeholder="pronto-atendimento"
                maxLength={100}
                required
              />
              <p className="field-help">
                Letras minúsculas e hífens. Exemplo: /p/pronto-atendimento.
              </p>
            </ActionForm>
          </section>
        <section className="management-card">
          <h2>Publicar pesquisa</h2>
          <ActionForm action={createSurvey} label="Publicar pesquisa" disabled={demo}>
            <label htmlFor="survey-sector">Setor</label>
            <select id="survey-sector" name="sector_id" required>
              {sectorOptions}
            </select>
            <label htmlFor="survey-title">Título</label>
            <input
              id="survey-title"
              name="title"
              defaultValue="Como foi o seu atendimento?"
              maxLength={150}
              required
            />
            <label htmlFor="reset-seconds">Reiniciar tablet após (segundos)</label>
            <input
              id="reset-seconds"
              name="tablet_reset_seconds"
              type="number"
              min={10}
              max={120}
              defaultValue={20}
              required
            />
          </ActionForm>
        </section>
        <section className="management-card">
          <h2>Adicionar pergunta</h2>
          <ActionForm action={createQuestion} label="Adicionar pergunta" disabled={demo}>
            <label htmlFor="question-sector">Onde exibir?</label>
            <select id="question-sector" name="sector_id">
              <option value="">Geral · todos os setores</option>
              {sectorOptions}
            </select>
            <label htmlFor="question-text">Texto da pergunta</label>
            <textarea id="question-text" name="text" rows={3} maxLength={300} required />
            <label htmlFor="question-position">Ordem da pergunta</label>
            <input
              id="question-position"
              name="position"
              type="number"
              min={0}
              max={1000}
              defaultValue={0}
              required
            />
            <p className="field-help">
              Perguntas setoriais vêm primeiro, depois as gerais e o NPS obrigatório.
            </p>
          </ActionForm>
        </section>
      </div>
      <section className="table-card">
        <div className="section-heading">
          <h2>Perguntas ativas</h2>
        </div>
        <div className="question-list">
          {questions.map((q) => (
            <article key={q.id}>
              <div>
                <span className="small-tag">
                  {q.kind === "nps"
                    ? "NPS · obrigatória"
                    : q.sector_id
                      ? sectors.find((s) => s.id === q.sector_id)?.name
                      : "Geral · opcional"}
                </span>
                <p>{q.text}</p>
              </div>
              {q.kind === "rating" && (
                <ActionForm action={archiveQuestion} label="Desativar" disabled={demo}>
                  <input type="hidden" name="id" value={q.id} />
                </ActionForm>
              )}
            </article>
          ))}
        </div>
      </section>
        <>
          <div className="manage-grid">
            {profile.role === "admin" && <section className="management-card">
              <h2>Criar acesso</h2>
              <ActionForm action={inviteUser} label="Criar conta" disabled={demo}>
                <label htmlFor="invite-name">Nome</label>
                <input id="invite-name" name="full_name" maxLength={150} required />
                <label htmlFor="invite-email">E-mail</label>
                <input id="invite-email" name="email" type="email" required />
                <label htmlFor="invite-role">Perfil de acesso</label>
                <select id="invite-role" name="role" defaultValue="sector_manager">
                  <option value="sector_manager">Gestor de setor</option>
                  <option value="ombudsman">Ouvidoria</option>
                  <option value="admin">Admin</option>
                </select>
                <label htmlFor="invite-password">Senha temporária</label>
                <input id="invite-password" name="temporary_password" type="password" minLength={12} maxLength={200} autoComplete="new-password" required />
                <div className="checkbox-group">
                  <p>Setores do gestor</p>
                  {sectors.map((s) => (
                    <label key={s.id}>
                      <input type="checkbox" name="sectors" value={s.id} />
                      {s.name}
                    </label>
                  ))}
                </div>
                <p className="field-help">A conta exigirá a troca da senha no primeiro acesso. Compartilhe a senha temporária por canal seguro.</p>
              </ActionForm>
            </section>}
            <section className="management-card">
              <h2>Avisos para a administração</h2>
              <ActionForm action={saveSettings} label="Salvar preferências" disabled={demo}>
                <label htmlFor="notification-emails">E-mails para avisos de notas 1 ou 2</label>
                <textarea
                  id="notification-emails"
                  name="emails"
                  rows={3}
                  defaultValue={emails}
                  placeholder="equipe@hospital.org.br"
                />
                <label className="consent-label">
                  <input type="checkbox" name="enabled" defaultChecked={enabled} />
                  <span>Receber avisos por e-mail</span>
                </label>
                <p className="field-help">As preferências são armazenadas pela API. A entrega só estará ativa quando o worker de e-mail do backend for configurado.</p>
              </ActionForm>
            </section>
          </div>
          {profile.role === "admin" && <section className="table-card">
            <div className="section-heading"><h2>Pessoas da equipe</h2></div>
            {users.length ? <div className="question-list">{users.map((user) => <article key={user.id}>
              <div><strong>{user.full_name}</strong><p>{user.email}</p></div>
              <span className="small-tag">{user.role === "sector_manager" ? "Gestor" : user.role === "ombudsman" ? "Ouvidoria" : "Admin"}{user.mustChangePassword ? " · troca de senha pendente" : ""}{!user.active ? " · inativo" : ""}</span>
            </article>)}</div> : <p className="empty-state">Nenhuma conta cadastrada.</p>}
          </section>}
          <section className="table-card">
            <div className="section-heading">
              <div>
                <h2>Ouvidoria</h2>
                <p>50 registros mais recentes de avaliações com notas 1 ou 2.</p>
              </div>
            </div>
            {complaints.length ? (
              <div className="complaint-list">
                {complaints.map((c) => (
                  <article key={c.id}>
                    <time dateTime={c.created_at}>
                      {new Date(c.created_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </time>
                    <p>{c.comment || "Sem comentário informado."}</p>
                    <p>Contato: {c.contact || "Não informado"}</p>
                    <ActionForm action={updateComplaint} label="Atualizar situação">
                      <input name="id" type="hidden" value={c.id} />
                      <label htmlFor={`status-${c.id}`}>Situação</label>
                      <select id={`status-${c.id}`} name="status" defaultValue={c.status}>
                        <option value="open">Aberta</option>
                        <option value="in_progress">Em atendimento</option>
                        <option value="closed">Concluída</option>
                      </select>
                    </ActionForm>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Nenhum registro de ouvidoria para exibir.</p>
            )}
          </section>
        </>
    </>
  );
}
