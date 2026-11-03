-- Private timestamp trigger used only by the CRM tables.
create schema if not exists private;
revoke all on schema private from public;
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
-- Black Friday 2026 CRM. This migration only adds new objects and leaves
-- every previous campaign table and row untouched.

create table if not exists public.black_friday_staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references neon_auth."user"(id) on delete set null,
  email text not null unique check (email = lower(email)),
  role text not null check (role in ('administrator', 'receptionist')),
  is_active boolean not null default true,
  created_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.black_friday_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text not null default 'black-friday-de-arrepiar-2026',
  name text not null check (char_length(name) between 3 and 120),
  phone text not null check (phone ~ '^[1-9][0-9]{9,10}$'),
  preferred_contact_time text check (
    preferred_contact_time is null or
    preferred_contact_time in ('morning', 'afternoon', 'evening', 'anytime')
  ),
  status text not null default 'novo' check (
    status in ('novo', 'em_contato', 'aguardando_resposta', 'matriculado', 'nao_convertido')
  ),
  assigned_to uuid references public.black_friday_staff(id) on delete set null,
  source text not null default 'Acesso direto',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consented_at timestamptz not null,
  consent_version text not null,
  contacted_at timestamptz,
  converted_at timestamptz,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists black_friday_leads_campaign_phone_key
  on public.black_friday_leads (campaign_slug, phone);
create index if not exists black_friday_leads_status_created_idx
  on public.black_friday_leads (status, created_at desc);
create index if not exists black_friday_leads_assigned_created_idx
  on public.black_friday_leads (assigned_to, created_at desc);
create index if not exists black_friday_leads_source_created_idx
  on public.black_friday_leads (source, created_at desc);
create index if not exists black_friday_leads_follow_up_idx
  on public.black_friday_leads (follow_up_at)
  where follow_up_at is not null;

create table if not exists public.black_friday_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.black_friday_leads(id) on delete cascade,
  actor_staff_id uuid references public.black_friday_staff(id) on delete set null,
  event_type text not null check (
    event_type in ('assignment', 'status_change', 'note', 'follow_up', 'contact_logged')
  ),
  body text not null check (char_length(body) between 1 and 2000),
  follow_up_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists black_friday_activity_lead_created_idx
  on public.black_friday_activity (lead_id, created_at desc);

