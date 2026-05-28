insert into storage.buckets (id, name, public)
values ('mk-maker-media', 'mk-maker-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('mk-maker-products', 'mk-maker-products', true)
on conflict (id) do nothing;

drop policy if exists "Public can read pulsefit media" on storage.objects;
drop policy if exists "Public can read mk maker media" on storage.objects;
create policy "Public can read mk maker media"
on storage.objects for select
using (bucket_id in ('mk-maker-media', 'mk-maker-products'));

-- Uploads e exclusoes devem passar pelo backend com service role.
