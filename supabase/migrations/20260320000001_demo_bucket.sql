insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
values ('demo_files', 'demo_files', true, null, null)
on conflict (id) do nothing;

create policy "demo_files_public_select" on storage.objects 
for select using (bucket_id = 'demo_files');

create policy "demo_files_auth_insert" on storage.objects
for insert with check (bucket_id = 'demo_files' and auth.role() = 'authenticated');
