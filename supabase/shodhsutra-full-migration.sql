-- ============================================================================
-- ShodhSutra — Full Database Migration
-- ============================================================================
-- Run this ONCE in a fresh Supabase SQL Editor to set up the entire schema.
--
-- USAGE:
--   1. Create a new Supabase project.
--   2. Open the SQL Editor and paste / run this file.
--   3. Update your .env file with the new SUPABASE_URL and SUPABASE_ANON_KEY.
--   4. The 'covers' storage bucket is created automatically below.
--   5. If you use a 'pdfs' bucket for manuscript PDFs, create it manually in
--      the Supabase dashboard → Storage → New bucket (set it public if needed).
--
-- NOTES:
--   • Every statement is idempotent (safe to re-run on an existing database).
--   • The 'description' column in journal_volumes stores a JSON string with
--     the following structure:
--       {
--         "patrons":          "free text",
--         "advisory_board":   "free text",
--         "editorial_board":  "free text",
--         "reviewer_committee":"free text",
--         "pdf_url":          "https://..."    ← full-issue PDF URL
--       }
--     The application encodes/decodes this transparently.
--   • Seed data at the bottom is DEMO content. Comment out or delete it if
--     you are migrating with real production data instead.
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
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  short_name  text not null,
  icon        text not null default 'book',
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- authors ----------------------------------------------------------
create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  seq         bigint generated always as identity,   -- insertion order ("recently added")
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

-- ---------- papers -----------------------------------------------------------
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
  doi            text,                                -- only ever filled with a verified DOI
  paper_url      text,                               -- link to the manuscript (replaces file upload)
  peer_reviewed  boolean not null default false,     -- only true when verified
  is_demo        boolean not null default false,
  cover_url      text,                               -- compressed cover (<= 10 KB) in the 'covers' bucket
  art_style      smallint not null default 0 check (art_style between 0 and 7),
  art_theme      smallint not null default 0 check (art_theme between 0 and 5),
  art_seed       integer not null default 1,
  full_text      text not null default '',
  refs           text[] not null default '{}',
  -- citation columns (added via migration)
  citation_style text not null default 'apa',
  page_start     integer,
  page_end       integer,
  created_at     timestamptz not null default now()
);

create index if not exists papers_category_idx   on public.papers (category_slug);
create index if not exists papers_published_idx  on public.papers (published_on desc);
create unique index if not exists papers_one_featured on public.papers (featured) where featured;

comment on column public.papers.citation_style is 'Default academic citation style selected for this paper (apa, ieee, mla, harvard, chicago, vancouver)';
comment on column public.papers.page_start      is 'First page number of the paper in publication/issue';
comment on column public.papers.page_end        is 'Last page number of the paper in publication/issue';

-- ---------- paper <-> author -------------------------------------------------
create table if not exists public.paper_authors (
  paper_id  uuid not null references public.papers (id) on delete cascade,
  author_id uuid not null references public.authors (id) on delete cascade,
  position  integer not null default 1,
  primary key (paper_id, author_id)
);
create index if not exists paper_authors_author_idx on public.paper_authors (author_id);

