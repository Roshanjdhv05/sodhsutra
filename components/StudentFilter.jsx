'use client';
import { useMemo, useState } from 'react';
import { PaperCard, Empty } from '@/components/ui';
import { makeHelpers } from '@/lib/helpers';

export default function StudentFilter({ data }) {
  const h = useMemo(() => makeHelpers(data), [data]);
  const base = useMemo(() => data.papers.filter((p) => h.hasType(p, 'student')).sort(h.byDate), [data, h]);
  const [st, setSt] = useState({ q: '', cat: '', inst: '', year: '' });
  const set = (k, v) => setSt((s) => ({ ...s, [k]: v }));
  const clear = () => setSt({ q: '', cat: '', inst: '', year: '' });
  const studentOf = (p) => h.author(p.authors.find((s) => h.author(s).type === 'student'));
  const insts = useMemo(() => [...new Set(base.flatMap((p) => p.authors.map(h.author).filter((a) => a.type === 'student').map((a) => a.inst)))].sort(), [base, h]);
  const cats = data.categories.filter((c) => base.some((p) => h.inCat(p, c.slug)));
  const q = st.q.trim().toLowerCase();

  const list = base.filter((p) => {
    if (q) {
      const hit = h.search(q, [p]).length > 0 || p.authors.some((s) => h.author(s).type === 'student' && h.author(s).name.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return (!st.cat || h.inCat(p, st.cat)) && (!st.inst || p.authors.some((s) => h.author(s).type === 'student' && h.author(s).inst === st.inst)) && (!st.year || p.year === +st.year);
  });

  return (
    <div className="container">
      <h2>All student research</h2>
      <div className="filters-row">
        <div className="field"><label htmlFor="s-q">Search student or title</label><input className="input" id="s-q" type="search" placeholder="e.g. Priya, sleep…" value={st.q} onChange={(e) => set('q', e.target.value)} /></div>
        <div className="field"><label htmlFor="s-cat">Discipline</label><select className="select" id="s-cat" value={st.cat} onChange={(e) => set('cat', e.target.value)}><option value="">All disciplines</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.short}</option>)}</select></div>
        <div className="field"><label htmlFor="s-inst">Institution</label><select className="select" id="s-inst" value={st.inst} onChange={(e) => set('inst', e.target.value)}><option value="">All institutions</option>{insts.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
        <div className="field"><label htmlFor="s-year">Year</label><select className="select" id="s-year" value={st.year} onChange={(e) => set('year', e.target.value)}><option value="">All years</option>{h.years(base).map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
        <button className="btn btn-ghost" onClick={clear}>Clear Filters</button>
      </div>
      <p className="count-line" aria-live="polite">{list.length} paper{list.length === 1 ? '' : 's'}</p>
      <div className="grid g3">
        {list.length ? list.map((p) => { const a = studentOf(p); return <PaperCard key={p.id} p={p} h={h} byline={`${a.name} · ${a.inst}`} />; }) : (
          <div className="span-all"><Empty message="No student papers match these filters."><button className="btn btn-primary" onClick={clear}>Clear Filters</button></Empty></div>
        )}
      </div>
    </div>
  );
}
