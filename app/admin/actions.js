'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase';
import { isAdmin, checkPassword, startAdminSession, endAdminSession, adminPasswordSet } from '@/lib/admin-auth';
import { slugify } from '@/lib/helpers';

/* ---------- helpers ---------- */
const s = (v, max = 4000) => String(v ?? '').trim().slice(0, max);
const nul = (v, max) => { const x = s(v, max); return x ? x : null; };
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split(',')).map((x) => s(x, 200)).filter(Boolean);
const okUrl = (v) => { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const fail = (error) => ({ ok: false, error });
const done = (extra = {}) => { revalidatePath('/', 'layout'); return { ok: true, ...extra }; };

async function guard() {
  if (!isAdminConfigured()) return fail('Supabase keys are missing in .env (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).');
  if (!(await isAdmin())) return fail('Your admin session has expired. Please log in again.');
  return null;
}
const nice = (e) => {
  const m = e?.message || String(e);
  if (/duplicate key/i.test(m)) return 'That slug (or unique value) is already used. Pick a different one.';
  if (/violates foreign key/i.test(m)) return 'This item is still referenced elsewhere (for example a category that still has papers). Move or delete those first.';
  return m;
};

function coverPath(url) {
  const m = String(url || '').match(/\/storage\/v1\/object\/public\/covers\/(.+?)(?:\?.*)?$/);
  return m ? decodeURIComponent(m[1]) : null;
}
async function removeCover(sb, url) {
  const p = coverPath(url);
  if (p) { try { await sb.storage.from('covers').remove([p]); } catch { /* best effort */ } }
}
async function uniqueSlug(sb, table, base) {
  const root = slugify(base) || 'item';
  const { data } = await sb.from(table).select('slug').like('slug', `${root}%`);
  const taken = new Set((data || []).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 500; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now().toString(36)}`;
}

/* ---------- session ---------- */
export async function adminLogin(password) {
  if (!adminPasswordSet()) return fail('ADMIN_PASSWORD is not set in .env.');
  if (!checkPassword(String(password || ''))) { await new Promise((r) => setTimeout(r, 600)); return fail('Incorrect password.'); }
  await startAdminSession();
  return { ok: true };
}
export async function adminLogout() { await endAdminSession(); revalidatePath('/admin'); return { ok: true }; }

/* ---------- categories ---------- */
export async function saveCategory(c) {
  const g = await guard(); if (g) return g;
  const name = s(c.name, 120), short = s(c.short_name, 60) || name;
  if (name.length < 2) return fail('Category name is required.');
  const sb = supabaseAdmin();
  const row = { name, short_name: short, icon: s(c.icon, 30) || 'book', description: s(c.description, 600), sort_order: int(c.sort_order) };
  try {
    if (c.id) {
      const slug = slugify(c.slug || '') || undefined;
      const { error } = await sb.from('categories').update({ ...row, ...(slug ? { slug } : {}) }).eq('id', c.id);
      if (error) return fail(nice(error));
    } else {
      const slug = slugify(c.slug || name);
      const { error } = await sb.from('categories').insert({ ...row, slug });
      if (error) return fail(nice(error));
    }
  } catch (e) { return fail(nice(e)); }
  return done();
}
export async function deleteCategory(id) {
  const g = await guard(); if (g) return g;
  const { error } = await supabaseAdmin().from('categories').delete().eq('id', id);
  return error ? fail(nice(error)) : done();
}

/* ---------- authors ---------- */
export async function saveAuthor(a) {
  const g = await guard(); if (g) return g;
  const name = s(a.name, 120);
  if (name.length < 2) return fail('Author name is required.');
  if (!['student', 'faculty', 'researcher'].includes(a.type)) return fail('Choose an author type.');
  if (a.photo_url && !okUrl(a.photo_url)) return fail('Photo URL must start with http:// or https://');
  const row = { name, type: a.type, designation: s(a.designation, 160), institution: s(a.institution, 200), department: s(a.department, 160), interests: list(a.interests), bio: s(a.bio, 1500), photo_url: nul(a.photo_url, 600) };
  const sb = supabaseAdmin();
  if (a.id) {
    const slug = slugify(a.slug || '') || undefined;
    const { error } = await sb.from('authors').update({ ...row, ...(slug ? { slug } : {}) }).eq('id', a.id);
    return error ? fail(nice(error)) : done();
  }
  const slug = await uniqueSlug(sb, 'authors', a.slug || name);
  const { error } = await sb.from('authors').insert({ ...row, slug });
  return error ? fail(nice(error)) : done();
}
export async function deleteAuthor(id) {
  const g = await guard(); if (g) return g;
  const { error } = await supabaseAdmin().from('authors').delete().eq('id', id);
  return error ? fail(nice(error)) : done();
}

/* ---------- papers ---------- */
export async function savePaper(p) {
  const g = await guard(); if (g) return g;
  const title = s(p.title, 300);
  if (title.length < 5) return fail('Title must be at least 5 characters.');
  if (s(p.abstract).length < 20) return fail('Please write an abstract (at least 20 characters).');
  if (!isDate(s(p.published_on, 10))) return fail('Choose a valid publication date.');
  if (p.paper_url && !okUrl(p.paper_url)) return fail('Paper link must start with http:// or https://');

  const sb = supabaseAdmin();

  // If user selected to add a new category or provided a new category name
  let category_slug = p.category_slug;
  if (p.category_slug === '__new__' || (p.new_category_name && p.new_category_name.trim())) {
    const catName = s(p.new_category_name, 120);
    if (!catName || catName.length < 2) return fail('Please enter a name for the new category.');
    const { data: existingCat } = await sb.from('categories').select('slug').ilike('name', catName).limit(1).maybeSingle();
    if (existingCat) {
      category_slug = existingCat.slug;
    } else {
      const newSlug = await uniqueSlug(sb, 'categories', catName);
      const { data: createdCat, error: catErr } = await sb.from('categories').insert({
        name: catName,
        short_name: catName,
        slug: newSlug,
        icon: 'book',
        description: `Research category for ${catName}`,
        sort_order: 99,
      }).select('slug').single();
      if (catErr) return fail(nice(catErr));
      category_slug = createdCat.slug;
    }
  }

  if (!category_slug || category_slug === '__new__') return fail('Choose or create a category.');

  // Handle authors: if passed as structured array or comma-separated text
  let authorIds = [];
  if (Array.isArray(p.authors_data) && p.authors_data.length) {
    for (const a of p.authors_data) {
      const name = s(a.name, 120);
      if (!name) continue;
      const inst = s(a.institution, 200) || s(p.institution, 200) || 'Independent';
      const desig = s(a.designation, 120) || '';
      const { data: found } = await sb.from('authors').select('id, institution, designation').ilike('name', name).limit(1).maybeSingle();
      if (found) {
        if (!authorIds.includes(found.id)) authorIds.push(found.id);
        if ((inst && (!found.institution || found.institution === 'Independent')) || (desig && !found.designation)) {
          await sb.from('authors').update({
            ...(inst ? { institution: inst } : {}),
            ...(desig ? { designation: desig } : {}),
          }).eq('id', found.id);
        }
      } else {
        const slug = await uniqueSlug(sb, 'authors', name);
        const { data: created, error: authErr } = await sb.from('authors').insert({
          slug, name, type: 'researcher', designation: desig, institution: inst, department: '', interests: [], bio: '',
        }).select('id').single();
        if (authErr) return fail(nice(authErr));
        authorIds.push(created.id);
      }
    }
  } else if (p.authors_text && p.authors_text.trim()) {
    const names = p.authors_text.split(/[,;\n]+/).map((x) => s(x, 120)).filter(Boolean);
    for (const name of names) {
      const { data: found } = await sb.from('authors').select('id').ilike('name', name).limit(1).maybeSingle();
      if (found) {
        if (!authorIds.includes(found.id)) authorIds.push(found.id);
      } else {
        const slug = await uniqueSlug(sb, 'authors', name);
        const { data: created, error: authErr } = await sb.from('authors').insert({
          slug, name, type: 'researcher', designation: '', institution: s(p.institution, 200) || 'Independent', department: '', interests: [], bio: '',
        }).select('id').single();
        if (authErr) return fail(nice(authErr));
        authorIds.push(created.id);
      }
    }
  } else if (Array.isArray(p.authorIds) && p.authorIds.length) {
    authorIds = [...new Set(p.authorIds)];
  }

  if (!authorIds.length) return fail('Please enter at least one author name.');

  let institution = s(p.authors_data?.[0]?.institution, 200) || s(p.institution, 200);
  if (!institution) { const { data } = await sb.from('authors').select('institution').eq('id', authorIds[0]).maybeSingle(); institution = data?.institution || 'Independent'; }

  const row = {
    title, abstract: s(p.abstract), category_slug, category2_slug: nul(p.category2_slug, 80) === category_slug ? null : nul(p.category2_slug, 80),
    institution, published_on: s(p.published_on, 10), keywords: list(p.keywords).slice(0, 12), views: Math.max(0, int(p.views)),
    content_type: s(p.content_type, 120) || 'Original Research Articles', format: ['emp', 'rev', 'ess', 'cas'].includes(p.format) ? p.format : 'emp',
    featured: !!p.featured, doi: nul(p.doi, 120), paper_url: nul(p.paper_url, 800), peer_reviewed: !!p.peer_reviewed, is_demo: !!p.is_demo,
    cover_url: nul(p.cover_url, 600), art_style: ((int(p.art_style) % 8) + 8) % 8, art_theme: ((int(p.art_theme) % 6) + 6) % 6, art_seed: Math.max(1, int(p.art_seed, 1)),
    full_text: s(p.full_text, 60000), refs: s(p.refs_text, 12000).split('\n').map((x) => x.trim()).filter(Boolean),
  };

  let id = p.id;
  if (id) {
    const { data: old } = await sb.from('papers').select('cover_url').eq('id', id).maybeSingle();
    const slug = slugify(p.slug || '') || undefined;
    if (row.featured) await sb.from('papers').update({ featured: false }).neq('id', id);
    const { error } = await sb.from('papers').update({ ...row, ...(slug ? { slug } : {}) }).eq('id', id);
    if (error) return fail(nice(error));
    if (old?.cover_url && old.cover_url !== row.cover_url) await removeCover(sb, old.cover_url);
  } else {
    const slug = await uniqueSlug(sb, 'papers', p.slug || title);
    if (row.featured) await sb.from('papers').update({ featured: false }).eq('featured', true);
    const { data, error } = await sb.from('papers').insert({ ...row, slug, code: 'SS-' + Date.now().toString(36).toUpperCase() }).select('id').single();
    if (error) return fail(nice(error));
    id = data.id;
  }
  const del = await sb.from('paper_authors').delete().eq('paper_id', id);
  if (del.error) return fail(nice(del.error));
  const ins = await sb.from('paper_authors').insert(authorIds.map((author_id, i) => ({ paper_id: id, author_id, position: i + 1 })));
  if (ins.error) return fail(nice(ins.error));
  return done({ id });
}
export async function deletePaper(id) {
  const g = await guard(); if (g) return g;
  const sb = supabaseAdmin();
  const { data } = await sb.from('papers').select('cover_url').eq('id', id).maybeSingle();
  const { error } = await sb.from('papers').delete().eq('id', id);
  if (error) return fail(nice(error));
  if (data?.cover_url) await removeCover(sb, data.cover_url);
  return done();
}

/* ---------- news ---------- */
export async function saveNews(n) {
  const g = await guard(); if (g) return g;
  const title = s(n.title, 300);
  if (title.length < 5) return fail('Headline must be at least 5 characters.');
  if (!s(n.summary)) return fail('Please write a short summary.');
  if (!s(n.category, 80)) return fail('Enter a news category.');
  if (!isDate(s(n.published_on, 10))) return fail('Choose a valid date.');
  const row = {
    title, summary: s(n.summary, 600), category: s(n.category, 80), published_on: s(n.published_on, 10),
    body: s(n.body_text, 20000).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), related_paper_slug: nul(n.related_paper_slug, 120),
    byline: s(n.byline, 160), art_style: ((int(n.art_style) % 8) + 8) % 8, art_theme: ((int(n.art_theme) % 6) + 6) % 6, art_seed: Math.max(1, int(n.art_seed, 100)),
    cover_url: nul(n.cover_url, 600), is_demo: !!n.is_demo,
  };
  const sb = supabaseAdmin();
  if (n.id) {
    const { data: old } = await sb.from('news').select('cover_url').eq('id', n.id).maybeSingle();
    const slug = slugify(n.slug || '') || undefined;
    const { error } = await sb.from('news').update({ ...row, ...(slug ? { slug } : {}) }).eq('id', n.id);
    if (error) return fail(nice(error));
    if (old?.cover_url && old.cover_url !== row.cover_url) await removeCover(sb, old.cover_url);
    return done();
  }
  const slug = await uniqueSlug(sb, 'news', n.slug || title);
  const { error } = await sb.from('news').insert({ ...row, slug, code: 'NEWS-' + Date.now().toString(36).toUpperCase() });
  return error ? fail(nice(error)) : done();
}
export async function deleteNews(id) {
  const g = await guard(); if (g) return g;
  const sb = supabaseAdmin();
  const { data } = await sb.from('news').select('cover_url').eq('id', id).maybeSingle();
  const { error } = await sb.from('news').delete().eq('id', id);
  if (error) return fail(nice(error));
  if (data?.cover_url) await removeCover(sb, data.cover_url);
  return done();
}

/* ---------- submissions & messages ---------- */
export async function setSubmissionStatus(id, status) {
  const g = await guard(); if (g) return g;
  if (!['received', 'rejected', 'published'].includes(status)) return fail('Unknown status.');
  const { error } = await supabaseAdmin().from('submissions').update({ status }).eq('id', id);
  return error ? fail(nice(error)) : done();
}
export async function deleteSubmission(id) {
  const g = await guard(); if (g) return g;
  const sb = supabaseAdmin();
  const { data } = await sb.from('submissions').select('cover_url,status').eq('id', id).maybeSingle();
  const { error } = await sb.from('submissions').delete().eq('id', id);
  if (error) return fail(nice(error));
  if (data?.cover_url && data.status !== 'published') await removeCover(sb, data.cover_url);
  return done();
}
export async function publishSubmission(id) {
  const g = await guard(); if (g) return g;
  const sb = supabaseAdmin();
  const { data: sub, error } = await sb.from('submissions').select('*').eq('id', id).single();
  if (error || !sub) return fail('Submission not found.');
  if (sub.status === 'published') return fail('This submission is already published.');

  const people = [{ name: sub.author_name }, ...((sub.coauthors || []).map((c) => ({ name: c.name })))].filter((x) => x.name);
  const ids = [];
  for (const person of people) {
    const { data: found } = await sb.from('authors').select('id').ilike('name', person.name).limit(1).maybeSingle();
    if (found) { ids.push(found.id); continue; }
    const slug = await uniqueSlug(sb, 'authors', person.name);
    const { data: created, error: e2 } = await sb.from('authors').insert({
      slug, name: person.name, type: 'researcher', designation: '', institution: sub.institution || '', department: '', interests: [], bio: '',
    }).select('id').single();
    if (e2) return fail(nice(e2));
    ids.push(created.id);
  }
  const { count } = await sb.from('papers').select('id', { count: 'exact', head: true });
  const slug = await uniqueSlug(sb, 'papers', sub.title);
  const { data: paper, error: e3 } = await sb.from('papers').insert({
    code: 'SS-' + Date.now().toString(36).toUpperCase(), slug, title: sub.title, abstract: sub.abstract, category_slug: sub.category_slug,
    institution: sub.institution, published_on: new Date().toISOString().slice(0, 10), keywords: sub.keywords || [], views: 0,
    content_type: sub.content_type || 'Original Research Articles', format: 'emp', featured: false, paper_url: sub.paper_url, peer_reviewed: false, is_demo: false,
    cover_url: sub.cover_url, art_style: ((count || 0) * 5 + 1) % 8, art_theme: ((count || 0) * 7 + 2) % 6, art_seed: (count || 0) + 1, refs: [], full_text: '',
  }).select('id').single();
  if (e3) return fail(nice(e3));
  const link = await sb.from('paper_authors').insert(ids.map((author_id, i) => ({ paper_id: paper.id, author_id, position: i + 1 })));
  if (link.error) return fail(nice(link.error));
  await sb.from('submissions').update({ status: 'published' }).eq('id', id);
  return done({ id: paper.id });
}
export async function deleteMessage(id) {
  const g = await guard(); if (g) return g;
  const { error } = await supabaseAdmin().from('messages').delete().eq('id', id);
  return error ? fail(nice(error)) : done();
}

/* ---------- volumes ---------- */
export async function saveVolume(v) {
  const g = await guard(); if (g) return g;
  const name = s(v.name, 150);
  if (name.length < 2) return fail('Volume name is required (e.g., Volume 1 - Issue 1).');
  const year_label = s(v.year_label, 50);
  if (!year_label) return fail('Academic year is required (e.g., 2026- 2027).');

  const row = {
    name,
    year_label,
    period_label: s(v.period_label, 100),
    volume_no: Math.max(1, int(v.volume_no, 1)),
    issue_no: Math.max(1, int(v.issue_no, 1)),
    description: s(v.description, 1000),
    cover_url: nul(v.cover_url, 600),
    art_style: ((int(v.art_style) % 8) + 8) % 8,
    art_theme: ((int(v.art_theme) % 6) + 6) % 6,
    art_seed: Math.max(1, int(v.art_seed, 1)),
    published: v.published !== false,
  };

  const paperIds = [...new Set(Array.isArray(v.paperIds) ? v.paperIds : [])];
  const sb = supabaseAdmin();

  let id = v.id;
  try {
    if (id) {
      const { data: old } = await sb.from('journal_volumes').select('cover_url').eq('id', id).maybeSingle();
      const { error } = await sb.from('journal_volumes').update(row).eq('id', id);
      if (error) return fail(nice(error));
      if (old?.cover_url && old.cover_url !== row.cover_url) await removeCover(sb, old.cover_url);
    } else {
      const { data, error } = await sb.from('journal_volumes').insert(row).select('id').single();
      if (error) return fail(nice(error));
      id = data.id;
    }

    // Update junction table volume_papers
    await sb.from('volume_papers').delete().eq('volume_id', id);
    if (paperIds.length > 0) {
      const items = paperIds.map((paper_id, i) => ({
        volume_id: id,
        paper_id,
        position: i + 1,
      }));
      const { error: insErr } = await sb.from('volume_papers').insert(items);
      if (insErr) return fail(nice(insErr));
    }
  } catch (err) {
    return fail(nice(err));
  }

  return done({ id });
}

export async function deleteVolume(id) {
  const g = await guard(); if (g) return g;
  const sb = supabaseAdmin();
  const { data } = await sb.from('journal_volumes').select('cover_url').eq('id', id).maybeSingle();
  const { error } = await sb.from('journal_volumes').delete().eq('id', id);
  if (error) return fail(nice(error));
  if (data?.cover_url) await removeCover(sb, data.cover_url);
  return done();
}

