-- Migration: Add citation_style and page number columns to public.papers table
-- Run this in your Supabase SQL Editor if you want to store author-chosen citation styles and page ranges permanently.
-- If not run, the application will automatically fall back without errors.

ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS citation_style text DEFAULT 'apa',
ADD COLUMN IF NOT EXISTS page_start integer,
ADD COLUMN IF NOT EXISTS page_end integer;

COMMENT ON COLUMN public.papers.citation_style IS 'Default academic citation style selected for this paper (apa, ieee, mla, harvard, chicago, vancouver)';
COMMENT ON COLUMN public.papers.page_start IS 'First page number of the paper in publication/issue';
COMMENT ON COLUMN public.papers.page_end IS 'Last page number of the paper in publication/issue';
