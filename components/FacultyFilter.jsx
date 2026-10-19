'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { makeHelpers } from '@/lib/helpers';

export default function FacultyFilter({ data }) {
  const h = useMemo(() => makeHelpers(data), [data]);
  const facAuth = useMemo(() => data.authors.filter((a) => a.type === 'faculty' || a.type === 'researcher'), [data]);
  const depts = [...new Set(facAuth.map((a) => a.dept).filter(Boolean))].sort();
  const insts = [...new Set(facAuth.map((a) => a.inst))].sort();
  const [st, setSt] = useState({ q: '', dept: '', inst: '' });
  const set = (k, v) => setSt((s) => ({ ...s, [k]: v }));
  const clear = () => setSt({ q: '', dept: '', inst: '' });
  const q = st.q.trim().toLowerCase();
  const list = facAuth.filter((a) => (!st.dept || a.dept === st.dept) && (!st.inst || a.inst === st.inst)
    && (!q || (a.name + ' ' + a.interests.join(' ') + ' ' + h.papersByAuthor(a.slug).map((p) => p.title).join(' ')).toLowerCase().includes(q)));

  return (
    <div className="container">
      <h2>Professor &amp; researcher profiles</h2>
      <div className="filters-row">
        <div className="field"><label htmlFor="f-q">Search name, interest or title</label><input className="input" id="f-q" type="search" value={st.q} onChange={(e) => set('q', e.target.value)} /></div>
        <div className="field"><label htmlFor="f-dept">Department</label><select className="select" id="f-dept" value={st.dept} onChange={(e) => set('dept', e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div className="field"><label htmlFor="f-inst">Institution</label><select className="select" id="f-inst" value={st.inst} onChange={(e) => set('inst', e.target.value)}><option value="">All institutions</option>{insts.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <button className="btn btn-ghost" onClick={clear}>Clear Filters</button>
      </div>
      <p className="count-line" aria-live="polite">{list.length} profile{list.length === 1 ? '' : 's'}</p>
      <div className="grid g2">
        {list.length ? list.map((a) => (
          <article className="fprofile reveal" key={a.slug}>
            <div className="acard-top"><Avatar a={a} /><div><h3><Link href={`/authors/${a.slug}`}>{a.name}</Link></h3><p>{a.designation}{a.dept ? ` · ${a.dept}` : ''}</p></div></div>
            <p className="rcard-inst"><Icon name="building" size={14} /> {a.inst}</p>
            <ul className="tags">{a.interests.map((i) => <li key={i}>{i}</li>)}</ul>
            <h4>Publications</h4>
            <ul className="publist">{h.papersByAuthor(a.slug).sort(h.byDate).map((p) => <li key={p.id}><Link href={`/journals/${p.slug}`}>{p.title}</Link><time dateTime={p.date}>{p.year}</time></li>)}</ul>
          </article>
        )) : <div className="span-all"><Empty message="No profiles match these filters."><button className="btn btn-primary" onClick={clear}>Clear Filters</button></Empty></div>}
      </div>
    </div>
  );
}
