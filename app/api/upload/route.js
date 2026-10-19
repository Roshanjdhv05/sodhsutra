import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 12 * 1024;           // covers are compressed to <= 10 KB in the browser; allow a little slack
const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export async function POST(req) {
  if (!isAdminConfigured()) return NextResponse.json({ error: 'Storage is not configured yet (missing Supabase keys).' }, { status: 503 });
  let file;
  try { file = (await req.formData()).get('file'); } catch { return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 }); }
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Only WebP, JPEG or PNG covers are accepted.' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Cover is larger than 12 KB. Please let the page compress it first.' }, { status: 413 });

  const admin = await isAdmin();
  const path = `${admin ? 'covers' : 'submissions'}/${crypto.randomUUID()}.${ext}`;
  const sb = supabaseAdmin();
  const { error } = await sb.storage.from('covers').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = sb.storage.from('covers').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
