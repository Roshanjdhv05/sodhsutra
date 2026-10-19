'use client';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { PaperCard, Empty, Pagination } from '@/components/ui';
import { makeHelpers, authorTypes } from '@/lib/helpers';

const PER = 9;

export default function JournalsClient({ data, initial }) {
  const h = useMemo(() => makeHelpers(data), [data]);
  const { papers: P, categories: CATS } = data;
  const [st, setSt] = useState({ q: initial.q || '', cat: initial.cat || '', type: initial.type || '', year: initial.year || '', sort: initial.sort || 'latest' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const set = (k, v) => { setSt((s) => ({ ...s, [k]: v })); setPage(1); };
  const clear = () => { setSt({ q: '', cat: '', type: '', year: '', sort: 'latest' }); setPage(1); };

  const list = useMemo(() => {
    let l = st.q ? h.search(st.q) : P.slice();
    l = l.filter((p) => (!st.cat || h.inCat(p, st.cat)) && (!st.type || h.hasType(p, st.type)) && (!st.year || p.year === +st.year));
    if (st.sort !== 'latest' || !st.q) l.sort(h.sortFn[st.sort] || h.byDate);
    return l;
  }, [st, h, P]);

  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const from = (cur - 1) * PER;
  const slice = list.slice(from, from + PER);

  useEffect(() => {
    const u = new URLSearchParams();
    Object.entries(st).forEach(([k, v]) => { if (v && v !== 'latest') u.set(k, v); });
    window.history.replaceState(null, '', '/journals' + (u.toString() ? '?' + u : ''));
  }, [st]);

  return (
    <section className="container listing">
      <button className="btn btn-ghost filter-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar"><Icon name="filter" size={18} /> Filters</button>
      <aside className={`sidebar ${open ? 'open' : ''}`} id="sidebar" aria-label="Filters">
        <div className="field"><label htmlFor="f-q">Search</label><input className="input" id="f-q" type="search" placeholder="Title, author, keyword…" value={st.q} onChange={(e) => set('q', e.target.value)} /></div>
        <fieldset><legend>Category</legend>
          <div className="radios scroll">
            <label><input type="radio" name="cat" value="" checked={!st.cat} onChange={() => set('cat', '')} /> All categories <em>{P.length}</em></label>
            {CATS.map((c) => <label key={c.slug}><input type="radio" name="cat" value={c.slug} checked={st.cat === c.slug} onChange={() => set('cat', c.slug)} /> {c.short} <em>{P.filter((p) => h.inCat(p, c.slug)).length}</em></label>)}
          </div>
        </fieldset>
        <fieldset><legend>Author type</legend>
          <div className="radios">{authorTypes.map((t) => <label key={t[0]}><input type="radio" name="type" value={t[0]} checked={st.type === t[0]} onChange={() => set('type', t[0])} /> {t[1]}</label>)}</div>
        </fieldset>
        <fieldset><legend>Publication year</legend>
          <div className="radios">
            <label><input type="radio" name="year" value="" checked={!st.year} onChange={() => set('year', '')} /> All years</label>
            {h.years(P).map((y) => <label key={y}><input type="radio" name="year" value={String(y)} checked={st.year === String(y)} onChange={() => set('year', String(y))} /> {y}</label>)}
          </div>
        </fieldset>
        <button className="btn btn-ghost btn-block" onClick={clear}>Clear Filters</button>
      </aside>
      <div className="results">
        <div className="results-bar">
          <p aria-live="polite">{list.length ? `Showing ${from + 1}–${from + slice.length} of ${list.length} papers` : '0 papers'}</p>
          <div className="field inline"><label htmlFor="f-sort">Sort by</label>
            <select className="select" id="f-sort" value={st.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="latest">Latest</option><option value="read">Most Read</option><option value="title">Title A–Z</option>
            </select>
          </div>
        </div>
        <div className="grid g3">
          {slice.length ? slice.map((p) => <PaperCard key={p.id} p={p} h={h} />) : (
            <div className="span-all"><Empty message="No papers match your search and filters. Try fewer keywords or clear the filters."><button className="btn btn-primary" onClick={clear}>Clear Filters</button></Empty></div>
          )}
        </div>
        <Pagination total={list.length} per={PER} page={cur} onPage={(n) => { setPage(n); window.scrollTo({ top: (document.querySelector('.listing')?.offsetTop || 0) - 80, behavior: 'smooth' }); }} />
      </div>
    </section>
  );
}
