'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { PaperCard, AuthorCard, Empty } from '@/components/ui';
import { makeHelpers } from '@/lib/helpers';

export default function SearchClient({ data, initialQ = '', initialCat = '' }) {
  const h = useMemo(() => makeHelpers(data), [data]);
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const qq = q.trim();
  const list = h.search(qq).filter((p) => !cat || h.inCat(p, cat));
  const as = h.searchAuthors(qq);
  const ns = qq ? h.searchNews(qq) : [];
  const summary = qq || cat
    ? `${list.length} paper${list.length === 1 ? '' : 's'}${as.length ? `, ${as.length} author${as.length === 1 ? '' : 's'}` : ''}${ns.length ? `, ${ns.length} news` : ''}${qq ? ` for “${qq}”` : ''}`
    : `Showing all ${data.papers.length} papers`;

  return (
    <section className="section"><div className="container">
      <form className="search-box" role="search" onSubmit={(e) => { e.preventDefault(); window.history.replaceState(null, '', '/search' + (qq ? `?q=${encodeURIComponent(qq)}` : '')); }}>
        <Icon name="search" /><label className="sr" htmlFor="s-in">Search</label>
        <input id="s-in" type="search" placeholder="Search research papers, authors, topics..." value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      <div className="filters-row slim">
        <div className="field"><label htmlFor="s-cat">Filter by category</label>
          <select className="select" id="s-cat" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.short}</option>)}</select>
        </div>
      </div>
      <p className="count-line" aria-live="polite">{summary}</p>
      {as.length ? <><h2>Authors</h2><div className="grid g3 mb">{as.map((a) => <AuthorCard key={a.slug} a={a} />)}</div><h2>Papers</h2></> : null}
      {ns.length ? <p className="muted">Also in <Link href={`/news?q=${encodeURIComponent(qq)}`}>Research News</Link>: {ns.length} matching article{ns.length === 1 ? '' : 's'}.</p> : null}
      <div className="grid g3">
        {list.length ? list.map((p) => <PaperCard key={p.id} p={p} h={h} />) : (
          <div className="span-all">
            <Empty message="Nothing matched. Try a broader keyword, check spelling, or browse by category.">
              <div className="row"><Link className="btn btn-primary" href="/published-papers">Browse published papers</Link></div>
              <ul className="tags center">{['learning', 'energy', 'health', 'students', 'policy'].map((k) => <li key={k}><button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setQ(k)}>{k}</button></li>)}</ul>
            </Empty>
          </div>
        )}
      </div>
    </div></section>
  );
}
