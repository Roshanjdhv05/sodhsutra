import { supabasePublic, isConfigured } from '@/lib/supabase';
import { SITE_URL as SITE } from '@/lib/site';

/** Static public pages with their change frequencies and priorities */
const STATIC_PAGES = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/published-papers', changeFrequency: 'daily', priority: 0.9 },
  { path: '/authors', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/student-research', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/faculty-research', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/news', changeFrequency: 'daily', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/submit', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/submission-guidelines', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/editorial-policy', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.4 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  // Static pages
  const staticEntries = STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Dynamic paper pages — only published (non-draft) papers
  let paperEntries = [];
  if (isConfigured()) {
    try {
      const sb = supabasePublic();

      // Fetch all papers — the papers table only contains published records
      // (drafts live in the submissions table and never appear here)
      const { data: papers, error } = await sb
        .from('papers')
        .select('slug, published_on, updated_at')
        .order('published_on', { ascending: false });

      if (!error && papers) {
        paperEntries = papers
          .filter((p) => p.slug)
          .map((p) => ({
            url: `${SITE}/journals/${p.slug}`,
            lastModified: p.updated_at || p.published_on || now,
            changeFrequency: 'monthly',
            priority: 0.8,
          }));
      }

      // Dynamic news pages
      const { data: news, error: newsError } = await sb
        .from('news')
        .select('slug, published_on, updated_at')
        .order('published_on', { ascending: false });

      if (!newsError && news) {
        const newsEntries = news
          .filter((n) => n.slug)
          .map((n) => ({
            url: `${SITE}/news/${n.slug}`,
            lastModified: n.updated_at || n.published_on || now,
            changeFrequency: 'monthly',
            priority: 0.6,
          }));
        paperEntries = [...paperEntries, ...newsEntries];
      }

      // Author pages
      const { data: authors, error: authError } = await sb
        .from('authors')
        .select('slug, updated_at');

      if (!authError && authors) {
        const authorEntries = authors
          .filter((a) => a.slug)
          .map((a) => ({
            url: `${SITE}/authors/${a.slug}`,
            lastModified: a.updated_at || now,
            changeFrequency: 'monthly',
            priority: 0.5,
          }));
        paperEntries = [...paperEntries, ...authorEntries];
      }
    } catch {
      // Supabase unavailable — return static pages only
    }
  }

  return [...staticEntries, ...paperEntries];
}
