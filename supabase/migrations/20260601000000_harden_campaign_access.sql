alter table public.campaign_entries enable row level security;
alter table public.campaign_entry_documents enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.raffle_results enable row level security;

alter table public.campaign_entries force row level security;
alter table public.campaign_entry_documents force row level security;
alter table public.campaign_settings force row level security;
alter table public.raffle_results force row level security;

revoke all on table public.campaign_entries from anon, authenticated;
revoke all on table public.campaign_entry_documents from anon, authenticated;
revoke all on table public.campaign_settings from anon, authenticated;
revoke all on table public.raffle_results from anon, authenticated;
revoke all on sequence public.campaign_raffle_number_seq from anon, authenticated;