-- Only a keyed digest of the request IP is stored for a short rate-limit window.
create table if not exists public.black_friday_rate_limits (
  request_key text primary key check (request_key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  hit_count integer not null default 1 check (hit_count > 0)
);

drop trigger if exists set_black_friday_staff_updated_at on public.black_friday_staff;
create trigger set_black_friday_staff_updated_at
before update on public.black_friday_staff
for each row execute function private.set_updated_at();

drop trigger if exists set_black_friday_leads_updated_at on public.black_friday_leads;
create trigger set_black_friday_leads_updated_at
before update on public.black_friday_leads
for each row execute function private.set_updated_at();

create or replace function public.black_friday_allow_submission(p_request_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_request_key !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  insert into public.black_friday_rate_limits (request_key, window_started_at, hit_count)
  values (p_request_key, pg_catalog.now(), 1)
  on conflict (request_key) do update
    set window_started_at = case
          when public.black_friday_rate_limits.window_started_at < pg_catalog.now() - interval '15 minutes'
            then pg_catalog.now()
          else public.black_friday_rate_limits.window_started_at
        end,
        hit_count = case
          when public.black_friday_rate_limits.window_started_at < pg_catalog.now() - interval '15 minutes'
            then 1
          else public.black_friday_rate_limits.hit_count + 1
        end
  returning hit_count into v_count;

  delete from public.black_friday_rate_limits
  where window_started_at < pg_catalog.now() - interval '24 hours';

  return v_count <= 8;
end;
$$;

create or replace function public.black_friday_assign_lead(
  p_lead_id uuid,
  p_actor_staff_id uuid,
  p_allow_reassign boolean default false,
  p_target_staff_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text;
  v_target_role text;
  v_target_staff_id uuid := coalesce(p_target_staff_id, p_actor_staff_id);
  v_lead public.black_friday_leads;
begin
  select role into v_role
  from public.black_friday_staff
  where id = p_actor_staff_id and is_active;

  if v_role is null then
    raise exception using errcode = '42501', message = 'Staff account is not active';
  end if;
  if p_allow_reassign and v_role <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator role required';
  end if;
  select role into v_target_role
  from public.black_friday_staff
  where id = v_target_staff_id and is_active;
  if v_target_role is null then
    raise exception using errcode = '22023', message = 'Target staff account is not active';
  end if;
  if v_target_staff_id <> p_actor_staff_id and v_role <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator role required';
  end if;

  update public.black_friday_leads
  set assigned_to = v_target_staff_id,
      status = case when status = 'novo' then 'em_contato' else status end,
      contacted_at = case when status = 'novo' then coalesce(contacted_at, pg_catalog.now()) else contacted_at end,
      updated_at = pg_catalog.now()
  where id = p_lead_id
    and campaign_slug = 'black-friday-de-arrepiar-2026'
    and (assigned_to is null or assigned_to = v_target_staff_id or p_allow_reassign)
  returning * into v_lead;

  if not found then
    select * into v_lead from public.black_friday_leads
    where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026';
    return pg_catalog.jsonb_build_object('assigned', false, 'lead', pg_catalog.to_jsonb(v_lead));
  end if;

  insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body)
  values (
    v_lead.id,
    p_actor_staff_id,
    'assignment',
    case when v_target_staff_id = p_actor_staff_id
      then 'Atendimento assumido.'
      else 'Atendimento atribuído a outro membro da equipe.'
    end
  );

  return pg_catalog.jsonb_build_object('assigned', true, 'lead', pg_catalog.to_jsonb(v_lead));
end;
$$;

create or replace function public.black_friday_change_lead(
  p_lead_id uuid,
  p_actor_staff_id uuid,
  p_status text,
  p_follow_up_at timestamptz,
  p_clear_follow_up boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.black_friday_leads;
  v_status text;
  v_assigned_to uuid;
  v_actor_role text;
begin
  select role into v_actor_role from public.black_friday_staff
  where id = p_actor_staff_id and is_active;
  if v_actor_role is null then
    raise exception using errcode = '42501', message = 'Staff account is not active';
  end if;
  if p_status not in ('novo', 'em_contato', 'aguardando_resposta', 'matriculado', 'nao_convertido') then
    raise exception using errcode = '22023', message = 'Invalid lead status';
  end if;

  select status, assigned_to into v_status, v_assigned_to
  from public.black_friday_leads
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  for update;
  if not found then
    return null;
  end if;
  if v_assigned_to is not null and v_assigned_to <> p_actor_staff_id and v_actor_role <> 'administrator' then
    raise exception using errcode = '42501', message = 'Lead is assigned to another staff member';
  end if;

  update public.black_friday_leads
  set status = p_status,
      contacted_at = case
        when p_status in ('em_contato', 'aguardando_resposta') then coalesce(contacted_at, pg_catalog.now())
        else contacted_at
      end,
      converted_at = case
        when p_status = 'matriculado' then coalesce(converted_at, pg_catalog.now())
        else converted_at
      end,
      follow_up_at = case
        when p_clear_follow_up then null
        when p_follow_up_at is not null then p_follow_up_at
        else follow_up_at
      end,
      updated_at = pg_catalog.now()
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  returning * into v_lead;

  if v_status <> p_status then
    insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body)
    values (p_lead_id, p_actor_staff_id, 'status_change', 'Status atualizado para ' || p_status || '.');
  end if;
  if p_clear_follow_up or p_follow_up_at is not null then
    insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body, follow_up_at)
    values (
      p_lead_id,
      p_actor_staff_id,
      'follow_up',
      case when p_clear_follow_up then 'Retorno agendado removido.' else 'Retorno atualizado.' end,
      case when p_clear_follow_up then null else p_follow_up_at end
    );
  end if;

  return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_lead));
end;
$$;

create or replace function public.black_friday_add_note(
  p_lead_id uuid,
  p_actor_staff_id uuid,
  p_note text,
  p_follow_up_at timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.black_friday_leads;
  v_assigned_to uuid;
  v_actor_role text;
begin
  select role into v_actor_role from public.black_friday_staff
  where id = p_actor_staff_id and is_active;
  if v_actor_role is null then
    raise exception using errcode = '42501', message = 'Staff account is not active';
  end if;
  if p_note is null or pg_catalog.char_length(pg_catalog.btrim(p_note)) not between 1 and 2000 then
    raise exception using errcode = '22023', message = 'Invalid note';
  end if;
  select assigned_to into v_assigned_to from public.black_friday_leads
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  for update;
  if not found then return null; end if;
  if v_assigned_to is not null and v_assigned_to <> p_actor_staff_id and v_actor_role <> 'administrator' then
    raise exception using errcode = '42501', message = 'Lead is assigned to another staff member';
  end if;

  update public.black_friday_leads
  set follow_up_at = case when p_follow_up_at is not null then p_follow_up_at else follow_up_at end,
      updated_at = pg_catalog.now()
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  returning * into v_lead;
  if not found then return null; end if;

  insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body)
  values (p_lead_id, p_actor_staff_id, 'note', pg_catalog.btrim(p_note));
  if p_follow_up_at is not null then
    insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body, follow_up_at)
    values (p_lead_id, p_actor_staff_id, 'follow_up', 'Retorno agendado.', p_follow_up_at);
  end if;

  return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_lead));
end;
$$;

