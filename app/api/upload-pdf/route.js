import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 20 * 1024 * 1024;

function extractTitleAndContext(text, infoTitle) {
  let title = '';
  let context = '';

  const cleanText = (text || '').replace(/-- \d+ of \d+ --/g, '').trim();
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Detect title
  if (
    infoTitle &&
    infoTitle.trim() &&
    !infoTitle.toLowerCase().includes('untitled') &&
    !infoTitle.toLowerCase().startsWith('microsoft word')
  ) {
    title = infoTitle.trim();
  } else if (lines.length > 0) {
    const firstLines = [];
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      if (/^(abstract|keywords|by|author|introduction|issn|isbn|vol\.)\b/i.test(lines[i])) break;
      firstLines.push(lines[i]);
    }
    title = firstLines.join(' ').slice(0, 250);
  }

  // 2. Detect context / abstract
  const abstractMatch = cleanText.match(
    /(?:abstract|summary|context)\s*[:\-\n]\s*([\s\S]{30,1600}?)(?=\n\s*(?:keywords|key words|introduction|1[\.\s]|i[\.\s]|\n\n\n)|$)/i
  );
  if (abstractMatch && abstractMatch[1]) {
    context = abstractMatch[1].trim();
  } else {
    const afterTitle = title ? cleanText.replace(title, '').trim() : cleanText;
    const paras = afterTitle.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    context = (paras[0] || afterTitle).slice(0, 800).trim();
  }

  return { title, context };
}

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

  // Non-fatal title & context detection
  let detected = { title: '', context: '' };
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const textObj = await parser.getText();
    const infoObj = await parser.getInfo();
    detected = extractTitleAndContext(textObj?.text || '', infoObj?.info?.Title || '');
    await parser.destroy();
  } catch (err) {
    console.error('PDF text extraction notice:', err?.message || err);
  }

  // Fallback to pdf-lib if title not yet detected
  if (!detected.title) {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const t = doc.getTitle();
      if (t && t.trim()) detected.title = t.trim();
    } catch {}
  }

  // Fallback to cleaned filename if still no title
  if (!detected.title && file.name) {
    detected.title = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
  }

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
    detected,
  });
}
