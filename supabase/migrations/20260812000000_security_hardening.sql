-- Security baseline for the portfolio application.
-- Apply with `supabase db push` after linking the intended Supabase project.

create table if not exists public.admin_login_locks (
  email text not null,
  ip_hash text not null,
  failed_count integer not null default 0 check (failed_count >= 0),
  locked_until timestamptz,
  last_failed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (email, ip_hash)
);

alter table public.admin_login_locks enable row level security;
revoke all on table public.admin_login_locks from anon, authenticated;

-- Serializes attempt reservations for each IP hash and consumes the attempt
-- before authentication. This prevents concurrent requests from sharing one
-- stale counter value.
create or replace function public.reserve_admin_login_attempt(p_ip_hash text)
returns table (
  allowed boolean,
  failed_count integer,
  tries_left integer,
  locked_until timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_locked_until timestamptz;
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 then
    raise exception 'invalid login-attempt key';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_ip_hash, 0)
  );

  select l.failed_count, l.locked_until
    into v_count, v_locked_until
  from public.admin_login_locks as l
  where l.email = '__admin_login__'
    and l.ip_hash = p_ip_hash;

  if v_locked_until is not null and v_locked_until > now() then
    return query select false, v_count, 0, v_locked_until;
    return;
  end if;

  if v_locked_until is not null then
    delete from public.admin_login_locks as l
    where l.email = '__admin_login__'
      and l.ip_hash = p_ip_hash;
    v_count := null;
  end if;

  v_count := coalesce(v_count, 0) + 1;
  v_locked_until := case
    when v_count >= 5 then now() + interval '2 hours'
    else null
  end;

  insert into public.admin_login_locks (
    email,
    ip_hash,
    failed_count,
    locked_until,
    last_failed_at,
    updated_at
  ) values (
    '__admin_login__',
    p_ip_hash,
    v_count,
    v_locked_until,
    now(),
    now()
  )
  on conflict (email, ip_hash) do update set
    failed_count = excluded.failed_count,
    locked_until = excluded.locked_until,
    last_failed_at = excluded.last_failed_at,
    updated_at = excluded.updated_at;

  return query
    select true, v_count, greatest(0, 5 - v_count), v_locked_until;
end;
$$;

revoke all on function public.reserve_admin_login_attempt(text) from public, anon, authenticated;
grant execute on function public.reserve_admin_login_attempt(text) to service_role;

-- Server-side allowlist for the one CMS administrator. The seed matches the
-- current Edge Function default; change it here if ADMIN_EMAIL is overridden.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated;

insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('jeannettekhoury012@gmail.com')
on conflict (user_id) do nothing;

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
  );
$$;

revoke all on function public.is_fixed_admin() from public, anon;
grant execute on function public.is_fixed_admin() to authenticated;

-- Replace every application-table policy so an older permissive policy cannot
-- silently override the intended boundary (Postgres policies are additive).
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'website_visits')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

alter table public.projects enable row level security;
alter table public.website_visits enable row level security;

revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

create policy projects_public_read
on public.projects for select
to anon, authenticated
using (true);

create policy projects_admin_insert
on public.projects for insert
to authenticated
with check ((select public.is_fixed_admin()));

create policy projects_admin_update
on public.projects for update
to authenticated
using ((select public.is_fixed_admin()))
with check ((select public.is_fixed_admin()));

create policy projects_admin_delete
on public.projects for delete
to authenticated
using ((select public.is_fixed_admin()));

revoke all on table public.website_visits from anon, authenticated;
grant insert on table public.website_visits to anon, authenticated;
grant select on table public.website_visits to authenticated;

create policy website_visits_public_insert
on public.website_visits for insert
to anon, authenticated
with check (
  visitor_id is not null
  and path is not null
  and char_length(path) between 1 and 300
);

create policy website_visits_admin_read
on public.website_visits for select
to authenticated
using ((select public.is_fixed_admin()));

create or replace function public.get_website_stats()
returns table (
  unique_visitors bigint,
  total_visits bigint,
  last_24_hours bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_fixed_admin() then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  return query
    select
      count(distinct visits.visitor_id)::bigint,
      count(*)::bigint,
      count(*) filter (
        where visits.created_at >= now() - interval '24 hours'
      )::bigint
    from public.website_visits as visits;
end;
$$;

revoke all on function public.get_website_stats() from public, anon;
grant execute on function public.get_website_stats() to authenticated;

-- Bucket policies are deliberately scoped to project-images. Review and remove
-- any older permissive policies for this bucket before production deployment.
drop policy if exists project_images_public_read on storage.objects;
drop policy if exists project_images_admin_insert on storage.objects;
drop policy if exists project_images_admin_update on storage.objects;
drop policy if exists project_images_admin_delete on storage.objects;

create policy project_images_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'project-images');

create policy project_images_admin_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and (select public.is_fixed_admin())
  and (storage.foldername(name))[1] in ('card', 'detail')
);

create policy project_images_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'project-images' and (select public.is_fixed_admin()))
with check (
  bucket_id = 'project-images'
  and (select public.is_fixed_admin())
  and (storage.foldername(name))[1] in ('card', 'detail')
);

create policy project_images_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'project-images' and (select public.is_fixed_admin()));
