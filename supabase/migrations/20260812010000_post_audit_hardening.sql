-- Follow-up hardening after the post-fix security audit.

-- Keep exactly the intended administrator. This is intentionally fail-closed:
-- if the account does not exist, nobody receives CMS privileges.
delete from public.app_admins
where user_id not in (
  select id
  from auth.users
  where lower(email) = lower('jeannettekhoury012@gmail.com')
);

insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('jeannettekhoury012@gmail.com')
on conflict (user_id) do nothing;

-- Every administrator operation requires an MFA-verified aal2 session. The
-- login page enrolls TOTP before attempting any CMS operation.
create or replace function public.is_fixed_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  ) and (select auth.jwt()->>'aal') = 'aal2';
$$;

revoke all on function public.is_fixed_admin() from public, anon;
grant execute on function public.is_fixed_admin() to authenticated;

-- Anonymous callers no longer write telemetry directly to the table.
revoke insert on table public.website_visits from anon, authenticated;
drop policy if exists website_visits_public_insert on public.website_visits;

create table if not exists public.website_visit_rate_limits (
  ip_hash text primary key check (length(ip_hash) = 64),
  window_started_at timestamptz not null default now(),
  event_count integer not null default 0 check (event_count >= 0)
);

create index if not exists website_visit_rate_limits_window_idx
on public.website_visit_rate_limits (window_started_at);

alter table public.website_visit_rate_limits enable row level security;
revoke all on table public.website_visit_rate_limits from anon, authenticated;

create or replace function public.record_website_visit(
  p_ip_hash text,
  p_visitor_id uuid,
  p_path text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_event_count integer;
begin
  if length(p_ip_hash) <> 64
    or p_path !~ '^/(guest|projects|collaborate|category/[a-z0-9-]{1,80}|project/[0-9a-f-]{1,80})?$'
  then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_ip_hash, 1)
  );

  delete from public.website_visit_rate_limits
  where window_started_at < now() - interval '24 hours';

  select limits.window_started_at, limits.event_count
    into v_window_started_at, v_event_count
  from public.website_visit_rate_limits as limits
  where limits.ip_hash = p_ip_hash;

  if v_window_started_at is null
    or v_window_started_at <= now() - interval '1 hour'
  then
    insert into public.website_visit_rate_limits (
      ip_hash,
      window_started_at,
      event_count
    ) values (p_ip_hash, now(), 1)
    on conflict (ip_hash) do update set
      window_started_at = excluded.window_started_at,
      event_count = 1;
  elsif v_event_count >= 20 then
    return false;
  else
    update public.website_visit_rate_limits
    set event_count = event_count + 1
    where ip_hash = p_ip_hash;
  end if;

  insert into public.website_visits (visitor_id, path)
  values (p_visitor_id, p_path);

  return true;
end;
$$;

revoke all on function public.record_website_visit(text, uuid, text)
from public, anon, authenticated;
grant execute on function public.record_website_visit(text, uuid, text)
to service_role;

-- Restrictive guards are ANDed with every existing permissive policy. They
-- protect project-images even if a differently named legacy write policy was
-- left behind in the deployed project.
drop policy if exists project_images_insert_guard on storage.objects;
drop policy if exists project_images_update_guard on storage.objects;
drop policy if exists project_images_delete_guard on storage.objects;

create policy project_images_insert_guard
on storage.objects as restrictive for insert
to anon, authenticated
with check (
  bucket_id <> 'project-images'
  or (
    (select public.is_fixed_admin())
    and (storage.foldername(name))[1] in ('card', 'detail')
  )
);

create policy project_images_update_guard
on storage.objects as restrictive for update
to anon, authenticated
using (
  bucket_id <> 'project-images'
  or (select public.is_fixed_admin())
)
with check (
  bucket_id <> 'project-images'
  or (
    (select public.is_fixed_admin())
    and (storage.foldername(name))[1] in ('card', 'detail')
  )
);

create policy project_images_delete_guard
on storage.objects as restrictive for delete
to anon, authenticated
using (
  bucket_id <> 'project-images'
  or (select public.is_fixed_admin())
);
