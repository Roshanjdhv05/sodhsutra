import { cache } from 'react';
import { supabasePublic, isConfigured } from './supabase';

export const BRAND = 'ShodhSutra';

export const MANUSCRIPT_CATEGORIES = [
  'Original Research Articles',
  'Review Articles (Literature Reviews)',
  'Systematic Reviews & Meta-Analyses',
  'Short Communications / Brief Reports',
  'Case Studies / Case Reports',
  'Methodological Papers / Methods Articles',
  'Theoretical / Conceptual Papers',
  'Perspectives, Opinions, & Commentaries',
  'Editorials',
  'Letters to the Editor',
  'Data Papers / Data Sets',
  'Book Reviews',
];
const iso = (d) => String(d).slice(0, 10);
const EMPTY = { brand: BRAND, categories: [], authors: [], papers: [], news: [], newsCategories: [], error: null };

export const DEFAULT_VOLUMES = [
  {
    id: 1,
    name: 'Volume 1 - Issue 1',
    year: '2026- 2027',
    period: 'June – August 2026',
    volNo: 1,
    issueNo: 1,
    cover: '/cover.png',
    style: 0,
    theme: 0,
    n: 101,
    desc: 'Inaugural research issue covering Science, Technology, and Interdisciplinary Humanities.',
    paperIds: [],
  },
  {
    id: 2,
    name: 'Volume 1 - Issue 2',
    year: '2026- 2027',
    period: 'October - December 2026',
    volNo: 1,
    issueNo: 2,
    cover: '/cover.png',
    style: 1,
    theme: 1,
    n: 102,
    desc: 'Second quarterly issue highlighting empirical investigations and technological advancements.',
    paperIds: [],
  },
  {
    id: 3,
    name: 'Volume 1 - Issue 3',
    year: '2026- 2027',
    period: 'January - March 2027',
    volNo: 1,
    issueNo: 3,
    cover: '/cover.png',
    style: 3,
    theme: 2,
    n: 103,
    desc: 'Third quarterly issue focusing on emerging trends, pedagogical frameworks, and theoretical analyses.',
    paperIds: [],
  },
  {
    id: 4,
    name: 'Volume 1 - Issue 4',
    year: '2026- 2027',
    period: 'April - June 2027',
    volNo: 1,
    issueNo: 4,
    cover: '/cover.png',
    style: 5,
    theme: 3,
    n: 104,
    desc: 'Concluding quarterly publication of the 2026-2027 cycle with comprehensive reviews and student-faculty studies.',
    paperIds: [],
  },
];

