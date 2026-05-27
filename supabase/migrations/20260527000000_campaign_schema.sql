create extension if not exists pgcrypto;

do $$
begin
  create type public.entry_status as enum ('Pendente', 'Validado', 'Desclassificado');
exception
  when duplicate_object then null;
end
$$;

create sequence if not exists public.campaign_raffle_number_seq start with 1 increment by 1;

create table if not exists public.campaign_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_number integer not null default nextval('public.campaign_raffle_number_seq') unique,
  student_name text not null,
  student_email text not null,
  student_phone text not null,
  student_document text not null,
  student_document_normalized text generated always as (regexp_replace(upper(student_document), '[^0-9A-Z]', '', 'g')) stored,
  unit text not null default 'Dial Fit' check (unit in ('Dial Fit', 'Dial Beach')),
  companion_name text not null,
  companion_document text not null,
  companion_document_normalized text generated always as (regexp_replace(upper(companion_document), '[^0-9A-Z]', '', 'g')) stored,
  companion_phone text not null,
  companion_email text,
  review_unit text not null check (review_unit in ('Dial Fit', 'Dial Beach')),
  completed_review boolean not null default false,
  status public.entry_status not null default 'Pendente',
  accepted_terms boolean not null default false,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_entries_different_documents check (student_document_normalized <> companion_document_normalized)
);

create table if not exists public.campaign_entry_documents (
  document_normalized text primary key,
  entry_id uuid not null references public.campaign_entries(id) on delete cascade,
  role text not null check (role in ('student', 'companion')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_settings (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  draw_date timestamptz not null,
  rules_url text not null,
  dial_fit_review_url text not null,
  dial_beach_review_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raffle_results (
  id uuid primary key default gen_random_uuid(),
  position integer not null unique check (position > 0),
  entry_id uuid not null unique references public.campaign_entries(id) on delete restrict,
  drawn_at timestamptz not null default now(),
  created_by_email text,
  created_at timestamptz not null default now()
);

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.sync_campaign_entry_documents()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    delete from public.campaign_entry_documents where entry_id = old.id;
  end if;

  insert into public.campaign_entry_documents (document_normalized, entry_id, role)
  values
    (new.student_document_normalized, new.id, 'student'),
    (new.companion_document_normalized, new.id, 'companion');

  return new;
end;
$$;

drop trigger if exists set_campaign_entries_updated_at on public.campaign_entries;
create trigger set_campaign_entries_updated_at
before update on public.campaign_entries
for each row execute function private.set_updated_at();

drop trigger if exists sync_campaign_entry_documents on public.campaign_entries;
create trigger sync_campaign_entry_documents
after insert or update of student_document, companion_document on public.campaign_entries
for each row execute function private.sync_campaign_entry_documents();

create index if not exists campaign_entries_status_idx on public.campaign_entries(status);
create index if not exists campaign_entries_created_at_idx on public.campaign_entries(created_at);
create index if not exists campaign_entries_raffle_number_idx on public.campaign_entries(raffle_number);

alter table public.campaign_entries enable row level security;
alter table public.campaign_entry_documents enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.raffle_results enable row level security;
