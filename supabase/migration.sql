-- SEO Machine Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table (brand voice / company context)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  company_url text,
  industry text,
  target_audience text,
  tone_of_voice text default 'professional',
  tone_description text,
  example_articles text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Articles table
create table public.articles (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  status text default 'draft' check (status in ('researching', 'writing', 'scoring', 'draft', 'optimized', 'published')),
  research_brief jsonb,
  content text,
  meta_title text,
  meta_description text,
  target_keyword text,
  seo_score integer,
  seo_score_breakdown jsonb,
  optimization_suggestions jsonb,
  voice_transcript text,
  word_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Waitlist table
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  source text default 'landing',
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.projects enable row level security;
alter table public.articles enable row level security;
alter table public.waitlist enable row level security;

-- Projects policies
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

-- Articles policies
create policy "Users can view own articles" on public.articles
  for select using (auth.uid() = user_id);

create policy "Users can create own articles" on public.articles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own articles" on public.articles
  for update using (auth.uid() = user_id);

create policy "Users can delete own articles" on public.articles
  for delete using (auth.uid() = user_id);

-- Waitlist: anyone can insert, no one can read (admin only via dashboard)
create policy "Anyone can join waitlist" on public.waitlist
  for insert with check (true);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_projects_updated
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger on_articles_updated
  before update on public.articles
  for each row execute function public.handle_updated_at();

-- Indexes
create index idx_projects_user_id on public.projects(user_id);
create index idx_articles_user_id on public.articles(user_id);
create index idx_articles_project_id on public.articles(project_id);
create index idx_articles_status on public.articles(status);
create index idx_waitlist_email on public.waitlist(email);