export function normalize(c, a, p, pa, n, volData = [], volPapers = []) {
  const categories = c.map((r) => ({ slug: r.slug, name: r.name, short: r.short_name, icon: r.icon || 'book', desc: r.description || '' }));
  const authors = a.map((r) => ({
    id: r.id, slug: r.slug, name: r.name, type: r.type, designation: r.designation || '', inst: r.institution || 'Independent',
    dept: r.department || '', interests: r.interests || [], bio: r.bio || '', photo: r.photo_url || null, seq: Number(r.seq || 0),
  }));
  const idToSlug = Object.fromEntries(authors.map((x) => [x.id, x.slug]));
  const byPaper = {};
  [...pa].sort((x, y) => x.position - y.position).forEach((x) => { (byPaper[x.paper_id] ||= []).push(idToSlug[x.author_id]); });
  const papers = p.map((r) => ({
    id: r.id, code: r.code, slug: r.slug, title: r.title, abstract: r.abstract, cat: r.category_slug, cat2: r.category2_slug || null,
    authors: (byPaper[r.id] || []).filter(Boolean), inst: r.institution || '', date: iso(r.published_on), year: +iso(r.published_on).slice(0, 4),
    keywords: r.keywords || [], views: r.views || 0, type: r.content_type, format: r.format, featured: !!r.featured,
    doi: r.doi || null, paperUrl: r.paper_url || null, peerReviewed: !!r.peer_reviewed, demo: !!r.is_demo, cover: r.cover_url || '/cover.png',
    style: r.art_style ?? 0, theme: r.art_theme ?? 0, n: r.art_seed ?? 1, fullText: r.full_text || '', refs: r.refs || [],
  }));
  const news = n.map((r) => ({
    id: r.id, code: r.code, slug: r.slug, title: r.title, summary: r.summary, cat: r.category, date: iso(r.published_on), body: r.body || [],
    relSlug: r.related_paper_slug || null, byline: r.byline || '', style: r.art_style ?? 0, theme: r.art_theme ?? 0, n: r.art_seed ?? 100,
    cover: r.cover_url || null, demo: !!r.is_demo,
  }));
  const newsCategories = [...new Set(news.map((x) => x.cat))].sort();

  // Process volumes
  const papersByVol = {};
  [...volPapers].sort((x, y) => (x.position || 0) - (y.position || 0)).forEach((x) => {
    (papersByVol[x.volume_id] ||= []).push(x.paper_id);
  });

  let volumes = (volData || []).map((v) => ({
    id: v.id,
    name: v.name,
    year: v.year_label,
    period: v.period_label || '',
    volNo: v.volume_no || 1,
    issueNo: v.issue_no || 1,
    cover: v.cover_url || '/cover.png',
    style: v.art_style ?? 0,
    theme: v.art_theme ?? 0,
    n: v.art_seed ?? 1,
    desc: v.description || '',
    paperIds: papersByVol[v.id] || [],
  }));

  // Fallback to default 2026- 2027 volumes if table is empty
  if (!volumes.length) {
    // Distribute available papers across default issues for immediate interactive delight
    const paperIds = papers.map((x) => x.id);
    volumes = DEFAULT_VOLUMES.map((def, idx) => {
      const chunk = Math.ceil(paperIds.length / DEFAULT_VOLUMES.length) || 1;
      const assigned = paperIds.slice(idx * chunk, (idx + 1) * chunk);
      return {
        ...def,
        paperIds: assigned.length ? assigned : (paperIds[idx % paperIds.length] ? [paperIds[idx % paperIds.length]] : []),
      };
    });
  }

  return { brand: BRAND, categories, authors, papers, news, newsCategories, volumes, error: null };
}

/** Loads everything the public site needs. Never throws: returns { error } so pages can show a setup notice. */
export const getAll = cache(async () => {
  if (!isConfigured()) return { ...EMPTY, error: 'NOT_CONFIGURED' };
  try {
    const sb = supabasePublic();
    const [c, a, p, pa, n] = await Promise.all([
      sb.from('categories').select('*').order('sort_order').order('name'),
      sb.from('authors').select('*').order('seq'),
      sb.from('papers').select('*'),
      sb.from('paper_authors').select('*'),
      sb.from('news').select('*'),
    ]);
    for (const r of [c, a, p, pa, n]) if (r.error) return { ...EMPTY, error: 'DB:' + r.error.message };

    // Try loading volumes if available
    let volData = [];
    let volPapers = [];
    try {
      const [vRes, vpRes] = await Promise.all([
        sb.from('journal_volumes').select('*').order('volume_no').order('issue_no'),
        sb.from('volume_papers').select('*'),
      ]);
      if (!vRes.error && vRes.data) volData = vRes.data;
      if (!vpRes.error && vpRes.data) volPapers = vpRes.data;
    } catch {
      // Table may not exist yet in Supabase
    }

    return normalize(c.data, a.data, p.data, pa.data, n.data, volData, volPapers);
  } catch (e) {
    return { ...EMPTY, error: 'DB:' + (e?.message || 'unknown error') };
  }
});

/** Smaller copy of the dataset for client components (search overlay, filters). */
export function slim(D) {
  return {
    brand: D.brand,
    categories: D.categories,
    authors: D.authors.map(({ bio, ...a }) => a),
    papers: D.papers.map(({ fullText, refs, ...p }) => p),
    news: D.news.map(({ body, ...n }) => n),
    newsCategories: D.newsCategories,
    volumes: D.volumes || [],
  };
}