-- ---------- news -------------------------------------------------------------
create table if not exists public.news (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique,
  slug               text not null unique,
  title              text not null,
  summary            text not null default '',
  category           text not null default 'General',
  published_on       date not null default current_date,
  body               text[] not null default '{}',    -- one array item per paragraph
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

-- ---------- manuscript submissions (public form) -----------------------------
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

-- Drop and recreate for clean migration (safe on fresh DB, idempotent otherwise)
drop table if exists public.volume_papers   cascade;
drop table if exists public.journal_volumes cascade;

create table if not exists public.journal_volumes (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,           -- e.g. "Volume 1 - Issue 1"
  year_label   text        not null,           -- e.g. "2026-2027"
  period_label text        not null default '', -- e.g. "July-September 2026"
  volume_no    int         not null default 1,
  issue_no     int         not null default 1,
  cover_url    text,                            -- cover image URL
  pdf_url      text,                            -- open full-issue PDF URL (also stored in description JSON)
  art_style    int         not null default 0,
  art_theme    int         not null default 0,
  art_seed     int         not null default 1,
  description  text,                            -- JSON: { patrons, advisory_board, editorial_board, reviewer_committee, pdf_url }
  published    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.volume_papers (
  volume_id uuid not null references public.journal_volumes (id) on delete cascade,
  paper_id  uuid not null references public.papers (id)          on delete cascade,
  position  int  not null default 0,
  primary key (volume_id, paper_id)
);

create index if not exists idx_volume_papers_volume on public.volume_papers (volume_id);
create index if not exists idx_volume_papers_paper  on public.volume_papers (paper_id);
create index if not exists idx_journal_volumes_year on public.journal_volumes (year_label);

-- Auto-update updated_at trigger
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
-- 3. Row Level Security
-- ============================================================================
--   • Published content (categories, authors, papers, paper_authors, news) is
--     readable by everyone (anon + authenticated).
--   • submissions and messages have NO public policies; only the server
--     (service role key) can touch them.
--   • journal_volumes: publicly readable only when published = true.
--   • volume_papers: publicly readable always (restricted by volume join).
--   • All writes go through the server with the service role key (bypasses RLS).
-- ============================================================================

alter table public.categories    enable row level security;
alter table public.authors       enable row level security;
alter table public.papers        enable row level security;
alter table public.paper_authors enable row level security;
alter table public.news          enable row level security;
alter table public.submissions   enable row level security;
alter table public.messages      enable row level security;
alter table public.journal_volumes enable row level security;
alter table public.volume_papers   enable row level security;

-- Public read policies for core content tables
do $$
declare t text;
begin
  foreach t in array array['categories', 'authors', 'papers', 'paper_authors', 'news'] loop
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

-- Journal volumes: only published rows are visible
drop policy if exists "public read journal_volumes" on public.journal_volumes;
create policy "public read journal_volumes"
  on public.journal_volumes for select
  using (published = true);

-- Volume papers: always readable (volume visibility is enforced via join)
drop policy if exists "public read volume_papers" on public.volume_papers;
create policy "public read volume_papers"
  on public.volume_papers for select
  using (true);

-- ============================================================================
-- 4. Storage — 'covers' bucket (public, max 20 KB per file)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 20480, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = 20480,
      allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

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

-- NOTE: If you use a separate 'pdfs' bucket for manuscript PDFs, create it
-- manually in the Supabase dashboard (Storage → New bucket) and set it public.

-- ============================================================================
-- 5. Seed Data  (DEMO / sample content — comment out if migrating real data)
-- ============================================================================

begin;

-- ---------- categories (15) ----------
insert into public.categories (slug, name, short_name, icon, description, sort_order) values
  ('technology',    'Technology & Computer Science',             'Technology',      'monitor', 'Software, systems, networks, human–computer interaction and the engineering of digital tools.', 10),
  ('ai-ml',         'Artificial Intelligence & Machine Learning','AI & ML',         'cpu',     'Learning systems, language models, evaluation methods and the societal questions they raise.',  20),
  ('environment',   'Environment & Climate Change',              'Environment',     'leaf',    'Ecosystems, urban climate, monitoring methods and strategies for a changing planet.',             30),
  ('healthcare',    'Healthcare & Medical Sciences',             'Healthcare',      'heart',   'Clinical practice, public health, medical education and health-service delivery.',               40),
  ('engineering',   'Engineering & Robotics',                    'Engineering',     'cog',     'Design, sensing, structures, automation and the craft of building things that work.',            50),
  ('biology',       'Biology & Biotechnology',                   'Biology',         'dna',     'Life sciences from microbiomes to field ecology, plus the methods that power them.',            60),
  ('physics-math',  'Physics & Mathematics',                     'Physics & Maths', 'atom',    'Modelling, numerical methods, networks and the mathematics behind physical systems.',           70),
  ('education',     'Education & Pedagogy',                      'Education',       'grad',    'Teaching methods, learning science, curriculum design and educational technology.',             80),
  ('business',      'Business & Economics',                      'Business',        'chart',   'Markets, household finance, entrepreneurship and technology adoption in organisations.',         90),
  ('social-sciences','Social Sciences & Psychology',             'Social Sciences', 'smile',   'Human behaviour, community, belonging and the structure of modern societies.',                 100),
  ('agriculture',   'Agriculture & Food Sciences',               'Agriculture',     'wheat',   'Crop systems, water use, food security and smallholder farming practice.',                     110),
  ('energy',        'Energy & Sustainability',                   'Energy',          'zap',     'Renewables, storage, microgrids and low-carbon community energy models.',                      120),
  ('chemistry',     'Chemistry & Materials Science',             'Chemistry',       'flask',   'Green chemistry, polymers, extraction and the design of new materials.',                       130),
  ('humanities',    'Humanities & Literature',                   'Humanities',      'book',    'Literary studies, history, memory, archives and the ethics of cultural record.',               140),
  ('law',           'Law & Public Policy',                       'Law & Policy',    'scale',   'Regulation, governance, transparency and the public interest in a digital age.',               150)
on conflict (slug) do nothing;

-- ---------- authors (19) ----------
insert into public.authors (slug, name, type, designation, institution, department, interests, bio) values
  ('priya-nair',      'Priya Nair',       'student',    'BTech Computer Science student',     'Lakeshore Institute of Technology', 'Computer Science',    array['Language models','Efficient ML','Computer vision']::text[],           'Priya is a final-year undergraduate exploring how small models can do more with less compute. This is a fictional demonstration profile.'),
  ('daniel-okafor',   'Daniel Okafor',    'faculty',    'Associate Professor',                 'Northvale University',              'Computer Science',    array['Web architecture','Accessibility','Education technology']::text[],      'Daniel researches resilient web systems for classrooms and public services. This is a fictional demonstration profile.'),
  ('meera-iyer',      'Meera Iyer',       'student',    'MSc Environmental Science student',   'Meridian College of Science',       'Environmental Science',array['Urban climate','Citizen science','Remote sensing']::text[],          'Meera studies how neighbourhood-scale temperature differences can be measured cheaply. This is a fictional demonstration profile.'),
  ('lucas-fernandez', 'Lucas Fernandez',  'faculty',    'Professor of Public Health',          'Corvus Medical University',         'Public Health',       array['Community health','Health workforce','Programme evaluation']::text[],   'Lucas writes about training and supervising community health workers. This is a fictional demonstration profile.'),
  ('sana-qureshi',    'Sana Qureshi',     'student',    'Medical undergraduate',               'Corvus Medical University',         'Medical Education',   array['Sleep','Medical education','Survey methods']::text[],                 'Sana is interested in how student routines shape learning in medical programmes. This is a fictional demonstration profile.'),
  ('hannah-schmidt',  'Hannah Schmidt',   'researcher', 'Independent Researcher',              'Independent',                       'Applied AI',          array['Multi-agent systems','Trust calibration','Evaluation']::text[],        'Hannah works independently on evaluation methods for interacting AI agents. This is a fictional demonstration profile.'),
  ('rohan-desai',     'Rohan Desai',      'faculty',    'Assistant Professor',                 'Lakeshore Institute of Technology', 'Mechanical Engineering',array['Soft robotics','Sensing','Prototyping']::text[],                   'Rohan leads a small lab building affordable robots and sensors. This is a fictional demonstration profile.'),
  ('elena-petrova',   'Elena Petrova',    'faculty',    'Professor of Physics',                'Northvale University',              'Physics',             array['Numerical methods','Dynamical systems','Networks']::text[],            'Elena teaches computational physics and writes on simulation stability. This is a fictional demonstration profile.'),
  ('kabir-sharma',    'Kabir Sharma',     'student',    'MBA student',                         'Halcyon Business School',           'Management',          array['Digital payments','Small business','Survey design']::text[],           'Kabir researches how small retailers adopt new payment tools. This is a fictional demonstration profile.'),
  ('amara-diallo',    'Amara Diallo',     'researcher', 'Research Fellow',                     'Westbrook Agricultural Institute',  'Agronomy',            array['Irrigation','Smallholder farming','Community energy']::text[],         'Amara runs field trials on water-efficient vegetable growing. This is a fictional demonstration profile.'),
  ('yuki-tanaka',     'Yuki Tanaka',      'faculty',    'Senior Lecturer in English Literature','Aster Humanities College',         'English Literature',  array['Contemporary fiction','Memory studies','Oral history']::text[],        'Yuki writes about place, memory and storytelling. This is a fictional demonstration profile.'),
  ('isabella-rossi',  'Isabella Rossi',   'student',    'LLB student',                         'Riverside Law Academy',             'Law',                 array['Public policy','Algorithmic accountability','Administrative law']::text[],'Isabella studies how transparency rules apply to automated public services. This is a fictional demonstration profile.'),
  ('omar-haddad',     'Omar Haddad',      'faculty',    'Professor of Economics',              'Halcyon Business School',           'Economics',           array['Household finance','Inflation expectations','Behavioural economics']::text[],'Omar studies how people form expectations and save. This is a fictional demonstration profile.'),
  ('neha-kulkarni',   'Neha Kulkarni',    'student',    'BSc Chemistry student',               'Meridian College of Science',       'Chemistry',           array['Biopolymers','Green chemistry','Extraction']::text[],                  'Neha reviews lab protocols for greener materials. This is a fictional demonstration profile.'),
  ('thomas-grey',     'Thomas Grey',      'researcher', 'Postdoctoral Researcher',             'Northvale University',              'Energy Systems',      array['Solar power','Battery storage','Microgrids']::text[],                  'Thomas models how campuses can balance solar and storage. This is a fictional demonstration profile.'),
  ('ananya-bose',     'Ananya Bose',      'faculty',    'Associate Professor of Education',    'Aster Humanities College',          'Education',           array['Project-based learning','Mathematics education','Digital archives']::text[],'Ananya researches how students retain ideas through projects. This is a fictional demonstration profile.'),
  ('jonas-berg',      'Jonas Berg',       'student',    'MSc Robotics student',                'Lakeshore Institute of Technology', 'Mechanical Engineering',array['Sensors','Structural monitoring','Graph models']::text[],            'Jonas builds low-cost sensing rigs for small structures. This is a fictional demonstration profile.'),
  ('fatima-zahra',    'Fatima Zahra',     'researcher', 'Research Associate',                  'Corvus Medical University',         'Biotechnology',       array['Microbiome','Sampling methods','Ecology']::text[],                    'Fatima compares sampling methods in microbiome studies. This is a fictional demonstration profile.'),
  ('arjun-malhotra',  'Arjun Malhotra',   'student',    'BA Psychology student',               'Aster Humanities College',          'Psychology',          array['Belonging','Social media','Usability']::text[],                       'Arjun researches how students feel connected on campus. This is a fictional demonstration profile.')
on conflict (slug) do nothing;

-- ---------- papers (27) ----------
insert into public.papers (code, slug, title, abstract, category_slug, category2_slug, institution, published_on, keywords, views, content_type, format, featured, doi, paper_url, peer_reviewed, is_demo, cover_url, art_style, art_theme, art_seed, full_text, refs) values
  ('SS-DEMO-001','adaptive-attention-budgets-in-small-language-models-a-simulation-study','Adaptive Attention Budgets in Small Language Models: A Simulation Study','Small language models often spend the same compute on every token. This simulation study explores whether a learned budget that allocates attention unevenly across a sequence can keep accuracy steady while lowering average cost, and outlines a protocol for testing the idea on public benchmarks.','ai-ml',null,'Lakeshore Institute of Technology','2026-09-24',array['language models','attention','efficiency','simulation']::text[],12840,'Original Research','emp',true,null,null,false,true,null,1,2,1,'','{}'),
  ('SS-DEMO-002','offline-first-web-architectures-for-low-connectivity-classrooms','Offline-First Web Architectures for Low-Connectivity Classrooms','Many classrooms rely on unstable internet access. This paper describes an offline-first architecture using service workers and local storage, and proposes usability and sync-reliability measures for evaluating it in schools.','technology',null,'Northvale University','2026-09-12',array['offline-first','progressive web apps','education technology','caching']::text[],7310,'Original Research','emp',false,null,null,false,true,null,6,3,2,'','{}'),
  ('SS-DEMO-003','urban-heat-island-patterns-in-mid-sized-coastal-cities-a-sampling-framew','Urban Heat Island Patterns in Mid-Sized Coastal Cities: A Sampling Framework','Temperature varies sharply between neighbourhoods, yet monitoring networks are sparse. The paper proposes a low-cost sampling framework combining satellite layers with street-level sensors and discusses how monitoring sites should be chosen.','environment',null,'Meridian College of Science','2026-08-30',array['urban heat','sampling','coastal cities','remote sensing']::text[],5120,'Original Research','emp',false,null,null,false,true,null,3,4,3,'','{}'),
  ('SS-DEMO-004','community-health-worker-training-models-a-comparative-review','Community Health Worker Training Models: A Comparative Review','This review compares how community health worker training programmes are structured, assessed and supervised, and identifies the design features that evaluation studies most often examine.','healthcare',null,'Corvus Medical University','2026-08-18',array['community health','training','primary care','programme evaluation']::text[],9460,'Review Article','rev',false,null,null,false,true,null,0,5,4,'','{}'),
  ('SS-DEMO-005','sleep-routines-and-study-performance-among-medical-undergraduates','Sleep Routines and Study Performance Among Medical Undergraduates','A cross-sectional survey design is outlined to explore how sleep routines relate to self-reported study performance in medical undergraduates, with attention to confounders such as clinical posting schedules.','healthcare',null,'Corvus Medical University','2026-07-29',array['sleep','medical education','academic performance','survey']::text[],4380,'Original Research','emp',false,null,null,false,true,null,5,0,5,'','{}'),
  ('SS-DEMO-006','evaluating-trust-calibration-in-multi-agent-language-model-pipelines','Evaluating Trust Calibration in Multi-Agent Language Model Pipelines','When several language model agents pass information to one another, errors can compound. This paper proposes metrics for how well each agent''s confidence tracks its reliability, and a controlled set-up for testing how misinformation propagates.','ai-ml','technology','Independent','2026-10-02',array['multi-agent systems','trust calibration','misinformation','evaluation']::text[],10990,'Original Research','emp',false,null,null,false,true,null,2,1,6,'','{}'),
  ('SS-DEMO-007','low-cost-soft-gripper-design-for-delicate-object-handling','Low-Cost Soft Gripper Design for Delicate Object Handling','This paper presents a design approach for a soft pneumatic gripper built from affordable materials, and describes a test plan for grasping fragile items such as fruit and glassware.','engineering',null,'Lakeshore Institute of Technology','2026-07-14',array['soft robotics','gripper','prototyping','manufacturing']::text[],6270,'Original Research','emp',false,null,null,false,true,null,7,2,7,'','{}'),
  ('SS-DEMO-008','numerical-stability-in-coupled-oscillator-models','Numerical Stability in Coupled Oscillator Models','Coupled oscillator simulations can drift when time steps are chosen carelessly. The article compares common integration schemes and discusses practical criteria for selecting step sizes.','physics-math',null,'Northvale University','2026-06-21',array['oscillators','numerical methods','stability','simulation']::text[],3890,'Original Research','emp',false,null,null,false,true,null,4,3,8,'','{}'),
  ('SS-DEMO-009','digital-payment-adoption-among-small-retailers-a-survey-design','Digital Payment Adoption Among Small Retailers: A Survey Design','Small retailers face a growing menu of payment tools. This paper sets out a survey instrument for studying what drives adoption, from fees and trust to customer demand and staff skills.','business',null,'Halcyon Business School','2026-09-05',array['digital payments','small business','technology adoption','survey design']::text[],5790,'Original Research','emp',false,null,null,false,true,null,1,4,9,'','{}'),
  ('SS-DEMO-010','drip-irrigation-scheduling-for-smallholder-vegetable-plots','Drip Irrigation Scheduling for Smallholder Vegetable Plots','Water is a limiting input for many smallholders. The paper describes a field-trial design that compares simple drip irrigation schedules for vegetable plots and defines measures of water efficiency.','agriculture',null,'Westbrook Agricultural Institute','2026-05-17',array['irrigation','smallholder farming','water efficiency','field trial']::text[],4710,'Original Research','emp',false,null,null,false,true,null,6,5,10,'','{}'),
  ('SS-DEMO-011','memory-and-place-in-contemporary-coastal-fiction','Memory and Place in Contemporary Coastal Fiction','This essay reads a set of recent coastal narratives to ask how fiction uses shorelines, tides and ports to stage personal and collective memory.','humanities',null,'Aster Humanities College','2026-04-26',array['literary studies','place','memory','fiction']::text[],2980,'Essay','ess',false,null,null,false,true,null,3,0,11,'','{}'),
  ('SS-DEMO-012','algorithmic-transparency-in-public-service-delivery-policy-perspectives','Algorithmic Transparency in Public Service Delivery: Policy Perspectives','As public agencies adopt automated decision tools, citizens need ways to understand and contest outcomes. This policy analysis outlines transparency options and the trade-offs each one carries.','law',null,'Riverside Law Academy','2026-08-08',array['transparency','public policy','algorithms','accountability']::text[],6850,'Policy Analysis','ess',false,null,null,false,true,null,0,1,12,'','{}'),
  ('SS-DEMO-013','inflation-expectations-and-household-saving-behaviour','Inflation Expectations and Household Saving Behaviour','This review organises the literature on how households form expectations about prices and how those expectations may shape saving decisions, noting gaps for future empirical work.','business',null,'Halcyon Business School','2026-03-12',array['inflation expectations','saving','household finance','behavioural economics']::text[],5240,'Review Article','rev',false,null,null,false,true,null,5,2,13,'','{}'),
  ('SS-DEMO-014','biodegradable-polymer-blends-from-agricultural-residue-a-protocol-review','Biodegradable Polymer Blends from Agricultural Residue: A Protocol Review','Agricultural residues are a promising feedstock for biodegradable materials. This review compares laboratory protocols for preparing and testing polymer blends and highlights reporting practices that aid replication.','chemistry',null,'Meridian College of Science','2026-07-02',array['biopolymers','agricultural residue','materials','protocol']::text[],4150,'Review Article','rev',false,null,null,false,true,null,2,3,14,'','{}'),
  ('SS-DEMO-015','hybrid-rooftop-solar-and-battery-dispatch-for-campus-microgrids','Hybrid Rooftop Solar and Battery Dispatch for Campus Microgrids','Campuses can pair rooftop solar with batteries to reduce peak demand. The paper formulates a simple dispatch model and describes scenarios for testing it on a typical academic load profile.','energy',null,'Northvale University','2026-09-19',array['solar','battery storage','microgrid','dispatch']::text[],8120,'Original Research','emp',false,null,null,false,true,null,7,4,15,'','{}'),
  ('SS-DEMO-016','project-based-learning-and-conceptual-retention-in-secondary-science','Project-Based Learning and Conceptual Retention in Secondary Science','This study design compares project-based units with conventional teaching on how well secondary students retain core science concepts over several months.','education',null,'Aster Humanities College','2026-02-20',array['project-based learning','retention','science education','secondary school']::text[],6030,'Original Research','emp',false,null,null,false,true,null,4,5,16,'','{}'),
  ('SS-DEMO-017','vibration-monitoring-with-low-cost-sensors-for-small-bridges','Vibration Monitoring with Low-Cost Sensors for Small Bridges','This case study describes how inexpensive accelerometers can be deployed on a small footbridge, and discusses data quality, calibration and what the readings can and cannot tell an engineer.','engineering',null,'Lakeshore Institute of Technology','2026-10-08',array['structural health','vibration','sensors','bridges']::text[],3560,'Case Study','cas',false,null,null,false,true,null,1,0,17,'','{}'),
  ('SS-DEMO-018','gut-microbiome-sampling-methods-comparative-considerations','Gut Microbiome Sampling Methods: Comparative Considerations','The way a sample is collected and stored can shape microbiome results. This review compares common sampling methods and lists practical considerations for study design.','biology',null,'Corvus Medical University','2026-06-03',array['microbiome','sampling','methods','biotechnology']::text[],5480,'Review Article','rev',false,null,null,false,true,null,6,1,18,'','{}'),
  ('SS-DEMO-019','social-media-use-and-perceived-belonging-in-first-year-university-studen','Social Media Use and Perceived Belonging in First-Year University Students','Starting university can be isolating. This paper proposes a mixed-methods design to explore how different patterns of social media use relate to students'' sense of belonging in their first year.','social-sciences',null,'Aster Humanities College','2026-05-29',array['belonging','social media','first-year students','psychology']::text[],7020,'Original Research','emp',false,null,null,false,true,null,3,2,19,'','{}'),
  ('SS-DEMO-020','accessible-design-patterns-for-government-web-portals','Accessible Design Patterns for Government Web Portals','Public portals serve everyone, yet accessibility gaps persist. This multidisciplinary review gathers design patterns for forms, navigation and error handling, and links them to policy obligations.','technology','law','Northvale University','2026-01-15',array['accessibility','web design','e-government','usability']::text[],4890,'Review Article','rev',false,null,null,false,true,null,0,3,20,'','{}'),
  ('SS-DEMO-021','community-biogas-models-in-peri-urban-settlements','Community Biogas Models in Peri-Urban Settlements','This case study compares ownership and maintenance models for small community biogas plants, drawing together agricultural and energy perspectives.','energy','agriculture','Westbrook Agricultural Institute','2025-12-11',array['biogas','peri-urban','waste to energy','community']::text[],3320,'Case Study','cas',false,null,null,false,true,null,5,4,21,'','{}'),
  ('SS-DEMO-022','few-shot-image-classification-for-crop-disease-screening','Few-Shot Image Classification for Crop Disease Screening','Labelled images of crop disease are scarce. The paper evaluates few-shot approaches that could help screen leaf images with limited examples, and proposes field-realistic test conditions.','ai-ml','agriculture','Lakeshore Institute of Technology','2025-11-18',array['few-shot learning','crop disease','image classification','agriculture']::text[],9120,'Original Research','emp',false,null,null,false,true,null,2,5,22,'','{}'),
  ('SS-DEMO-023','mangrove-restoration-monitoring-using-citizen-science','Mangrove Restoration Monitoring Using Citizen Science','This case study examines how volunteers can help monitor mangrove restoration plots, and considers training, data checking and long-term engagement.','environment','biology','Meridian College of Science','2025-10-06',array['mangroves','citizen science','restoration','monitoring']::text[],4020,'Case Study','cas',false,null,null,false,true,null,7,0,23,'','{}'),
  ('SS-DEMO-024','oral-histories-and-digital-archives-ethical-frameworks','Oral Histories and Digital Archives: Ethical Frameworks','Digitising oral histories raises questions of consent, ownership and access. This essay discusses frameworks that archives can use to respect narrators over time.','humanities','technology','Aster Humanities College','2025-08-22',array['oral history','digital archives','ethics','consent']::text[],2610,'Essay','ess',false,null,null,false,true,null,4,1,24,'','{}'),
  ('SS-DEMO-025','graph-theoretic-models-of-campus-mobility','Graph-Theoretic Models of Campus Mobility','Students move across campus in patterns that can be described as a network. The paper builds simple graph models of walking routes and discusses what they imply for congestion.','physics-math',null,'Northvale University','2024-11-09',array['graph theory','mobility','networks','modelling']::text[],3050,'Original Research','emp',false,null,null,false,true,null,1,2,25,'','{}'),
  ('SS-DEMO-026','green-solvent-selection-for-small-scale-extraction','Green Solvent Selection for Small-Scale Extraction','This review summarises criteria for choosing greener solvents in small-scale laboratory extraction, balancing performance, safety and environmental impact.','chemistry',null,'Meridian College of Science','2024-09-14',array['green chemistry','solvents','extraction','sustainability']::text[],2780,'Review Article','rev',false,null,null,false,true,null,6,3,26,'','{}'),
  ('SS-DEMO-027','probability-puzzles-as-a-gateway-to-mathematical-reasoning','Probability Puzzles as a Gateway to Mathematical Reasoning','This essay argues that carefully chosen probability puzzles can introduce students to proof-like reasoning, and offers classroom sequencing ideas.','education','physics-math','Aster Humanities College','2024-06-30',array['mathematics education','probability','reasoning','pedagogy']::text[],2240,'Essay','ess',false,null,null,false,true,null,3,4,27,'','{}')
on conflict (slug) do nothing;

-- ---------- paper <-> author links ----------
insert into public.paper_authors (paper_id, author_id, position)
select p.id, a.id, v.pos from (values
  ('adaptive-attention-budgets-in-small-language-models-a-simulation-study',        'priya-nair',       1),
  ('offline-first-web-architectures-for-low-connectivity-classrooms',               'daniel-okafor',    1),
  ('urban-heat-island-patterns-in-mid-sized-coastal-cities-a-sampling-framew',      'meera-iyer',       1),
  ('community-health-worker-training-models-a-comparative-review',                  'lucas-fernandez',  1),
  ('sleep-routines-and-study-performance-among-medical-undergraduates',             'sana-qureshi',     1),
  ('evaluating-trust-calibration-in-multi-agent-language-model-pipelines',          'hannah-schmidt',   1),
  ('low-cost-soft-gripper-design-for-delicate-object-handling',                     'rohan-desai',      1),
  ('low-cost-soft-gripper-design-for-delicate-object-handling',                     'jonas-berg',       2),
  ('numerical-stability-in-coupled-oscillator-models',                              'elena-petrova',    1),
  ('digital-payment-adoption-among-small-retailers-a-survey-design',                'kabir-sharma',     1),
  ('drip-irrigation-scheduling-for-smallholder-vegetable-plots',                    'amara-diallo',     1),
  ('memory-and-place-in-contemporary-coastal-fiction',                              'yuki-tanaka',      1),
  ('algorithmic-transparency-in-public-service-delivery-policy-perspectives',       'isabella-rossi',   1),
  ('inflation-expectations-and-household-saving-behaviour',                         'omar-haddad',      1),
  ('biodegradable-polymer-blends-from-agricultural-residue-a-protocol-review',      'neha-kulkarni',    1),
  ('hybrid-rooftop-solar-and-battery-dispatch-for-campus-microgrids',               'thomas-grey',      1),
  ('project-based-learning-and-conceptual-retention-in-secondary-science',          'ananya-bose',      1),
  ('vibration-monitoring-with-low-cost-sensors-for-small-bridges',                  'jonas-berg',       1),
  ('vibration-monitoring-with-low-cost-sensors-for-small-bridges',                  'rohan-desai',      2),
  ('gut-microbiome-sampling-methods-comparative-considerations',                    'fatima-zahra',     1),
  ('social-media-use-and-perceived-belonging-in-first-year-university-studen',      'arjun-malhotra',   1),
  ('accessible-design-patterns-for-government-web-portals',                         'daniel-okafor',    1),
  ('accessible-design-patterns-for-government-web-portals',                         'arjun-malhotra',   2),
  ('community-biogas-models-in-peri-urban-settlements',                             'amara-diallo',     1),
  ('community-biogas-models-in-peri-urban-settlements',                             'thomas-grey',      2),
  ('few-shot-image-classification-for-crop-disease-screening',                      'priya-nair',       1),
  ('few-shot-image-classification-for-crop-disease-screening',                      'amara-diallo',     2),
  ('mangrove-restoration-monitoring-using-citizen-science',                         'meera-iyer',       1),
  ('mangrove-restoration-monitoring-using-citizen-science',                         'fatima-zahra',     2),
  ('oral-histories-and-digital-archives-ethical-frameworks',                        'yuki-tanaka',      1),
  ('oral-histories-and-digital-archives-ethical-frameworks',                        'ananya-bose',      2),
  ('graph-theoretic-models-of-campus-mobility',                                     'elena-petrova',    1),
  ('graph-theoretic-models-of-campus-mobility',                                     'jonas-berg',       2),
  ('green-solvent-selection-for-small-scale-extraction',                            'neha-kulkarni',    1),
  ('probability-puzzles-as-a-gateway-to-mathematical-reasoning',                    'ananya-bose',      1)
) as v(paper_slug, author_slug, pos)
join public.papers  p on p.slug = v.paper_slug
join public.authors a on a.slug = v.author_slug
on conflict do nothing;

-- ---------- news (8) ----------
insert into public.news (code, slug, title, summary, category, published_on, body, related_paper_slug, byline, art_style, art_theme, art_seed, is_demo) values
  ('NEWS-DEMO-1','why-reproducibility-checklists-are-changing-how-labs-document-their-work','Why Reproducibility Checklists Are Changing How Labs Document Their Work','A look at how simple checklists help research groups record methods clearly enough for others to repeat them.','Science Culture','2026-10-10',array['Many research groups now keep short checklists beside their lab notebooks. The aim is modest: record enough detail that a colleague could repeat the work without guessing.','Editors and funders have encouraged the habit, and students often adopt it fastest. Early-career researchers say a checklist turns reproducibility from an abstract ideal into a routine step.']::text[],'numerical-stability-in-coupled-oscillator-models','ShodhSutra Editorial Desk (sample)',2,2,100,true),
  ('NEWS-DEMO-2','small-models-big-questions-the-efficiency-debate-in-machine-learning','Small Models, Big Questions: The Efficiency Debate in Machine Learning','Researchers are asking how much capability can be kept while cutting the compute that models need.','Technology','2026-10-06',array['Efficiency has become a central theme in machine learning discussions. Smaller models are cheaper to run, easier to inspect and friendlier to devices without large servers.','The open question is how to measure what is lost. Evaluation design, rather than raw size, is increasingly where the debate happens.']::text[],'adaptive-attention-budgets-in-small-language-models-a-simulation-study','ShodhSutra Editorial Desk (sample)',5,0,101,true),
  ('NEWS-DEMO-3','cities-experiment-with-heat-maps-to-plan-shade-and-green-cover','Cities Experiment with Heat Maps to Plan Shade and Green Cover','Neighbourhood-level temperature maps are helping planners think about where trees and shelters matter most.','Environment','2026-09-28',array['Planners are exploring how fine-grained temperature maps can guide decisions about shade, tree planting and public seating.','Researchers caution that maps are only as good as the sampling behind them, which is why low-cost measurement frameworks attract interest.']::text[],'urban-heat-island-patterns-in-mid-sized-coastal-cities-a-sampling-framew','ShodhSutra Editorial Desk (sample)',0,1,102,true),
  ('NEWS-DEMO-4','training-community-health-workers-what-evaluation-studies-look-for','Training Community Health Workers: What Evaluation Studies Look For','An explainer on the features that programme evaluators most often examine in health worker training.','Healthcare','2026-09-20',array['Evaluators tend to look at curriculum, supervision, assessment and how well training matches daily tasks.','Review articles help by comparing programmes side by side, making patterns easier to see.']::text[],'community-health-worker-training-models-a-comparative-review','ShodhSutra Editorial Desk (sample)',3,3,103,true),
  ('NEWS-DEMO-5','open-notebooks-how-students-are-sharing-their-research-process','Open Notebooks: How Students Are Sharing Their Research Process','More student researchers are publishing notes, drafts and failed attempts alongside final papers.','Education','2026-09-14',array['Open notebooks let readers see how a project evolved, not only where it ended. Students say the practice builds confidence and invites feedback earlier.','Supervisors note the trade-offs, including privacy, time and the need to separate exploratory notes from finished claims.']::text[],'project-based-learning-and-conceptual-retention-in-secondary-science','ShodhSutra Editorial Desk (sample)',6,5,104,true),
  ('NEWS-DEMO-6','reading-a-preprint-a-short-guide-for-first-time-researchers','Reading a Preprint: A Short Guide for First-Time Researchers','Practical questions to ask when you meet a paper that has not yet been through formal review.','Science Culture','2026-09-02',array['Start with the question and the data: what was asked, and what evidence is offered? Then check whether the methods are described well enough to repeat.','Remember that unreviewed work is a conversation, not a verdict. Look for responses, revisions and independent replication.']::text[],'evaluating-trust-calibration-in-multi-agent-language-model-pipelines','ShodhSutra Editorial Desk (sample)',1,4,105,true),
  ('NEWS-DEMO-7','data-transparency-in-public-services-policy-questions-to-watch','Data Transparency in Public Services: Policy Questions to Watch','Governments are debating how much people should be told about automated tools used in public services.','Policy','2026-08-25',array['Policy discussions focus on notice, explanation and the right to contest outcomes.','Analysts point out that transparency can take many forms, from plain-language notices to technical documentation, each with different costs.']::text[],'algorithmic-transparency-in-public-service-delivery-policy-perspectives','ShodhSutra Editorial Desk (sample)',4,0,106,true),
  ('NEWS-DEMO-8','battery-storage-on-campuses-a-practical-look-at-microgrids','Battery Storage on Campuses: A Practical Look at Microgrids','Universities are testing how solar panels and batteries can work together to smooth electricity demand.','Energy','2026-08-12',array['Campuses are convenient test beds: they have predictable loads, rooftop space and research expertise close at hand.','Modelling studies help decide how large a battery should be before any equipment is purchased.']::text[],'hybrid-rooftop-solar-and-battery-dispatch-for-campus-microgrids','ShodhSutra Editorial Desk (sample)',7,2,107,true)
on conflict (slug) do nothing;

-- ---------- journal_volumes seed (4 quarterly issues for 2026-2027) ----------
insert into public.journal_volumes (name, year_label, period_label, volume_no, issue_no, art_style, art_theme, art_seed, description)
values
  ('Volume 1 - Issue 1','2026-2027','July - September 2026',  1,1,0,0,101,'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 2','2026-2027','October - December 2026',1,2,2,1,102,'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 3','2026-2027','January - March 2027',   1,3,4,2,103,'Quarterly research issue covering Science, Technology and Humanities.'),
  ('Volume 1 - Issue 4','2026-2027','April - June 2027',      1,4,6,3,104,'Quarterly research issue covering Science, Technology and Humanities.')
on conflict do nothing;

commit;

-- ============================================================================
-- End of ShodhSutra full migration
-- ============================================================================
-- Sanity check (run in SQL editor after migration):
-- select
--   (select count(*) from public.categories)     as categories,
--   (select count(*) from public.authors)        as authors,
--   (select count(*) from public.papers)         as papers,
--   (select count(*) from public.paper_authors)  as paper_author_links,
--   (select count(*) from public.news)           as news,
--   (select count(*) from public.journal_volumes)as journal_volumes;
-- Expected on fresh DB with seed:  15 | 19 | 27 | 35 | 8 | 4
-- ============================================================================