create or replace function public.black_friday_log_contact(
  p_lead_id uuid,
  p_actor_staff_id uuid,
  p_message text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.black_friday_leads;
  v_assigned_to uuid;
  v_actor_role text;
begin
  select role into v_actor_role from public.black_friday_staff
  where id = p_actor_staff_id and is_active;
  if v_actor_role is null then
    raise exception using errcode = '42501', message = 'Staff account is not active';
  end if;
  if p_message is null or pg_catalog.char_length(pg_catalog.btrim(p_message)) not between 1 and 2000 then
    raise exception using errcode = '22023', message = 'Invalid contact message';
  end if;
  select assigned_to into v_assigned_to from public.black_friday_leads
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  for update;
  if not found then return null; end if;
  if v_assigned_to is not null and v_assigned_to <> p_actor_staff_id and v_actor_role <> 'administrator' then
    raise exception using errcode = '42501', message = 'Lead is assigned to another staff member';
  end if;

  update public.black_friday_leads
  set status = 'aguardando_resposta',
      contacted_at = coalesce(contacted_at, pg_catalog.now()),
      updated_at = pg_catalog.now()
  where id = p_lead_id and campaign_slug = 'black-friday-de-arrepiar-2026'
  returning * into v_lead;
  if not found then return null; end if;

  insert into public.black_friday_activity (lead_id, actor_staff_id, event_type, body)
  values (p_lead_id, p_actor_staff_id, 'contact_logged', pg_catalog.btrim(p_message));
  return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_lead));
end;
$$;

create or replace function public.black_friday_report(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  with filtered as (
    select l.status, l.source, l.assigned_to, l.created_at, l.contacted_at, l.converted_at
    from public.black_friday_leads as l
    where l.campaign_slug = 'black-friday-de-arrepiar-2026'
      and (p_start is null or l.created_at >= p_start)
      and (p_end is null or l.created_at < p_end)
  )
  select pg_catalog.jsonb_build_object(
    'total', (select pg_catalog.count(*) from filtered),
    'by_status', (
      select coalesce(
        pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('status', s.status, 'count', s.total) order by s.status),
        '[]'::jsonb
      )
      from (select status, pg_catalog.count(*) as total from filtered group by status) as s
    ),
    'daily', (
      select coalesce(
        pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('date', d.local_day, 'count', d.total) order by d.local_day),
        '[]'::jsonb
      )
      from (
        select pg_catalog.to_char(created_at at time zone 'America/Fortaleza', 'YYYY-MM-DD') as local_day,
               pg_catalog.count(*) as total
        from filtered
        group by pg_catalog.to_char(created_at at time zone 'America/Fortaleza', 'YYYY-MM-DD')
      ) as d
    ),
    'by_source', (
      select coalesce(
        pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('source', s.source, 'count', s.total) order by s.total desc, s.source),
        '[]'::jsonb
      )
      from (select source, pg_catalog.count(*) as total from filtered group by source) as s
    ),
    'by_staff', (
      select coalesce(
        pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('staff', s.staff, 'count', s.total) order by s.total desc, s.staff),
        '[]'::jsonb
      )
      from (
        select coalesce(st.email, 'Sem responsável') as staff, pg_catalog.count(*) as total
        from filtered as f
        left join public.black_friday_staff as st on st.id = f.assigned_to
        group by coalesce(st.email, 'Sem responsável')
      ) as s
    ),
    'average_first_contact_seconds', (
      select pg_catalog.round(pg_catalog.avg(pg_catalog.date_part('epoch', contacted_at - created_at))::numeric, 1)
      from filtered
      where contacted_at is not null
    ),
    'converted', (select pg_catalog.count(*) from filtered where status = 'matriculado'),
    'contacted', (select pg_catalog.count(*) from filtered where contacted_at is not null),
    'awaiting_response', (select pg_catalog.count(*) from filtered where status = 'aguardando_resposta')
  );
$$;


-- The application role is server-only. API handlers enforce staff roles before queries.
grant usage on schema public, private to bf_app;
grant select, insert, update, delete on table public.black_friday_staff, public.black_friday_leads, public.black_friday_activity, public.black_friday_rate_limits to bf_app;
revoke all on function public.black_friday_allow_submission(text) from public;
revoke all on function public.black_friday_assign_lead(uuid, uuid, boolean, uuid) from public;
revoke all on function public.black_friday_change_lead(uuid, uuid, text, timestamptz, boolean) from public;
revoke all on function public.black_friday_add_note(uuid, uuid, text, timestamptz) from public;
revoke all on function public.black_friday_log_contact(uuid, uuid, text) from public;
revoke all on function public.black_friday_report(timestamptz, timestamptz) from public;
grant execute on function public.black_friday_allow_submission(text) to bf_app;
grant execute on function public.black_friday_assign_lead(uuid, uuid, boolean, uuid) to bf_app;
grant execute on function public.black_friday_change_lead(uuid, uuid, text, timestamptz, boolean) to bf_app;
grant execute on function public.black_friday_add_note(uuid, uuid, text, timestamptz) to bf_app;
grant execute on function public.black_friday_log_contact(uuid, uuid, text) to bf_app;
grant execute on function public.black_friday_report(timestamptz, timestamptz) to bf_app;
grant execute on function private.set_updated_at() to bf_app;
