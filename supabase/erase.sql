drop policy if exists "Users can read own image objects" on storage.objects;
drop policy if exists "Users can upload own image objects" on storage.objects;
drop policy if exists "Users can update own image objects" on storage.objects;
drop policy if exists "Users can delete own image objects" on storage.objects;

delete from storage.objects
where bucket_id = 'gift-images';

delete from storage.buckets
where id = 'gift-images';

drop policy if exists "Users can read own payments" on public.payments;
drop policy if exists "Users can manage own best photos" on public.best_photos;
drop policy if exists "Users can manage own moment images" on public.moment_images;
drop policy if exists "Users can manage own moments" on public.moments;
drop policy if exists "Users can delete own pages" on public.love_pages;
drop policy if exists "Users can update own pages" on public.love_pages;
drop policy if exists "Users can create own pages" on public.love_pages;
drop policy if exists "Users can read own pages" on public.love_pages;

drop trigger if exists set_moments_updated_at on public.moments;
drop trigger if exists set_love_pages_updated_at on public.love_pages;

drop table if exists public.analytics_events cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.payments cascade;
drop table if exists public.best_photos cascade;
drop table if exists public.moment_images cascade;
drop table if exists public.moments cascade;
drop table if exists public.love_pages cascade;

drop function if exists public.expire_love_pages();
drop function if exists public.set_updated_at();

drop type if exists public.payment_type;
drop type if exists public.page_theme;
drop type if exists public.relationship_type;
drop type if exists public.page_status;
