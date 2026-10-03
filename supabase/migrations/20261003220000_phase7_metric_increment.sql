-- Atomic product metric increments. Public wrapper is service_role only.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_metrics_daily_unique'
      and conrelid = 'public.content_metrics_daily'::regclass
  ) then
    alter table public.content_metrics_daily
      add constraint content_metrics_daily_unique unique using index content_metrics_daily_unique_idx;
  end if;
end $$;

create or replace function app.increment_content_metric(p_path text, p_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  if p_key not in ('guide_view', 'tool_start', 'guide_tool_click') then
    return false;
  end if;
  if p_path is null
    or char_length(p_path) < 2
    or char_length(p_path) > 180
    or p_path not like '/%'
    or p_path like '//%'
    or p_path like '/admin%' then
    return false;
  end if;

  insert into public.content_metrics_daily (metric_date, path, metric_key, value, source)
  values ((timezone('utc', now()))::date, p_path, p_key, 1, 'product')
  on conflict on constraint content_metrics_daily_unique
  do update set
    value = public.content_metrics_daily.value + 1,
    source = 'product',
    updated_at = now();

  return true;
end;
$$;

create or replace function public.increment_content_metric(p_path text, p_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return app.increment_content_metric(p_path, p_key);
end;
$$;

revoke all on function app.increment_content_metric(text, text) from public, anon, authenticated;
revoke all on function public.increment_content_metric(text, text) from public, anon, authenticated;
grant execute on function app.increment_content_metric(text, text) to service_role;
grant execute on function public.increment_content_metric(text, text) to service_role;
