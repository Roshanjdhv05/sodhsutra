import { NextResponse } from 'next/server';
import { supabasePublic, isConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const keyParam = url.searchParams.get('key') || url.searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const isAuthorized =
    !process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    keyParam === process.env.CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    let dbStatus = {
      configured: isConfigured(),
      connected: false,
      details: {},
    };

    // Ping Supabase to keep project active and verify database health
    if (isConfigured()) {
      const sb = supabasePublic();
      const [catRes, papersRes, volsRes] = await Promise.all([
        sb.from('categories').select('*', { count: 'exact', head: true }),
        sb.from('papers').select('*', { count: 'exact', head: true }),
        sb.from('journal_volumes').select('*', { count: 'exact', head: true }),
      ]);

      const err = catRes.error || papersRes.error || volsRes.error;
      if (err) {
        dbStatus.connected = false;
        dbStatus.error = err.message;
      } else {
        dbStatus.connected = true;
        dbStatus.details = {
          categories: catRes.count ?? 0,
          papers: papersRes.count ?? 0,
          volumes: volsRes.count ?? 0,
        };
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Daily database cron job executed successfully',
      timestamp: new Date().toISOString(),
      durationMs,
      database: dbStatus,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
