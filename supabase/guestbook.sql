begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.guestbook (
  id bigint generated always as identity not null,
  name text not null,
  password_hash text not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  constraint guestbook_pkey primary key (id),
  constraint guestbook_message_check check (length(message) >= 1 and length(message) <= 500),
  constraint guestbook_name_check check (length(name) >= 1 and length(name) <= 20)
) tablespace pg_default;

alter table public.guestbook enable row level security;
revoke all on public.guestbook from anon, authenticated;
grant select (id, name, message, created_at) on public.guestbook to anon;

drop policy if exists guestbook_select on public.guestbook;
create policy guestbook_select on public.guestbook
  for select to anon using (true);

create or replace function public.add_guestbook_entry(
  p_name text,
  p_password text,
  p_message text
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if p_password is null or char_length(p_password) not between 4 and 20 then
    raise exception 'Password must be between 4 and 20 characters.';
  end if;

  insert into public.guestbook (name, password_hash, message)
  values (
    btrim(p_name),
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    btrim(p_message)
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.delete_guestbook_entry(
  p_id bigint,
  p_password text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.guestbook g
  where g.id = p_id
    and g.password_hash = extensions.crypt(p_password, g.password_hash);
  return found;
end;
$$;

revoke all on function public.add_guestbook_entry(text, text, text) from public, anon, authenticated;
revoke all on function public.delete_guestbook_entry(bigint, text) from public, anon, authenticated;
grant execute on function public.add_guestbook_entry(text, text, text) to anon;
grant execute on function public.delete_guestbook_entry(bigint, text) to anon;

commit;
