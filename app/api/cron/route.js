import { NextResponse } from 'next/server';
import { supabasePublic, isConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Check authorization if CRON_SECRET is configured
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let dbStatus = 'not_configured';

    // Ping Supabase to keep project active and verify database health
    if (isConfigured()) {
      const sb = supabasePublic();
      const { count, error } = await sb.from('categories').select('*', { count: 'exact', head: true });
      if (error) {
        dbStatus = `error: ${error.message}`;
      } else {
        dbStatus = `ok, categories count: ${count}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily cron job executed successfully',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
