-- 010 — Storage: bucket listing-images (NOVO — não colide com 001)
-- Aplicar no SQL Editor do projecto Supabase
-- Não cria tabelas de negócio; só storage.buckets + policies em storage.objects

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (URLs públicas no Feed)
drop policy if exists listing_images_public_read on storage.objects;
create policy listing_images_public_read
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Upload: autenticado, só na pasta do próprio user_id/
drop policy if exists listing_images_auth_insert on storage.objects;
create policy listing_images_auth_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Actualizar / apagar só os próprios ficheiros
drop policy if exists listing_images_auth_update on storage.objects;
create policy listing_images_auth_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists listing_images_auth_delete on storage.objects;
create policy listing_images_auth_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
