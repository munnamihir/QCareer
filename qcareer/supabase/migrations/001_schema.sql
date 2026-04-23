create extension if not exists "uuid-ossp";
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique, github_username text, github_avatar text, full_name text,
  plan text not null default 'free' check (plan in ('free','pro')),
  jobs_count int not null default 0, created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "users own row" on public.users for all using (auth.uid() = id);

create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  company text not null, role text not null,
  status text not null default 'wishlist' check (status in ('wishlist','applied','screening','interview','offer','rejected')),
  salary_min int, salary_max int, currency text not null default 'USD',
  location text, url text, notes text,
  excitement int not null default 3 check (excitement between 1 and 5),
  applied_at timestamptz, created_at timestamptz not null default now()
);
alter table public.jobs enable row level security;
create policy "users own jobs" on public.jobs for all using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id,email,github_username,github_avatar,full_name)
  values (new.id,new.email,new.raw_user_meta_data->>'user_name',new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'full_name');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
