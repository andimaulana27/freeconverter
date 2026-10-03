-- Cover remaining generation_media_jobs foreign keys for deletes and lookups.
create index if not exists generation_media_jobs_generation_job_id_idx
  on public.generation_media_jobs (generation_job_id);

create index if not exists generation_media_jobs_media_asset_id_idx
  on public.generation_media_jobs (media_asset_id);
