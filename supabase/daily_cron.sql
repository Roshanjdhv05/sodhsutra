-- ============================================================
-- Supabase Native Daily Cron Job (pg_cron)
-- Run this in the Supabase SQL Editor to schedule a daily
-- database query directly inside PostgreSQL.
-- ============================================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule a daily database keepalive query at 00:00 UTC (05:30 AM IST)
SELECT cron.schedule(
  'daily-database-keepalive',
  '0 0 * * *',
  $$
    SELECT
      (SELECT count(*) FROM public.categories) AS cat_count,
      (SELECT count(*) FROM public.papers) AS paper_count,
      (SELECT count(*) FROM public.journal_volumes) AS vol_count;
  $$
);

-- 3. (Optional) Check existing cron jobs
-- SELECT * FROM cron.job;
