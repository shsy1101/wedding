-- Run in Supabase SQL Editor after both setup scripts. Reads metadata only.
begin read only;
set local plpgsql.check_asserts = on;

do $$
begin
  assert (
    select count(*) = 2 from pg_class
    where oid in ('public.guestbook'::regclass, 'public.rsvp'::regclass)
      and relrowsecurity
  ), 'Both tables must have RLS enabled.';

  assert (
    select count(*) = 2 from pg_attribute
    where attrelid in ('public.guestbook'::regclass, 'public.rsvp'::regclass)
      and attname = 'id' and attidentity = 'a'
  ), 'Both IDs must be generated-always identities.';

  assert (
    select count(*) = 7 from pg_constraint
    where conrelid in ('public.guestbook'::regclass, 'public.rsvp'::regclass)
      and contype = 'c' and convalidated
  ), 'The seven exported check constraints must be present and validated.';

  assert pg_get_serial_sequence('public.rsvp', 'id') = 'public.rsvp_id_seq';
  assert has_sequence_privilege('anon', 'public.rsvp_id_seq', 'USAGE');
  assert has_column_privilege('anon', 'public.guestbook', 'message', 'SELECT');
  assert not has_column_privilege('anon', 'public.guestbook', 'password_hash', 'SELECT');
  assert not has_any_column_privilege('anon', 'public.guestbook', 'INSERT');
  assert not has_any_column_privilege('anon', 'public.guestbook', 'UPDATE');
  assert not has_table_privilege('anon', 'public.guestbook', 'DELETE');
  assert has_column_privilege('anon', 'public.rsvp', 'name', 'INSERT');
  assert not has_any_column_privilege('anon', 'public.rsvp', 'SELECT');
  assert not has_any_column_privilege('anon', 'public.rsvp', 'UPDATE');
  assert not has_table_privilege('anon', 'public.rsvp', 'DELETE');
  assert has_function_privilege('anon', 'public.add_guestbook_entry(text,text,text)', 'EXECUTE');
  assert has_function_privilege('anon', 'public.delete_guestbook_entry(bigint,text)', 'EXECUTE');
  assert to_regprocedure('extensions.crypt(text,text)') is not null;
end;
$$;

rollback;
