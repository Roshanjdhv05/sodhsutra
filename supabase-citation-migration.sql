-- Migration: Add citation_style column to public.papers table
-- Run this in your Supabase SQL Editor if you want to store author-chosen citation styles permanently.
-- If not run, the application will automatically fall back to 'apa' without errors.

ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS citation_style text DEFAULT 'apa';

COMMENT ON COLUMN public.papers.citation_style IS 'Default academic citation style selected for this paper (apa, ieee, mla, harvard, chicago, vancouver)';
