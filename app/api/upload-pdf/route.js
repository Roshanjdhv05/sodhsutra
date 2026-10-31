import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase';
import { extractPaperFromPdfBuffer } from '@/lib/pdf-extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req) {
  if (!isAdminConfigured())
    return NextResponse.json({ error: 'Storage is not configured yet (missing Supabase keys).' }, { status: 503 });

  let file;
  try {
    const fd = await req.formData();
    file = fd.get('file');
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  if (!file || typeof file === 'string')
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });

  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Only PDF files are accepted.' }, { status: 415 });

  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: `File is too large (${(file.size / 1048576).toFixed(1)} MB). Maximum allowed is 20 MB.` },
      { status: 413 },
    );

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!buffer.slice(0, 5).equals(Buffer.from('%PDF-'))) {
    return NextResponse.json({ error: 'The file does not appear to be a valid PDF.' }, { status: 422 });
  }

  // 1. Extract and organize research paper content (sections, tables, title, authors, abstract, references)
  let extracted = null;
  try {
    extracted = await extractPaperFromPdfBuffer(buffer, file.name);
  } catch (err) {
    console.error('PDF extraction failed (non-fatal):', err);
    extracted = {
      isScanned: false,
      ocrRequired: false,
      title: file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim(),
      abstract: '',
      keywords: [],
      authors: [],
      sections: [],
      tablesCount: 0,
      refs: [],
      full_text: '',
      message: 'Automatic extraction could not process all sections of this PDF. You can enter or review them manually.',
    };
  }

  // 2. Upload the original PDF to Supabase storage bucket 'papers'
  const filename = `${crypto.randomUUID()}.pdf`;
  const path = `submissions/${filename}`;
  const sb = supabaseAdmin();

  const { error } = await sb.storage
    .from('papers')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = sb.storage.from('papers').getPublicUrl(path);

  return NextResponse.json({
    url: data.publicUrl,
    path,
    bytes: buffer.length,
    extracted,
    // Backward compatibility for components expecting .detected
    detected: {
      title: extracted?.title || '',
      context: extracted?.abstract || '',
    },
  });
}
