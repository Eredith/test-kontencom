begin;

alter table public.debts enable row level security;
alter table public.debts force row level security;

-- Permissive policies combine with OR, so an older broad policy could bypass
-- the ownership checks even when the four intended policies are present.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'debts'
  loop
    execute format('drop policy %I on public.debts', existing_policy.policyname);
  end loop;
end;
$$;

revoke all on public.debts from public, anon;
grant select, insert, update, delete on public.debts to authenticated;

create policy debts_select_own on public.debts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy debts_insert_own on public.debts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy debts_update_own on public.debts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy debts_delete_own on public.debts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
