import { cache } from 'react';
import { supabasePublic, isConfigured } from './supabase';

export const BRAND = 'ShodhSutra';
const iso = (d) => String(d).slice(0, 10);
const EMPTY = { brand: BRAND, categories: [], authors: [], papers: [], news: [], newsCategories: [], error: null };

export function normalize(c, a, p, pa, n) {
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
    doi: r.doi || null, paperUrl: r.paper_url || null, peerReviewed: !!r.peer_reviewed, demo: !!r.is_demo, cover: r.cover_url || null,
    style: r.art_style ?? 0, theme: r.art_theme ?? 0, n: r.art_seed ?? 1, fullText: r.full_text || '', refs: r.refs || [],
  }));
  const news = n.map((r) => ({
    id: r.id, code: r.code, slug: r.slug, title: r.title, summary: r.summary, cat: r.category, date: iso(r.published_on), body: r.body || [],
    relSlug: r.related_paper_slug || null, byline: r.byline || '', style: r.art_style ?? 0, theme: r.art_theme ?? 0, n: r.art_seed ?? 100,
    cover: r.cover_url || null, demo: !!r.is_demo,
  }));
  const newsCategories = [...new Set(news.map((x) => x.cat))].sort();
  return { brand: BRAND, categories, authors, papers, news, newsCategories, error: null };
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
    return normalize(c.data, a.data, p.data, pa.data, n.data);
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
  };
}
