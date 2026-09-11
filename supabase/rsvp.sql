begin;

create table if not exists public.rsvp (
  id bigint generated always as identity not null,
  name text not null,
  side text not null,
  attending boolean not null,
  party_size integer not null default 1,
  meal_type text not null,
  message text null,
  created_at timestamp with time zone not null default now(),
  constraint rsvp_pkey primary key (id),
  constraint rsvp_meal_type_check check (meal_type = any (array['yes'::text, 'no'::text, 'undecided'::text])),
  constraint rsvp_message_check check (message is null or length(message) <= 500),
  constraint rsvp_name_check check (length(name) >= 1 and length(name) <= 40),
  constraint rsvp_party_size_check check (party_size >= 1 and party_size <= 10),
  constraint rsvp_side_check check (side = any (array['groom'::text, 'bride'::text]))
) tablespace pg_default;

alter table public.rsvp enable row level security;
revoke all on public.rsvp from anon, authenticated;
grant insert (name, side, attending, party_size, meal_type, message) on public.rsvp to anon;
grant usage on sequence public.rsvp_id_seq to anon;

drop policy if exists rsvp_insert on public.rsvp;
create policy rsvp_insert on public.rsvp
  for insert to anon with check (true);

commit;
