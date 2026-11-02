-- ============================================================================
-- ShodhSutra — Full Database Migration
-- Version: 2  (includes all schema changes through November 2026)
-- ============================================================================
-- Run this ONCE in a fresh Supabase SQL Editor to recreate the full schema.
--
-- USAGE:
--   1. Create a new Supabase project.
--   2. Open SQL Editor → paste and run this entire file.
--   3. Update your .env with the new SUPABASE_URL and keys.
--   4. The 'covers' storage bucket is created automatically by this script.
--   5. For manuscript PDF uploads (paper_url), create a 'pdfs' bucket manually
--      in Supabase dashboard → Storage → New bucket (set public as needed).
--
-- WHAT'S INCLUDED:
--   Section 0  — Extensions
--   Section 1  — Core tables (categories, authors, papers, paper_authors,
--                news, submissions, messages)
--   Section 2  — Journal volumes & issues (journal_volumes, volume_papers)
--   Section 3  — Row-level security policies
--   Section 4  — Storage bucket (covers)
--   Section 5  — Seed: Manuscript subject categories (15 real categories)
--   Section 6  — Seed: 4 quarterly journal volume placeholders
--
-- SCHEMA NOTES:
--   • papers.citation_style / page_start / page_end  – added via migration;
--     baked directly into the papers table below so no separate ALTER needed.
--   • submissions.content_type  – added via migration; included below.
--   • journal_volumes.description stores a JSON blob:
--       {
--         "pdf_url":            "https://...",   ← full-issue PDF link
--         "patrons":            "...",
--         "advisory_board":     "...",
--         "editorial_board":    { "editor_in_chief": "...",
--                                 "managing_editor": "...",
--                                 "members":         "..." },
--         "reviewer_committee": "...",
--         "text":               "..."            ← optional editorial note
--       }
--   • MANUSCRIPT_CATEGORIES is a frontend JS constant (lib/data.js), not a DB
--     table. The 12 manuscript types are listed in a comment at the bottom of
--     this file for reference.
--   • Demo/sample authors, papers, and news are NOT seeded here — add real
--     content via the admin panel.
-- ============================================================================

-- ============================================================================
-- 0. Extensions
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Core Tables
-- ============================================================================

