-- ============================================================================
-- ShodhSutra — database schema (Supabase / PostgreSQL)
-- Run this FIRST in the Supabase SQL editor, then run seed.sql.
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- categories --------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  short_name  text not null,
  icon        text not null default 'book',
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- authors -------------------------------------------------------------
create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  seq         bigint generated always as identity,          -- insertion order ("recently added")
  slug        text not null unique,
  name        text not null,
  type        text not null check (type in ('student', 'faculty', 'researcher')),
  designation text not null default '',
  institution text not null default '',
  department  text not null default '',
  interests   text[] not null default '{}',
  bio         text not null default '',
  photo_url   text,
  created_at  timestamptz not null default now()
);

-- ---------- papers --------------------------------------------------------------
create table if not exists public.papers (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,
  slug           text not null unique,
  title          text not null,
  abstract       text not null,
  category_slug  text not null references public.categories (slug) on update cascade on delete restrict,
  category2_slug text references public.categories (slug) on update cascade on delete set null,
  institution    text not null default '',
  published_on   date not null default current_date,
  keywords       text[] not null default '{}',
  views          integer not null default 0,
  content_type   text not null default 'Original Research',
  format         text not null default 'emp' check (format in ('emp', 'rev', 'ess', 'cas')),
  featured       boolean not null default false,
  doi            text,                                       -- only ever filled with a verified DOI
  paper_url      text,                                       -- link to the manuscript (replaces file upload)
  peer_reviewed  boolean not null default false,             -- only true when verified
  is_demo        boolean not null default false,
  cover_url      text,                                       -- compressed cover (<= 10 KB) in the 'covers' bucket
  art_style      smallint not null default 0 check (art_style between 0 and 7),
  art_theme      smallint not null default 0 check (art_theme between 0 and 5),
  art_seed       integer not null default 1,
  full_text      text not null default '',
  refs           text[] not null default '{}',
  created_at     timestamptz not null default now()
);
create index if not exists papers_category_idx on public.papers (category_slug);
create index if not exists papers_published_idx on public.papers (published_on desc);
create unique index if not exists papers_one_featured on public.papers (featured) where featured;

-- ---------- paper <-> author ----------------------------------------------------
create table if not exists public.paper_authors (
  paper_id  uuid not null references public.papers (id) on delete cascade,
  author_id uuid not null references public.authors (id) on delete cascade,
  position  integer not null default 1,
  primary key (paper_id, author_id)
);
create index if not exists paper_authors_author_idx on public.paper_authors (author_id);

-- ---------- news ----------------------------------------------------------------
create table if not exists public.news (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique,
  slug               text not null unique,
  title              text not null,
  summary            text not null default '',
  category           text not null default 'General',
  published_on       date not null default current_date,
  body               text[] not null default '{}',           -- one array item per paragraph
  related_paper_slug text,
  byline             text not null default '',
  art_style          smallint not null default 0 check (art_style between 0 and 7),
  art_theme          smallint not null default 0 check (art_theme between 0 and 5),
  art_seed           integer not null default 100,
  cover_url          text,
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists news_published_idx on public.news (published_on desc);

-- ---------- manuscript submissions (public form) ----------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  abstract      text not null,
  author_name   text not null,
  author_email  text not null,
  coauthors     jsonb not null default '[]',
  institution   text not null default '',
  category_slug text not null,
  keywords      text[] not null default '{}',
  paper_url     text not null,
  cover_url     text,
  declaration   boolean not null default false,
  consent       boolean not null default false,
  status        text not null default 'received' check (status in ('received', 'rejected', 'published')),
  created_at    timestamptz not null default now()
);

-- ---------- contact messages ----------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
--   * published content (categories, authors, papers, paper_authors, news) is readable by everyone
--   * submissions and messages have NO public policies: only the server (service role key) can touch them
--   * all writes go through the server with the service role key (which bypasses RLS)
-- ============================================================================
alter table public.categories    enable row level security;
alter table public.authors       enable row level security;
alter table public.papers        enable row level security;
alter table public.paper_authors enable row level security;
alter table public.news          enable row level security;
alter table public.submissions   enable row level security;
alter table public.messages      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories', 'authors', 'papers', 'paper_authors', 'news'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'Public read ' || t) then
      execute format('create policy %I on public.%I for select using (true)', 'Public read ' || t, t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- Storage: public bucket for compressed cover images (hard cap 20 KB per file)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 20480, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 20480, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read covers') then
    create policy "Public read covers" on storage.objects for select using (bucket_id = 'covers');
  end if;
end $$;
