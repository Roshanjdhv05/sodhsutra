'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { NewsCard, Empty, DemoNote } from '@/components/ui';
import { makeHelpers } from '@/lib/helpers';

export default function NewsClient({ data, initialQ = '', initialCat = '' }) {
  const h = useMemo(() => makeHelpers(data), [data]);
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  let list = h.searchNews(q.trim()).filter((n) => !cat || n.cat === cat).sort(h.byDate);
  const feat = !q.trim() && !cat ? list[0] : null;
  if (feat) list = list.slice(1);
  const clear = () => { setQ(''); setCat(''); };
  const hasDemo = data.news.some((n) => n.demo);

  return (
    <section className="section"><div className="container">
      <div className="news-tools">
        <div className="search-box small"><Icon name="search" size={18} /><label className="sr" htmlFor="n-q">Search news</label><input id="n-q" type="search" placeholder="Search news…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips" role="group" aria-label="News categories">
          <button className={`chip big ${cat === '' ? 'on' : ''}`} onClick={() => setCat('')}>All</button>
          {data.newsCategories.map((c) => <button key={c} className={`chip big ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      {feat ? <div><p className="eyebrow">Featured</p><NewsCard n={feat} h={h} big /></div> : null}
      <h2 className="mt">Latest news</h2>
      <div className="grid g3">
        {list.length || feat ? list.map((n) => <NewsCard key={n.id} n={n} h={h} />) : (
          <div className="span-all"><Empty message="No news matches your search."><button className="btn btn-primary" onClick={clear}>Clear</button></Empty></div>
        )}
      </div>
      {hasDemo ? <DemoNote>Sample editorial content. No real-world events or scientific discoveries are reported.</DemoNote> : null}
    </div></section>
  );
}
