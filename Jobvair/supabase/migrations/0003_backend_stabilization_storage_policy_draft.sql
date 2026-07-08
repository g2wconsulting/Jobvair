-- Jobvair backend stabilization storage policy draft.
--
-- Bucket expected by the frontend:
--   resumes
--
-- Object key pattern used by the app:
--   <auth.uid()>/<timestamp>_<safe_filename>
--
-- The frontend builds display paths like "resumes/<object name>" while the
-- storage object itself is uploaded to bucket "resumes" with name
-- "<user_id>/<timestamp>_<filename>".

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_bucket_owner_select" on storage.objects;
create policy "resumes_bucket_owner_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_admin()
  )
);

drop policy if exists "resumes_bucket_owner_insert" on storage.objects;
create policy "resumes_bucket_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_bucket_owner_update" on storage.objects;
create policy "resumes_bucket_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_admin()
  )
)
with check (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_admin()
  )
);

drop policy if exists "resumes_bucket_owner_delete" on storage.objects;
create policy "resumes_bucket_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_admin()
  )
);

-- Edge Functions that parse resumes should use service-role credentials on
-- the server side when they need to read private objects for processing.
