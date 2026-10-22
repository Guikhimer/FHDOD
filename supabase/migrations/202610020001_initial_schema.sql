-- FHDOD: run on a fresh Supabase database before deploying the application.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create type public.app_role as enum ('admin', 'sector_manager');
create type public.survey_status as enum ('draft', 'published', 'archived');
create type public.question_kind as enum ('rating', 'nps');
create type public.work_shift as enum ('morning', 'afternoon', 'night');
create type public.complaint_status as enum ('open', 'in_progress', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 150),
  role public.app_role not null default 'sector_manager',
  active boolean not null default false,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.sector_managers (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sector_id uuid not null references public.sectors(id) on delete cascade,
  primary key (profile_id, sector_id)
);
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors(id) on delete restrict,
  title text not null check (length(title) between 2 and 150),
  status public.survey_status not null default 'draft',
  tablet_reset_seconds integer not null default 20 check (tablet_reset_seconds between 10 and 120),
  created_at timestamptz not null default now()
);
create unique index one_published_survey_per_sector on public.surveys(sector_id) where status = 'published';
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete restrict,
  kind public.question_kind not null default 'rating',
  text text not null check (length(text) between 3 and 300),
  position integer not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint global_nps check (kind <> 'nps' or sector_id is null)
);
create unique index single_active_nps on public.questions(kind) where kind = 'nps' and active;
insert into public.questions(kind, text) values ('nps', 'De 0 a 10, quanto você recomendaria este hospital a um familiar ou amigo?');
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete restrict,
  nps smallint not null check (nps between 0 and 10),
  shift public.work_shift not null,
  created_at timestamptz not null default now()
);
create index responses_by_survey_date on public.responses(survey_id, created_at desc);
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_text text not null,
  value smallint not null check (value between 1 and 5),
  unique(response_id, question_id)
);
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.responses(id) on delete cascade,
  comment text check (length(comment) <= 2000),
  contact text check (length(contact) <= 30),
  contact_consent boolean not null default false,
  status public.complaint_status not null default 'open',
  created_at timestamptz not null default now(),
  check (contact is null or contact_consent)
);
create table public.app_settings (
  id boolean primary key default true check (id),
  notification_emails text[] not null default '{}',
  notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.app_settings(id) values (true);
-- Identifiers and email delivery state are never exposed through the Data API.
create table private.submission_keys (
  survey_id uuid not null references public.surveys(id),
  submission_id uuid not null,
  response_id uuid not null references public.responses(id) on delete cascade,
  session_hash text not null,
  created_at timestamptz not null default now(),
  primary key(survey_id, submission_id)
);
create index recent_submission_sessions on private.submission_keys(session_hash, created_at desc);
create table private.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null unique references public.complaints(id) on delete cascade,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  delivered_at timestamptz,
  last_error text
);

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and active and not must_change_password);
$$;
create function private.can_manage_sector(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists (
    select 1 from public.sector_managers sm join public.profiles p on p.id = sm.profile_id
    where p.id = (select auth.uid()) and p.active and not p.must_change_password and sm.sector_id = target
  );
$$;
create function private.can_read_response(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.responses r join public.surveys s on s.id = r.survey_id where r.id = target and private.can_manage_sector(s.sector_id));
$$;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(), private.can_manage_sector(uuid), private.can_read_response(uuid) to authenticated;

create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 150));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();

alter table public.profiles enable row level security;
alter table public.sectors enable row level security;
alter table public.sector_managers enable row level security;
alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.complaints enable row level security;
alter table public.app_settings enable row level security;
alter table private.submission_keys enable row level security;
alter table private.notification_jobs enable row level security;

-- Public clients cannot enumerate staff/results or insert arbitrary responses.
revoke all on public.profiles, public.sectors, public.sector_managers, public.surveys, public.questions,
  public.responses, public.answers, public.complaints, public.app_settings from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.sectors, public.sector_managers,
  public.surveys, public.questions, public.app_settings to authenticated;
grant select on public.responses, public.answers to authenticated;
grant select, update on public.complaints to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy profiles_admin on public.profiles for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy sectors_read on public.sectors for select to authenticated using (private.can_manage_sector(id));
create policy sectors_admin on public.sectors for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy managers_read on public.sector_managers for select to authenticated using (profile_id = (select auth.uid()) or private.is_admin());
create policy managers_admin on public.sector_managers for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy surveys_staff on public.surveys for all to authenticated using (private.can_manage_sector(sector_id)) with check (private.can_manage_sector(sector_id));
create policy questions_read on public.questions for select to authenticated using (sector_id is null or private.can_manage_sector(sector_id));
create policy questions_write on public.questions for all to authenticated
  using ((sector_id is null and private.is_admin()) or (sector_id is not null and private.can_manage_sector(sector_id)))
  with check ((sector_id is null and private.is_admin()) or (sector_id is not null and private.can_manage_sector(sector_id)));
