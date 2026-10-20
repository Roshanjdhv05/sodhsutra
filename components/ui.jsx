import Link from 'next/link';
import { Icon } from './Icon';
import { artInner } from '@/lib/art';
import { initials } from '@/lib/helpers';

export function CoverArt({ style, seed, image }) {
  if (image) {
    return (
      <span className="cover-art cover-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" decoding="async" width="360" height="480" />
      </span>
    );
  }
  return (
    <span className="cover-art">
      <svg className="cover-svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artInner(style, seed) }} />
    </span>
  );
}

export function Cover({ p, h, cls = '' }) {
  return (
    <div className={`cover t${p.theme} ${cls}`.trim()}>
      <CoverArt style={p.style} seed={p.n} image={p.cover} />
      <div className="cover-head"><span className="cover-cat">{h.cat(p.cat).short}</span><span className="cover-vol">{p.type}</span></div>
      <div className="cover-body">
        <h3 className="cover-title">{p.title}</h3>
        <p className="cover-author">{h.authorNames(p)}</p>
        <p className="cover-date">{h.fmt(p.date)}</p>
      </div>
    </div>
  );
}

export function PaperCard({ p, h, byline }) {
  const href = `/journals/${p.slug}`;
  const cat = h.cat(p.cat);
  const authorText = byline || h.authorNames(p);
  const inst = p.inst || (p.authors && p.authors.length ? h.author(p.authors[0])?.inst : '') || '';
  const hasInstInByline = byline && inst && byline.toLowerCase().includes(inst.toLowerCase());

  return (
    <article className="rcard reveal">
      <div className="rcard-head">
        <span className="rcard-cat">{cat.short || cat.name}</span>
        <time className="rcard-date" dateTime={p.date}>{h.fmt(p.date)}</time>
      </div>
      <h3 className="rcard-title">
        <Link href={href}>{p.title}</Link>
      </h3>
      <div className="rcard-author-info">
        {authorText ? <p className="rcard-by">{authorText}</p> : null}
        {inst && !hasInstInByline ? (
          <p className="rcard-inst">
            <Icon name="building" size={14} /> {inst}
          </p>
        ) : null}
      </div>
      <p className="rcard-abs">{p.abstract}</p>
      <div className="rcard-foot">
        <span className="rcard-type">{p.type}</span>
        <Link className="read-link" href={href}>
          Read Paper <Icon name="arrow" size={16} />
        </Link>
      </div>
    </article>
  );
}

export function Thumb({ n }) {
  return (
    <div className={`thumb t${n.theme}`}>
      <CoverArt style={n.style} seed={n.n} image={n.cover} />
      <span className="thumb-tag">Editorial</span>
    </div>
  );
}

export function NewsCard({ n, big, h }) {
  const href = `/news/${n.slug}`;
  return (
    <article className={`ncard reveal ${big ? 'big' : ''}`.trim()}>
      <Link href={href} aria-label={n.title}><Thumb n={n} /></Link>
      <div className="ncard-body">
        <div className="rcard-meta"><span className="chip chip-dark">{n.cat}</span><time dateTime={n.date}>{h.fmt(n.date)}</time></div>
        <h3><Link href={href}>{n.title}</Link></h3>
        <p>{n.summary}</p>
        <p className="byline">{n.byline}</p>
        <Link className="read-link" href={href}>Read Article <Icon name="arrow" size={16} /></Link>
      </div>
    </article>
  );
}

export function Avatar({ a, size = '' }) {
  return (
    <span className={`avatar av${a.name.length % 5} ${size}`.trim()} aria-hidden="true">
      {a.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.photo} alt="" /> : initials(a.name)}
    </span>
  );
}

export function AuthorCard({ a }) {
  return (
    <article className="acard reveal">
      <div className="acard-top">
        <Avatar a={a} />
        <div><h3><Link href={`/authors/${a.slug}`}>{a.name}</Link></h3><p>{a.designation}</p></div>
      </div>
      <p className="rcard-inst"><Icon name="building" size={14} /> {a.inst}</p>
      <ul className="tags">{a.interests.map((i) => <li key={i}>{i}</li>)}</ul>
      <Link className="read-link" href={`/authors/${a.slug}`}>View profile <Icon name="arrow" size={16} /></Link>
    </article>
  );
}

export function PageHead({ eyebrow, title, intro, crumbs, className = 'page-head' }) {
  return (
    <section className={className}>
      <div className="container">
        {crumbs ? (
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={i}>{c[1] && i < crumbs.length - 1 ? <Link href={c[1]}>{c[0]}</Link> : <span aria-current="page">{c[0]}</span>}</li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {intro ? <p className="lede">{intro}</p> : null}
      </div>
    </section>
  );
}

export function DemoNote({ children }) {
  return <p className="demo-note"><Icon name="info" size={16} /> {children || 'Demonstration data — sample authors, institutions and papers are fictional.'}</p>;
}

export function Empty({ message, children }) {
  return (
    <div className="empty" role="status">
      <div className="empty-ic"><Icon name="search" size={34} /></div>
      <h3>No results found</h3>
      <p>{message}</p>
      {children}
    </div>
  );
}

export function Pagination({ total, per, page, onPage }) {
  const n = Math.ceil(total / per);
  if (n <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><Icon name="arrow" size={16} className="flip" /></button>
      {Array.from({ length: n }, (_, i) => i + 1).map((i) => (
        <button key={i} className={i === page ? 'on' : ''} aria-current={i === page ? 'page' : undefined} onClick={() => onPage(i)}>{i}</button>
      ))}
      <button disabled={page >= n} onClick={() => onPage(page + 1)} aria-label="Next page"><Icon name="arrow" size={16} /></button>
    </nav>
  );
}

export function SetupNotice({ error }) {
  const notConfigured = error === 'NOT_CONFIGURED';
  return (
    <div className="container">
      <div className="setup">
        <p className="eyebrow">Setup needed</p>
        <h1 style={{ fontSize: '2rem' }}>{notConfigured ? 'Connect your Supabase project' : 'The database could not be read'}</h1>
        {notConfigured ? (
          <ol>
            <li>Open <code>.env</code> and fill in <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>.</li>
            <li>In the Supabase SQL editor run <code>supabase/schema.sql</code>, then <code>supabase/seed.sql</code>.</li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        ) : (
          <>
            <p className="muted">Supabase answered with: <code>{String(error).replace(/^DB:/, '')}</code></p>
            <p>If the tables do not exist yet, run <code>supabase/schema.sql</code> and then <code>supabase/seed.sql</code> in the Supabase SQL editor.</p>
          </>
        )}
      </div>
    </div>
  );
}
