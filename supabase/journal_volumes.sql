-- ============================================================
-- ShodhSutra — Journal Volumes & Issues
-- Compatible with UUID primary keys in public.papers
-- Run this in your Supabase SQL editor
-- ============================================================

-- If previously created with incompatible types, clean them up safely:
drop table if exists public.volume_papers cascade;
drop table if exists public.journal_volumes cascade;

-- ----------------------------------------------------------------
-- 1. journal_volumes
-- ----------------------------------------------------------------
create table if not exists public.journal_volumes (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,                        -- e.g. "Volume 1 - Issue 1"
  year_label    text        not null,                        -- e.g. "2026- 2027"
  period_label  text        not null default '',             -- e.g. "July- September 2026"
  volume_no     int         not null default 1,              -- volume number
  issue_no      int         not null default 1,              -- issue number
  cover_url     text,                                        -- cover image url
  art_style     int         not null default 0,              -- generative art style (0-7)
  art_theme     int         not null default 0,              -- generative art theme (0-5)
  art_seed      int         not null default 1,              -- seed for procedural cover
  description   text,
  published     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 2. volume_papers  (junction table connecting papers to volumes)
--    Uses UUID to match public.papers(id)
-- ----------------------------------------------------------------
create table if not exists public.volume_papers (
  volume_id   uuid not null references public.journal_volumes(id) on delete cascade,
  paper_id    uuid not null references public.papers(id)          on delete cascade,
  position    int  not null default 0,
  primary key (volume_id, paper_id)
);

-- ----------------------------------------------------------------
-- 3. Indexes for fast lookups
-- ----------------------------------------------------------------
create index if not exists idx_volume_papers_volume on public.volume_papers(volume_id);
create index if not exists idx_volume_papers_paper  on public.volume_papers(paper_id);
create index if not exists idx_journal_volumes_year on public.journal_volumes(year_label);

-- ----------------------------------------------------------------
-- 4. Auto-update updated_at trigger
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- 5. Row-Level Security
-- ----------------------------------------------------------------
alter table public.journal_volumes enable row level security;
alter table public.volume_papers   enable row level security;

drop policy if exists "public read journal_volumes" on public.journal_volumes;
drop policy if exists "public read volume_papers" on public.volume_papers;

create policy "public read journal_volumes"
  on public.journal_volumes for select
  using (published = true);

create policy "public read volume_papers"
  on public.volume_papers for select
  using (true);

-- ----------------------------------------------------------------
-- 6. Initial Seed for Academic Year 2026- 2027 (4 Quarterly Issues)
-- ----------------------------------------------------------------
insert into public.journal_volumes (name, year_label, period_label, volume_no, issue_no, art_style, art_theme, art_seed, description)
values
  ('Volume 1 - Issue 1', '2026- 2027', 'July- September 2026',   1, 1, 0, 0, 101, 'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 2', '2026- 2027', 'October - December 2026', 1, 2, 2, 1, 102, 'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 3', '2026- 2027', 'January - March 2027',    1, 3, 4, 2, 103, 'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 4', '2026- 2027', 'April - June 2027',       1, 4, 6, 3, 104, 'Quarterly research issue covering Science, Technology and Humanities.')
on conflict do nothing;
