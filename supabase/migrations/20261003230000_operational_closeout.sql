-- Operational closeout: Vault key RPCs (service_role only) and unique secret refs.
-- Application tables unchanged. decrypted_secrets are never granted to anon or authenticated.

create extension if not exists supabase_vault;

create unique index if not exists integration_secret_refs_secret_ref_idx
  on public.integration_secret_refs (secret_ref);

create or replace function app.store_provider_secret(p_name text, p_secret text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = vault, public, pg_temp
as $$
declare
  new_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  if p_secret is null or length(btrim(p_secret)) < 16 then
    raise exception 'invalid secret';
  end if;
  if p_name is null or p_name !~ '^google-ai-[a-z0-9-]+$' then
    raise exception 'invalid name';
  end if;
  new_id := vault.create_secret(
    btrim(p_secret),
    p_name,
    coalesce(nullif(btrim(p_description), ''), 'Google Generative AI API key')
  );
  return new_id;
end;
$$;

create or replace function app.read_provider_secret(p_id uuid)
returns text
language plpgsql
security definer
set search_path = vault, public, pg_temp
as $$
declare
  value text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  select ds.decrypted_secret into value
  from vault.decrypted_secrets ds
  where ds.id = p_id;
  if value is null or length(btrim(value)) < 16 then
    raise exception 'secret not found';
  end if;
  return btrim(value);
end;
$$;

create or replace function public.store_provider_secret(p_name text, p_secret text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return app.store_provider_secret(p_name, p_secret, p_description);
end;
$$;

create or replace function public.read_provider_secret(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return app.read_provider_secret(p_id);
end;
$$;

revoke all on function app.store_provider_secret(text, text, text) from public, anon, authenticated;
revoke all on function app.read_provider_secret(uuid) from public, anon, authenticated;
revoke all on function public.store_provider_secret(text, text, text) from public, anon, authenticated;
revoke all on function public.read_provider_secret(uuid) from public, anon, authenticated;

grant execute on function app.store_provider_secret(text, text, text) to service_role;
grant execute on function app.read_provider_secret(uuid) to service_role;
grant execute on function public.store_provider_secret(text, text, text) to service_role;
grant execute on function public.read_provider_secret(uuid) to service_role;
