-- Preserva a campanha anterior e habilita campanhas independentes por edição.
alter table public.campaign_entries
  add column if not exists campaign_slug text not null default 'dia-dos-namorados-2026',
  add column if not exists parenthood_declared boolean not null default false;

alter table public.campaign_entries
  alter column companion_name drop not null,
  alter column companion_document drop not null,
  alter column companion_phone drop not null;

alter table public.campaign_entries
  drop constraint if exists campaign_entries_different_documents;

drop trigger if exists sync_campaign_entry_documents on public.campaign_entries;
drop table if exists public.campaign_entry_documents;

create unique index if not exists campaign_entries_campaign_document_key
  on public.campaign_entries (campaign_slug, student_document_normalized);

create index if not exists campaign_entries_campaign_status_idx
  on public.campaign_entries (campaign_slug, status);

alter table public.raffle_results
  add column if not exists campaign_slug text not null default 'dia-dos-namorados-2026';

alter table public.raffle_results
  drop constraint if exists raffle_results_position_key;

alter table public.raffle_results
  add constraint raffle_results_campaign_position_key
  unique (campaign_slug, position);

create index if not exists raffle_results_campaign_idx
  on public.raffle_results (campaign_slug);
