import { supabaseAdmin } from './supabase';

/** Raw table rows for the admin panel (service-role read, bypasses RLS). */
export async function getAdminData() {
  const sb = supabaseAdmin();
  const q = (t, o) => { let r = sb.from(t).select('*'); if (o) r = r.order(o.col, { ascending: o.asc ?? true }); return r; };
  const [c, a, p, pa, n, s, m] = await Promise.all([
    q('categories', { col: 'sort_order' }), q('authors', { col: 'seq' }), q('papers'), q('paper_authors'), q('news'),
    q('submissions', { col: 'created_at', asc: false }), q('messages', { col: 'created_at', asc: false }),
  ]);
  for (const r of [c, a, p, pa, n, s, m]) if (r.error) throw new Error(r.error.message);
  const byPaper = {};
  [...pa.data].sort((x, y) => x.position - y.position).forEach((x) => { (byPaper[x.paper_id] ||= []).push(x.author_id); });

  let volumesData = [];
  let volumePapersData = [];
  try {
    const [vRes, vpRes] = await Promise.all([
      sb.from('journal_volumes').select('*').order('volume_no').order('issue_no'),
      sb.from('volume_papers').select('*'),
    ]);
    if (!vRes.error && vRes.data) volumesData = vRes.data;
    if (!vpRes.error && vpRes.data) volumePapersData = vpRes.data;
  } catch {
    // If tables do not exist yet, fallback smoothly
  }

  const papersByVolume = {};
  [...volumePapersData].sort((x, y) => (x.position || 0) - (y.position || 0)).forEach((x) => {
    (papersByVolume[x.volume_id] ||= []).push(x.paper_id);
  });

  return {
    categories: c.data, authors: a.data, news: n.data, submissions: s.data, messages: m.data,
    papers: p.data.map((r) => ({ ...r, authorIds: byPaper[r.id] || [] })),
    volumes: volumesData.map((v) => ({ ...v, paperIds: papersByVolume[v.id] || [] })),
  };
}
