-- Recruiters table
create table public.recruiters (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text,
  company_name text not null,
  company_website text,
  company_size text,
  company_logo_url text,
  company_description text,
  linkedin_url text,
  verified boolean not null default false,
  plan text not null default 'free' check (plan in ('free','pro')),
  jobs_posted int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.recruiters enable row level security;
create policy "recruiters own row" on public.recruiters for all using (auth.uid() = id);
create policy "public can read recruiters" on public.recruiters for select using (true);

-- Job listings table
create table public.job_listings (
  id uuid primary key default uuid_generate_v4(),
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  -- Core fields
  title text not null,
  company_name text not null,
  company_logo_url text,
  location text not null,
  remote_type text not null default 'onsite' check (remote_type in ('remote','hybrid','onsite')),
  job_type text not null default 'full_time' check (job_type in ('full_time','part_time','contract','internship','freelance')),
  -- Compensation
  salary_min int,
  salary_max int,
  currency text not null default 'USD',
  equity_min numeric(5,2),
  equity_max numeric(5,2),
  -- Details
  description text not null,
  requirements text,
  benefits text,
  skills text[] not null default '{}',
  experience_level text not null default 'mid' check (experience_level in ('intern','junior','mid','senior','lead','executive')),
  -- Apply
  apply_url text,
  apply_email text,
  -- Meta
  status text not null default 'active' check (status in ('active','paused','closed')),
  source text not null default 'qcareer' check (source in ('qcareer','scraped','rss')),
  views int not null default 0,
  applications_count int not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz default now() + interval '60 days'
);
alter table public.job_listings enable row level security;
create policy "recruiters own listings" on public.job_listings for all using (auth.uid() = recruiter_id);
create policy "public can read active listings" on public.job_listings for select using (status = 'active');

-- Applications table
create table public.job_applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  applicant_id uuid not null references public.users(id) on delete cascade,
  cover_letter text,
  resume_url text,
  status text not null default 'applied' check (status in ('applied','reviewing','shortlisted','rejected','hired')),
  created_at timestamptz not null default now(),
  unique(job_id, applicant_id)
);
alter table public.job_applications enable row level security;
create policy "applicants see own apps" on public.job_applications for all using (auth.uid() = applicant_id);
create policy "recruiters see their job apps" on public.job_applications for select using (
  exists (select 1 from public.job_listings where id = job_id and recruiter_id = auth.uid())
);

-- Increment views function
create or replace function public.increment_job_views(p_job_id uuid) returns void language plpgsql security definer as $$
begin update public.job_listings set views = views + 1 where id = p_job_id; end; $$;

-- Increment applications count
create or replace function public.increment_job_applications(p_job_id uuid) returns void language plpgsql security definer as $$
begin update public.job_listings set applications_count = applications_count + 1 where id = p_job_id; end; $$;

-- Handle new recruiter trigger
create or replace function public.handle_new_recruiter() returns trigger language plpgsql security definer as $$
begin
  -- Only insert if company_name is provided in metadata
  if new.raw_user_meta_data->>'company_name' is not null then
    insert into public.recruiters (id, email, full_name, company_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name')
    on conflict (id) do nothing;
  end if;
  return new;
end; $$;
