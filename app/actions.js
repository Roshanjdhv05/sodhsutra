'use server';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase';

const clean = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

function validUrl(v) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

export async function submitManuscript(input) {
  if (clean(input?.website)) return { ok: true, ref: 'SUB-RECEIVED' };   // honeypot: bots fill this hidden field
  if (!isAdminConfigured()) return { ok: false, error: 'The database is not connected yet. Please try again later.' };

  const title = clean(input.title, 200), abstract = clean(input.abstract, 4000);
  const name = clean(input.authorName, 120), email = clean(input.authorEmail, 200), inst = clean(input.institution, 200);
  const category = clean(input.category, 80), link = clean(input.paperUrl, 800);
  const keywords = (Array.isArray(input.keywords) ? input.keywords : []).map((k) => clean(k, 60)).filter(Boolean).slice(0, 8);
  const words = abstract ? abstract.split(/\s+/).length : 0;

  if (title.length < 10) return { ok: false, error: 'Enter a title of at least 10 characters.' };
  if (words < 50 || words > 300) return { ok: false, error: 'The abstract must be between 50 and 300 words.' };
  if (name.length < 2 || !isEmail(email)) return { ok: false, error: 'Enter the corresponding author’s name and a valid email.' };
  if (!inst || !category) return { ok: false, error: 'Institution and category are required.' };
  if (keywords.length < 3) return { ok: false, error: 'Enter 3 to 8 keywords.' };
  if (!validUrl(link)) return { ok: false, error: 'Paste a valid paper link starting with http:// or https://.' };
  if (!input.declaration || !input.consent) return { ok: false, error: 'Please accept the declaration and the policies.' };

  const co = (Array.isArray(input.coauthors) ? input.coauthors : []).slice(0, 8)
    .map((c) => ({ name: clean(c?.name, 120), email: clean(c?.email, 200) })).filter((c) => c.name);
  const cover = clean(input.coverUrl, 600);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('submissions').insert({
    title, abstract, author_name: name, author_email: email, coauthors: co, institution: inst, category_slug: category,
    keywords, paper_url: link, cover_url: cover || null, declaration: true, consent: true, status: 'received',
  }).select('id').single();
  if (error) return { ok: false, error: 'Could not save your submission: ' + error.message };
  return { ok: true, ref: 'SUB-' + String(data.id).slice(0, 8).toUpperCase() };
}

export async function sendMessage(input) {
  if (clean(input?.website)) return { ok: true };
  if (!isAdminConfigured()) return { ok: false, error: 'The database is not connected yet. Please try again later.' };
  const name = clean(input.name, 120), email = clean(input.email, 200), message = clean(input.message, 4000);
  if (!name) return { ok: false, error: 'Enter your name.' };
  if (!isEmail(email)) return { ok: false, error: 'Enter a valid email.' };
  if (message.length < 10) return { ok: false, error: 'Write at least 10 characters.' };
  const { error } = await supabaseAdmin().from('messages').insert({ name, email, message });
  if (error) return { ok: false, error: 'Could not send your message: ' + error.message };
  return { ok: true };
}