create policy responses_staff on public.responses for select to authenticated using (exists(select 1 from public.surveys s where s.id = survey_id and private.can_manage_sector(s.sector_id)));
create policy answers_staff on public.answers for select to authenticated using (private.can_read_response(response_id));
create policy complaints_admin on public.complaints for select to authenticated using (private.is_admin());
create policy complaints_update_admin on public.complaints for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy settings_admin on public.app_settings for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Narrow public read: only a published survey and its currently active questions.
create function public.get_public_survey(sector_slug text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object('id', s.id, 'title', s.title, 'sector_id', sec.id, 'sector_name', sec.name,
    'sector_slug', sec.slug, 'tablet_reset_seconds', s.tablet_reset_seconds,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'text', q.text, 'kind', q.kind, 'sector_id', q.sector_id, 'position', q.position)
      order by case when q.kind = 'nps' then 2 when q.sector_id is null then 1 else 0 end, q.position, q.id)
      from public.questions q where q.active and (q.sector_id = sec.id or q.sector_id is null)), '[]'::jsonb)) into result
  from public.surveys s join public.sectors sec on sec.id = s.sector_id
  where sec.slug = sector_slug and sec.active and s.status = 'published';
  return result;
end; $$;
revoke all on function public.get_public_survey(text) from public;
grant execute on function public.get_public_survey(text) to anon, authenticated, service_role;