-- ---------- categories -------------------------------------------------------
create table if not exists public.categories (
  id          uuid    primary key default gen_random_uuid(),
  slug        text    not null unique,
  name        text    not null,
  short_name  text    not null,
  icon        text    not null default 'book',
  description text    not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- authors ----------------------------------------------------------
create table if not exists public.authors (
  id          uuid   primary key default gen_random_uuid(),
  seq         bigint generated always as identity,  -- insertion order ("recently added")
  slug        text   not null unique,
  name        text   not null,
  type        text   not null check (type in ('student', 'faculty', 'researcher')),
  designation text   not null default '',
  institution text   not null default '',
  department  text   not null default '',
  interests   text[] not null default '{}',
  bio         text   not null default '',
  photo_url   text,
  created_at  timestamptz not null default now()
);

-- ---------- papers -----------------------------------------------------------
-- Includes citation_style, page_start, page_end (previously added via ALTER).
create table if not exists public.papers (
  id             uuid     primary key default gen_random_uuid(),
  code           text     unique,
  slug           text     not null unique,
  title          text     not null,
  abstract       text     not null,
  category_slug  text     not null references public.categories (slug) on update cascade on delete restrict,
  category2_slug text     references public.categories (slug) on update cascade on delete set null,
  institution    text     not null default '',
  published_on   date     not null default current_date,
  keywords       text[]   not null default '{}',
  views          integer  not null default 0,
  content_type   text     not null default 'Original Research Articles',
  format         text     not null default 'emp' check (format in ('emp', 'rev', 'ess', 'cas')),
  featured       boolean  not null default false,
  doi            text,                              -- only filled with a verified DOI
  paper_url      text,                              -- link to the manuscript PDF
  peer_reviewed  boolean  not null default false,
  is_demo        boolean  not null default false,
  cover_url      text,                              -- compressed cover in the 'covers' bucket
  art_style      smallint not null default 0 check (art_style  between 0 and 7),
  art_theme      smallint not null default 0 check (art_theme  between 0 and 5),
  art_seed       integer  not null default 1,
  full_text      text     not null default '',
  refs           text[]   not null default '{}',
  -- Citation / page columns (migration v2)
  citation_style text     not null default 'apa',
  page_start     integer,
  page_end       integer,
  created_at     timestamptz not null default now()
);

comment on column public.papers.citation_style is 'Default academic citation style for this paper (apa, ieee, mla, harvard, chicago, vancouver)';
comment on column public.papers.page_start     is 'First page number in the published issue';
comment on column public.papers.page_end       is 'Last page number in the published issue';

create index if not exists papers_category_idx   on public.papers (category_slug);
create index if not exists papers_published_idx  on public.papers (published_on desc);
create unique index if not exists papers_one_featured on public.papers (featured) where featured;

-- ---------- paper <-> author -------------------------------------------------
create table if not exists public.paper_authors (
  paper_id  uuid    not null references public.papers  (id) on delete cascade,
  author_id uuid    not null references public.authors (id) on delete cascade,
  position  integer not null default 1,
  primary key (paper_id, author_id)
);
create index if not exists paper_authors_author_idx on public.paper_authors (author_id);

-- ---------- news -------------------------------------------------------------
create table if not exists public.news (
  id                 uuid     primary key default gen_random_uuid(),
  code               text     unique,
  slug               text     not null unique,
  title              text     not null,
  summary            text     not null default '',
  category           text     not null default 'General',
  published_on       date     not null default current_date,
  body               text[]   not null default '{}',  -- one element per paragraph
  related_paper_slug text,
  byline             text     not null default '',
  art_style          smallint not null default 0 check (art_style between 0 and 7),
  art_theme          smallint not null default 0 check (art_theme between 0 and 5),
  art_seed           integer  not null default 100,
  cover_url          text,
  is_demo            boolean  not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists news_published_idx on public.news (published_on desc);

-- ---------- submissions (public manuscript submission form) ------------------
-- Includes content_type (migration v2).
create table if not exists public.submissions (
  id            uuid    primary key default gen_random_uuid(),
  title         text    not null,
  abstract      text    not null,
  author_name   text    not null,
  author_email  text    not null,
  coauthors     jsonb   not null default '[]',
  institution   text    not null default '',
  category_slug text    not null,
  keywords      text[]  not null default '{}',
  paper_url     text    not null,
  cover_url     text,
  declaration   boolean not null default false,
  consent       boolean not null default false,
  content_type  text    not null default 'Original Research Articles',
  status        text    not null default 'received' check (status in ('received', 'rejected', 'published')),
  created_at    timestamptz not null default now()
);

comment on column public.submissions.content_type is 'Manuscript category chosen by the submitting author (matches MANUSCRIPT_CATEGORIES in lib/data.js)';

-- ---------- contact messages -------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Journal Volumes & Issues
-- ============================================================================
drop table if exists public.volume_papers   cascade;
drop table if exists public.journal_volumes cascade;

create table public.journal_volumes (
  id           uuid    primary key default gen_random_uuid(),
  name         text    not null,            -- e.g. "Volume 1 - Issue 1"
  year_label   text    not null,            -- e.g. "2026-2027"
  period_label text    not null default '', -- e.g. "July-September 2026"
  volume_no    int     not null default 1,
  issue_no     int     not null default 1,
  cover_url    text,                        -- cover image URL
  pdf_url      text,                        -- full-issue PDF (also mirrored in description JSON)
  art_style    int     not null default 0,
  art_theme    int     not null default 0,
  art_seed     int     not null default 1,
  description  text,                        -- JSON blob: { pdf_url, patrons, advisory_board,
                                            --   editorial_board:{editor_in_chief, managing_editor, members},
                                            --   reviewer_committee, text }
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.volume_papers (
  volume_id uuid not null references public.journal_volumes (id) on delete cascade,
  paper_id  uuid not null references public.papers          (id) on delete cascade,
  position  int  not null default 0,
  primary key (volume_id, paper_id)
);

create index if not exists idx_volume_papers_volume on public.volume_papers (volume_id);
create index if not exists idx_volume_papers_paper  on public.volume_papers (paper_id);
create index if not exists idx_journal_volumes_year on public.journal_volumes (year_label);

-- Auto-update updated_at on every change
create or replace function touch_journal_volumes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_journal_volumes_updated_at on public.journal_volumes;
create trigger trg_journal_volumes_updated_at
  before update on public.journal_volumes
  for each row execute function touch_journal_volumes_updated_at();

-- ============================================================================
-- 3. Row-Level Security
-- ============================================================================
--   Public read  — categories, authors, papers, paper_authors, news
--   Conditional  — journal_volumes (published = true only), volume_papers
--   No public policy — submissions, messages  (service role key only)
--   All writes go through the server with the service role key (bypasses RLS)
-- ============================================================================
alter table public.categories     enable row level security;
alter table public.authors        enable row level security;
alter table public.papers         enable row level security;
alter table public.paper_authors  enable row level security;
alter table public.news           enable row level security;
alter table public.submissions    enable row level security;
alter table public.messages       enable row level security;
alter table public.journal_volumes enable row level security;
alter table public.volume_papers   enable row level security;

-- Public read for core content tables
do $$
declare t text;
begin
  foreach t in array array['categories','authors','papers','paper_authors','news'] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'Public read ' || t
    ) then
      execute format(
        'create policy %I on public.%I for select using (true)',
        'Public read ' || t, t
      );
    end if;
  end loop;
end $$;

-- Journal volumes: only rows where published = true
drop policy if exists "public read journal_volumes" on public.journal_volumes;
create policy "public read journal_volumes"
  on public.journal_volumes for select
  using (published = true);

-- Volume papers: always readable (visibility enforced via volume join)
drop policy if exists "public read volume_papers" on public.volume_papers;
create policy "public read volume_papers"
  on public.volume_papers for select
  using (true);

-- ============================================================================
-- 4. Storage — 'covers' bucket (public, hard cap 20 KB per file)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 20480, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = 20480,
      allowed_mime_types = array['image/webp','image/jpeg','image/png'];

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public read covers'
  ) then
    create policy "Public read covers" on storage.objects
      for select using (bucket_id = 'covers');
  end if;
end $$;

-- ============================================================================
-- 5. Seed: Manuscript Subject Categories (15 real categories)
-- ============================================================================
-- These are the research discipline categories that papers are filed under.
-- They are NOT demo data — keep them even in production.
-- ============================================================================
insert into public.categories (slug, name, short_name, icon, description, sort_order) values
  ('technology',     'Technology & Computer Science',              'Technology',      'monitor', 'Software, systems, networks, human–computer interaction and the engineering of digital tools.',  10),
  ('ai-ml',          'Artificial Intelligence & Machine Learning', 'AI & ML',         'cpu',     'Learning systems, language models, evaluation methods and the societal questions they raise.',   20),
  ('environment',    'Environment & Climate Change',               'Environment',     'leaf',    'Ecosystems, urban climate, monitoring methods and strategies for a changing planet.',            30),
  ('healthcare',     'Healthcare & Medical Sciences',              'Healthcare',      'heart',   'Clinical practice, public health, medical education and health-service delivery.',              40),
  ('engineering',    'Engineering & Robotics',                     'Engineering',     'cog',     'Design, sensing, structures, automation and the craft of building things that work.',           50),
  ('biology',        'Biology & Biotechnology',                    'Biology',         'dna',     'Life sciences from microbiomes to field ecology, plus the methods that power them.',           60),
  ('physics-math',   'Physics & Mathematics',                      'Physics & Maths', 'atom',    'Modelling, numerical methods, networks and the mathematics behind physical systems.',          70),
  ('education',      'Education & Pedagogy',                       'Education',       'grad',    'Teaching methods, learning science, curriculum design and educational technology.',            80),
  ('business',       'Business & Economics',                       'Business',        'chart',   'Markets, household finance, entrepreneurship and technology adoption in organisations.',        90),
  ('social-sciences','Social Sciences & Psychology',               'Social Sciences', 'smile',   'Human behaviour, community, belonging and the structure of modern societies.',                100),
  ('agriculture',    'Agriculture & Food Sciences',                'Agriculture',     'wheat',   'Crop systems, water use, food security and smallholder farming practice.',                    110),
  ('energy',         'Energy & Sustainability',                    'Energy',          'zap',     'Renewables, storage, microgrids and low-carbon community energy models.',                     120),
  ('chemistry',      'Chemistry & Materials Science',              'Chemistry',       'flask',   'Green chemistry, polymers, extraction and the design of new materials.',                      130),
  ('humanities',     'Humanities & Literature',                    'Humanities',      'book',    'Literary studies, history, memory, archives and the ethics of cultural record.',              140),
  ('law',            'Law & Public Policy',                        'Law & Policy',    'scale',   'Regulation, governance, transparency and the public interest in a digital age.',              150)
on conflict (slug) do nothing;

-- ============================================================================
-- 6. Seed: Journal Volume Placeholders (4 quarterly issues 2026-2027)
-- ============================================================================
-- These are structural placeholders. Edit patrons/boards via the admin panel.
-- ============================================================================
insert into public.journal_volumes (name, year_label, period_label, volume_no, issue_no, art_style, art_theme, art_seed, description, published)
values
  ('Volume 1 - Issue 1', '2026-2027', 'June - August 2026',     1, 1, 0, 0, 101, '{}', true),
  ('Volume 1 - Issue 2', '2026-2027', 'October - December 2026',1, 2, 0, 0, 102, '{}', true),
  ('Volume 1 - Issue 3', '2026-2027', 'January - March 2027',   1, 3, 0, 0, 103, '{}', true),
  ('Volume 1 - Issue 4', '2026-2027', 'April - June 2027',      1, 4, 0, 0, 104, '{}', true)
on conflict do nothing;

-- ============================================================================
-- End of ShodhSutra full migration (v2)
-- ============================================================================

-- ─── POST-MIGRATION SANITY CHECK (run in SQL editor) ────────────────────────
-- select
--   (select count(*) from public.categories)      as categories,   -- expect 15
--   (select count(*) from public.authors)         as authors,      -- expect 0
--   (select count(*) from public.papers)          as papers,       -- expect 0
--   (select count(*) from public.news)            as news,         -- expect 0
--   (select count(*) from public.journal_volumes) as volumes;      -- expect 4

-- ─── REFERENCE: MANUSCRIPT_CATEGORIES (frontend JS constant, not a DB table) ─
-- These 12 values are defined in lib/data.js as MANUSCRIPT_CATEGORIES and
-- shown in dropdowns on the Submit page and admin Paper form.
--
--   1.  Original Research Articles
--   2.  Review Articles (Literature Reviews)
--   3.  Systematic Reviews & Meta-Analyses
--   4.  Short Communications / Brief Reports
--   5.  Case Studies / Case Reports
--   6.  Methodological Papers / Methods Articles
--   7.  Theoretical / Conceptual Papers
--   8.  Perspectives, Opinions, & Commentaries
--   9.  Editorials
--   10. Letters to the Editor
--   11. Data Papers / Data Sets
--   12. Book Reviews
-- ============================================================================
