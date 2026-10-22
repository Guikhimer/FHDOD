import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
let db: PGlite;
const adminId = "40000000-0000-4000-8000-000000000001";
const managerId = "40000000-0000-4000-8000-000000000002";
const otherId = "40000000-0000-4000-8000-000000000003";
const sector1 = "10000000-0000-4000-8000-000000000001";
const sector2 = "10000000-0000-4000-8000-000000000002";
let question1: string;
let question2: string;
async function asRole<T>(
  role: "anon" | "authenticated" | "service_role",
  user: string | null,
  query: string,
  params: unknown[] = [],
) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user || ""]);
  try {
    return await db.query<T>(query, params);
  } finally {
    await db.exec("reset role");
  }
}
async function submit(
  slug: string,
  nps: number,
  answers: { question_id: string; value: number }[] = [],
  options: {
    id?: string;
    session?: string;
    comment?: string;
    contact?: string;
    consent?: boolean;
  } = {},
) {
  return asRole<{ id: string }>(
    "service_role",
    null,
    "select public.submit_survey($1,$2,$3,$4,$5::jsonb,$6,$7,$8) as id",
    [
      slug,
      options.id || randomUUID(),
      options.session || randomUUID().replaceAll("-", "").repeat(2),
      nps,
      JSON.stringify(answers),
      options.comment || null,
      options.contact || null,
      options.consent || false,
    ],
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to service_role;
    create publication supabase_realtime;
  `);
  await db.exec(await readFile("supabase/migrations/202610020001_initial_schema.sql", "utf8"));
  await db.exec(await readFile("supabase/seed.sql", "utf8"));
  await db.query("insert into auth.users(id) values ($1),($2),($3)", [adminId, managerId, otherId]);
  await db.query(
    "update public.profiles set active=true,must_change_password=false,role=case when id=$1 then 'admin'::public.app_role else 'sector_manager'::public.app_role end",
    [adminId],
  );
  await db.query(
    "insert into public.sector_managers(profile_id,sector_id) values ($1,$2),($3,$4)",
    [managerId, sector1, otherId, sector2],
  );
  const questions = await db.query<{ id: string; sector_id: string }>(
    "select id,sector_id from public.questions where sector_id is not null and position=0",
  );
  question1 = questions.rows.find((q) => q.sector_id === sector1)!.id;
  question2 = questions.rows.find((q) => q.sector_id === sector2)!.id;
});
afterAll(async () => {
  await db?.close();
});
describe.sequential("SQL, RLS and transactional submission", () => {
  it("publishes only active questions and denies anonymous result access and direct submission", async () => {
    const publicRead = await asRole<{ survey: { questions: { kind: string }[] } }>(
      "anon",
      null,
      "select get_public_survey('pronto-atendimento') as survey",
    );
    expect(publicRead.rows[0].survey.questions.at(-1)?.kind).toBe("nps");
    await expect(asRole("anon", null, "select * from public.responses")).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole("anon", null, "select submit_survey('pronto-atendimento',$1,$2,10,'[]')", [
        randomUUID(),
        "a".repeat(64),
      ]),
    ).rejects.toThrow(/permission denied/);
  });
  it("ignores untrusted role metadata and blocks manager privilege escalation", async () => {
    const newId = randomUUID();
    await db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2)", [
      newId,
      { role: "admin", active: true },
    ]);
    const row = await db.query<{ role: string; active: boolean; must_change_password: boolean }>(
      "select role,active,must_change_password from public.profiles where id=$1",
      [newId],
    );
    expect(row.rows[0]).toEqual({
      role: "sector_manager",
      active: false,
      must_change_password: true,
    });
    const update = await asRole(
      "authenticated",
      managerId,
      "update public.profiles set role='admin' where id=$1 returning id",
      [managerId],
    );
    expect(update.rows).toHaveLength(0);
  });
  it("accepts NPS zero and skipped questions, retries without double counting, throttles new requests", async () => {
    const id = randomUUID();
    const session = "b".repeat(64);
    const first = await submit("pronto-atendimento", 0, [], { id, session });
    const second = await submit("pronto-atendimento", 0, [], { id, session });
    expect(second.rows[0].id).toBe(first.rows[0].id);
    await expect(submit("pronto-atendimento", 10, [], { session })).rejects.toThrow("PLEASE_WAIT");
  });
  it("rejects invalid, cross-sector and duplicate answers atomically", async () => {
    const before = await db.query<{ count: number }>(
      "select count(*)::int as count from public.responses",
    );
    await expect(submit("pronto-atendimento", 11)).rejects.toThrow("INVALID_SUBMISSION");
    await expect(
      submit("pronto-atendimento", 7, [{ question_id: question2, value: 1 }]),
    ).rejects.toThrow("INVALID_ANSWERS");
    await expect(
      submit("pronto-atendimento", 7, [{ question_id: question1, value: 1.4 }]),
    ).rejects.toThrow("INVALID_ANSWERS");
    await expect(
      submit("pronto-atendimento", 7, Array(2).fill({ question_id: question1, value: 5 })),
    ).rejects.toThrow("INVALID_ANSWERS");
    await expect(
      submit("pronto-atendimento", 7, [{ question_id: question1, value: 2 }], {
        contact: "51999999999",
      }),
    ).rejects.toThrow("CONTACT_CONSENT_REQUIRED");
    const after = await db.query<{ count: number }>(
      "select count(*)::int as count from public.responses",
    );
    expect(after.rows).toEqual(before.rows);
  });
  it("creates low-score complaints and outbox, and hides contact from sector managers", async () => {
    const response = await submit("pronto-atendimento", 4, [{ question_id: question1, value: 2 }], {
      comment: "Esperamos muito",
      contact: "51999999999",
      consent: true,
    });
    const admin = await asRole<{ contact: string }>(
      "authenticated",
      adminId,
      "select contact from public.complaints where response_id=$1",
      [response.rows[0].id],
    );
    expect(admin.rows[0].contact).toBe("51999999999");
    const manager = await asRole("authenticated", managerId, "select * from public.complaints");
    expect(manager.rows).toHaveLength(0);
    await expect(
      asRole("authenticated", managerId, "select * from private.submission_keys"),
    ).rejects.toThrow(/permission denied/);
    const jobs = await db.query<{ count: number }>(
      "select count(*)::int as count from private.notification_jobs",
    );
    expect(jobs.rows[0].count).toBe(1);
  });
  it("limits managers to assigned sectors and prevents editing general questions", async () => {
    await submit("internacao", 10, [{ question_id: question2, value: 5 }]);
    const manager = await asRole<{ sector_id: string }>(
      "authenticated",
      managerId,
      "select s.sector_id from public.responses r join public.surveys s on s.id=r.survey_id",
    );
    expect(manager.rows.length).toBeGreaterThan(0);
    expect(manager.rows.every((r) => r.sector_id === sector1)).toBe(true);
    const edit = await asRole(
      "authenticated",
      managerId,
      "update public.questions set text='Alteração indevida' where sector_id is null returning id",
    );
    expect(edit.rows).toHaveLength(0);
    await expect(
      asRole(
        "authenticated",
        managerId,
        "insert into public.questions(sector_id,text) values ($1,'Pergunta indevida')",
        [sector2],
      ),
    ).rejects.toThrow(/row-level security/);
  });
  it("keeps NPS and optional ratings separate and obeys RLS in aggregates", async () => {
    const metrics = await asRole<{
      metrics: {
        total: number;
        nps: number;
        average: number;
        satisfaction: number;
        distribution: { value: number; count: number }[];
      };
    }>("authenticated", managerId, "select public.dashboard_metrics() as metrics");
    expect(metrics.rows[0].metrics).toMatchObject({
      total: 2,
      nps: -100,
      average: 2,
      satisfaction: 0,
    });
    expect(metrics.rows[0].metrics.distribution.find((d) => d.value === 2)?.count).toBe(1);
    await db.query("update public.profiles set must_change_password=true where id=$1", [managerId]);
    const blocked = await asRole<{ count: number }>(
      "authenticated",
      managerId,
      "select count(*)::int as count from public.responses",
    );
    expect(blocked.rows[0].count).toBe(0);
    await db.query("update public.profiles set must_change_password=false where id=$1", [
      managerId,
    ]);
  });
  it("claims notifications once and makes failures retryable", async () => {
    await db.exec(
      "update public.app_settings set notifications_enabled=true,notification_emails=ARRAY['admin@example.org']",
    );
    const claimed = await asRole<{
      jobs: { id: string; recipients: string[]; contact?: string }[];
    }>("service_role", null, "select claim_notification_jobs() as jobs");
    expect(claimed.rows[0].jobs).toHaveLength(1);
    expect(claimed.rows[0].jobs[0].contact).toBeUndefined();
    const again = await asRole<{ jobs: unknown[] }>(
      "service_role",
      null,
      "select claim_notification_jobs() as jobs",
    );
    expect(again.rows[0].jobs).toHaveLength(0);
    await asRole("service_role", null, "select finish_notification_job($1,false,'Test failure')", [
      claimed.rows[0].jobs[0].id,
    ]);
    const job = await db.query<{ last_error: string; locked_until: null; delivered_at: null }>(
      "select last_error,locked_until,delivered_at from private.notification_jobs",
    );
    expect(job.rows[0]).toEqual({
      last_error: "Test failure",
      locked_until: null,
      delivered_at: null,
    });
  });
});