-- Called only by the Next.js server with a service key. All writes are atomic.
create function public.submit_survey(
  p_slug text, p_submission_id uuid, p_session_hash text, p_nps integer,
  p_answers jsonb, p_comment text default null, p_contact text default null, p_consent boolean default false
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_survey public.surveys; v_sector uuid; v_id uuid; v_complaint uuid; v_low boolean;
  v_hour integer; v_shift public.work_shift;
begin
  if p_nps is null or p_nps < 0 or p_nps > 10 or p_session_hash is null or length(p_session_hash) <> 64 or p_submission_id is null then
    raise exception 'INVALID_SUBMISSION';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then raise exception 'INVALID_ANSWERS'; end if;
  if jsonb_array_length(p_answers) > 100 then raise exception 'TOO_MANY_ANSWERS'; end if;
  select s.* into v_survey from public.surveys s join public.sectors sec on sec.id = s.sector_id
    where sec.slug = p_slug and sec.active and s.status = 'published' for share of s, sec;
  if v_survey.id is null then raise exception 'SURVEY_NOT_AVAILABLE'; end if;
  v_sector := v_survey.sector_id;
  perform pg_advisory_xact_lock(hashtextextended(p_session_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended(v_survey.id::text || p_submission_id::text, 1));
  select response_id into v_id from private.submission_keys where survey_id = v_survey.id and submission_id = p_submission_id;
  if v_id is not null then return v_id; end if;
  if exists(select 1 from private.submission_keys where session_hash = p_session_hash and created_at > now() - interval '8 seconds') then
    raise exception 'PLEASE_WAIT';
  end if;
  -- Lock first so an administrator cannot retire/move a question between validation and insertion.
  perform 1 from public.questions q join jsonb_to_recordset(p_answers) as a(question_id uuid, value numeric) on q.id = a.question_id for share of q;
  if exists (
    select 1 from jsonb_to_recordset(p_answers) as a(question_id uuid, value numeric)
    left join public.questions q on q.id = a.question_id
    where q.id is null or not q.active or q.kind <> 'rating' or (q.sector_id is not null and q.sector_id <> v_sector)
      or a.value is null or a.value < 1 or a.value > 5 or a.value <> trunc(a.value)
  ) or (select count(*) <> count(distinct question_id) from jsonb_to_recordset(p_answers) as a(question_id uuid, value numeric)) then
    raise exception 'INVALID_ANSWERS';
  end if;
  if not exists(select 1 from public.questions where kind = 'nps' and active) then raise exception 'NPS_NOT_CONFIGURED'; end if;
  v_low := exists(select 1 from jsonb_to_recordset(p_answers) as a(question_id uuid, value numeric) where value < 3);
  if length(coalesce(p_comment, '')) > 2000 or length(coalesce(p_contact, '')) > 30 then raise exception 'INVALID_COMPLAINT'; end if;
  if nullif(trim(p_contact), '') is not null and not coalesce(p_consent, false) then raise exception 'CONTACT_CONSENT_REQUIRED'; end if;
  if not v_low and (nullif(trim(p_comment), '') is not null or nullif(trim(p_contact), '') is not null) then raise exception 'UNEXPECTED_COMPLAINT'; end if;
  v_hour := extract(hour from now() at time zone 'America/Sao_Paulo');
  v_shift := case when v_hour >= 7 and v_hour < 13 then 'morning' when v_hour >= 13 and v_hour < 19 then 'afternoon' else 'night' end;
  insert into public.responses(survey_id, nps, shift) values (v_survey.id, p_nps, v_shift) returning id into v_id;
  insert into public.answers(response_id, question_id, question_text, value)
    select v_id, q.id, q.text, a.value::smallint from jsonb_to_recordset(p_answers) as a(question_id uuid, value numeric) join public.questions q on q.id = a.question_id;
  insert into private.submission_keys(survey_id, submission_id, response_id, session_hash) values (v_survey.id, p_submission_id, v_id, p_session_hash);
  if v_low then
    insert into public.complaints(response_id, comment, contact, contact_consent)
      values (v_id, nullif(trim(p_comment), ''), nullif(trim(p_contact), ''), coalesce(p_consent, false)) returning id into v_complaint;
    insert into private.notification_jobs(complaint_id) values (v_complaint);
  end if;
  return v_id;
end; $$;
revoke all on function public.submit_survey(text, uuid, text, integer, jsonb, text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_survey(text, uuid, text, integer, jsonb, text, text, boolean) to service_role;

-- Aggregates obey the caller's RLS and contain no comments, contact or session keys.
create function public.dashboard_metrics(p_sector uuid default null, p_from timestamptz default null, p_to timestamptz default null, p_shift public.work_shift default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with selected as (
    select r.*, s.sector_id from public.responses r join public.surveys s on s.id = r.survey_id
    where (p_sector is null or s.sector_id = p_sector) and (p_from is null or r.created_at >= p_from)
      and (p_to is null or r.created_at < p_to) and (p_shift is null or r.shift = p_shift)
  ), ratings as (select a.* from public.answers a join selected r on r.id = a.response_id)
  select jsonb_build_object(
    'total', (select count(*) from selected),
    'nps', (select round(100.0 * (count(*) filter (where nps >= 9) - count(*) filter (where nps <= 6)) / nullif(count(*), 0), 1) from selected),
    'average', (select round(avg(value), 2) from ratings),
    'satisfaction', (select round(100.0 * count(*) filter (where value >= 4) / nullif(count(*), 0), 1) from ratings),
    'promoters', (select count(*) from selected where nps >= 9),
    'passives', (select count(*) from selected where nps between 7 and 8),
    'detractors', (select count(*) from selected where nps <= 6),
    'ratings', (select count(*) from ratings),
    'distribution', (select jsonb_agg(jsonb_build_object('value', score, 'count', (select count(*) from ratings where value = score)) order by score) from generate_series(1,5) score),
    'sectors', coalesce((select jsonb_agg(jsonb_build_object('id', sec.id, 'name', sec.name,
      'total', (select count(*) from selected where sector_id = sec.id),
      'nps', (select round(100.0 * (count(*) filter (where nps >= 9) - count(*) filter (where nps <= 6)) / nullif(count(*),0), 1) from selected where sector_id = sec.id),
      'average', (select round(avg(a.value),2) from ratings a join selected r on r.id = a.response_id where r.sector_id = sec.id)) order by sec.name)
      from public.sectors sec where p_sector is null or sec.id = p_sector), '[]'::jsonb)
  );
$$;
revoke all on function public.dashboard_metrics(uuid, timestamptz, timestamptz, public.work_shift) from public, anon;
grant execute on function public.dashboard_metrics(uuid, timestamptz, timestamptz, public.work_shift) to authenticated;

create function public.claim_notification_jobs() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not exists(select 1 from public.app_settings where notifications_enabled and cardinality(notification_emails) > 0) then return '[]'::jsonb; end if;
  with jobs as (
    select id from private.notification_jobs where delivered_at is null and available_at <= now()
      and (locked_until is null or locked_until < now()) order by available_at limit 10 for update skip locked
  ), claimed as (
    update private.notification_jobs j set attempts = attempts + 1, locked_until = now() + interval '5 minutes'
    from jobs where j.id = jobs.id returning j.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id', j.id, 'complaint_id', j.complaint_id, 'sector', s.name,
      'created_at', c.created_at, 'recipients', cfg.notification_emails)), '[]'::jsonb) into v_result
    from claimed j join public.complaints c on c.id = j.complaint_id join public.responses r on r.id = c.response_id
    join public.surveys survey on survey.id = r.survey_id join public.sectors s on s.id = survey.sector_id cross join public.app_settings cfg;
  return v_result;
end; $$;
create function public.finish_notification_job(p_id uuid, p_success boolean, p_error text default null) returns void language sql security definer set search_path = '' as $$
  update private.notification_jobs set locked_until = null, delivered_at = case when p_success then now() else null end,
    available_at = now() + interval '5 minutes', last_error = left(p_error, 200) where id = p_id;
$$;
revoke all on function public.claim_notification_jobs(), public.finish_notification_job(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.claim_notification_jobs(), public.finish_notification_job(uuid, boolean, text) to service_role;

-- Do not include complaints, answers or private tables in the realtime publication.
alter publication supabase_realtime add table public.responses;
commit;
