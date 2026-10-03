-- Phase 4 ads manager: extra converter placement keys, public AdSense client setting,
-- draft-friendly creative checks, and activation guards. Never store executable ad scripts.

insert into public.ad_placements (
  key, page_scope, desktop_width, desktop_height, mobile_width, mobile_height, mobile_policy, reserve_space, fallback_behavior
) values
  ('page_in_body', 'all', 728, 90, 320, 100, 'swap', true, 'placeholder'),
  ('page_sidebar', 'non_homepage', 300, 250, null, null, 'hide', true, 'placeholder')
on conflict (key) do nothing;

insert into public.site_settings (key, value, is_public)
values ('adsense_client_id', '""'::jsonb, true)
on conflict (key) do nothing;

alter table public.ad_placements
  drop constraint if exists ad_placements_fallback_check;
alter table public.ad_placements
  add constraint ad_placements_fallback_check
  check (fallback_behavior in ('placeholder', 'collapse'));

alter table public.ad_creatives
  drop constraint if exists ad_creatives_adsense_check;
alter table public.ad_creatives
  add constraint ad_creatives_adsense_check
  check (type <> 'adsense' or status <> 'active' or google_slot_id is not null);

alter table public.ad_creatives
  drop constraint if exists ad_creatives_image_check;
alter table public.ad_creatives
  add constraint ad_creatives_image_check
  check (
    type <> 'image'
    or status <> 'active'
    or (media_asset_id is not null and target_url is not null and alt_text is not null)
  );

alter table public.ad_creatives
  drop constraint if exists ad_creatives_google_client_id_check;
alter table public.ad_creatives
  add constraint ad_creatives_google_client_id_check
  check (google_client_id is null or google_client_id ~ '^ca-pub-[0-9]{9,22}$');

alter table public.ad_creatives
  drop constraint if exists ad_creatives_google_slot_id_check;
alter table public.ad_creatives
  add constraint ad_creatives_google_slot_id_check
  check (google_slot_id is null or google_slot_id ~ '^[0-9]{6,22}$');

alter table public.ad_creatives
  drop constraint if exists ad_creatives_target_url_check;
alter table public.ad_creatives
  add constraint ad_creatives_target_url_check
  check (target_url is null or target_url ~* '^https?://');

create or replace function app.guard_ad_creative_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active' then
    if new.type = 'adsense' and coalesce(new.google_slot_id, '') = '' then
      raise exception 'Active AdSense creatives require a slot ID';
    end if;
    if new.type = 'image' and (
      new.media_asset_id is null
      or coalesce(new.target_url, '') = ''
      or coalesce(new.alt_text, '') = ''
    ) then
      raise exception 'Active image creatives require media, a destination URL, and alt text';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ad_creatives_guard_activation on public.ad_creatives;
create trigger ad_creatives_guard_activation
  before insert or update on public.ad_creatives
  for each row execute function app.guard_ad_creative_activation();
