import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { sectionsFor, citeBase } from '@/lib/sections';
import { Icon } from '@/components/Icon';
import { PaperCard, Avatar, SetupNotice } from '@/components/ui';
import { ProgressBar, Toc, CiteBox, ShareRow } from '@/components/PaperTools';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const D = await getAll();
  const p = D.papers.find((x) => x.slug === slug);
  return { title: p ? p.title : 'Paper', description: p ? p.abstract.slice(0, 160) : undefined };
}

export default async function PaperPage({ params }) {
  const { slug } = await params;
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const p = D.papers.find((x) => x.slug === slug);
  if (!p) notFound();
  const c = h.cat(p.cat);
  const secs = sectionsFor(p, h);
  const rel = h.related(p);
  const firstBody = secs[0]?.id || (p.paperUrl ? 'manuscript-pdf' : 'about-authors');

  // Format clean DOI URL and display text
  const doiUrl = p.doi
    ? (p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`)
    : null;
  const doiDisplay = p.doi
    ? (p.doi.startsWith('http') ? p.doi.replace(/^https?:\/\/(doi\.org\/)?/, '') : p.doi)
    : 'Not assigned';

  // Extract first sentence of abstract for subtitle/lede
  const firstSentence = p.abstract
    ? (p.abstract.split(/(?<=[.?!])\s+/)[0] || p.abstract).trim()
    : null;

  return (
    <>
      <ProgressBar />
      <section className="article-head">
        {/* Organic curved background design theme */}
        <div className="article-head-bg" aria-hidden="true">
          <svg className="article-head-wave" viewBox="0 0 1440 380" fill="none" preserveAspectRatio="none">
            <path d="M0,240 C320,330 520,150 880,210 C1140,250 1290,160 1440,180 L1440,380 L0,380 Z" fill="var(--o1)" opacity="0.7" />
            <path d="M0,290 C360,360 680,230 1020,270 C1220,300 1340,230 1440,250 L1440,380 L0,380 Z" fill="var(--o2)" opacity="0.45" />
            <circle cx="1260" cy="110" r="180" fill="var(--o1)" opacity="0.4" />
          </svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li><li><Link href="/published-papers">Published Papers</Link></li>
              <li><Link href={`/published-papers?cat=${c.slug}`}>{c.short}</Link></li>
              <li><span aria-current="page">{p.title.length > 48 ? p.title.slice(0, 48) + '…' : p.title}</span></li>
            </ol>
          </nav>

          <div className="article-grid">
            {/* Left: title & lede block */}
            <div className="article-title-col">
              <div className="article-eyebrow-wrap">
                <p className="article-eyebrow">
                  <Link href={`/published-papers?cat=${c.slug}`}>{c.name}</Link>
                  <span className="eyebrow-sep">·</span>
                  <span>{p.type}</span>
                </p>
                <span className="eyebrow-bar" aria-hidden="true" />
              </div>

              <h1 className="article-title">{p.title}</h1>

              {p.abstract ? (
                <div className="article-hero-abstract">
                  <div className="article-abstract-label">Abstract</div>
                  <p className="article-abstract-body">{p.abstract}</p>
                  {p.keywords && p.keywords.length > 0 && (
                    <div className="article-hero-keywords">
                      <span className="keywords-label">Keywords:</span>
                      <ul className="tags kw inline-tags" aria-label="Keywords">
                        {p.keywords.map((k) => (
                          <li key={k}><Link href={`/search?q=${encodeURIComponent(k)}`}>{k}</Link></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right: author details box */}
            <aside className="article-author-card" aria-label="Author and publication details">
              <div className="author-card-header">
                <ul className="author-card-list">
                  {p.authors.map((s) => {
                    const a = h.author(s);
                    return (
                      <li key={s} className="author-card-item">
                        <Avatar a={a} size="sm" />
                        <div className="author-card-info">
                          <Link href={`/authors/${a.slug}`} className="author-card-name">{a.name}</Link>
                          {(a.inst || a.designation) && (
                            <span className="author-card-inst">{a.inst || a.designation}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="author-card-divider" />

              <div className="author-card-meta">
                <div className="author-card-meta-row">
                  <div className="author-card-meta-icon"><Icon name="calendar" size={16} /></div>
                  <div className="author-card-meta-text">
                    <span className="author-card-meta-label">PUBLISHED</span>
                    <span className="author-card-meta-val"><time dateTime={p.date}>{h.fmt(p.date)}</time></span>
                  </div>
                </div>

                <div className="author-card-meta-row">
                  <div className="author-card-meta-icon"><Icon name="link" size={16} /></div>
                  <div className="author-card-meta-text">
                    <span className="author-card-meta-label">DOI</span>
                    <span className="author-card-meta-val">
                      {doiUrl ? (
                        <a href={doiUrl} target="_blank" rel="noopener noreferrer" title={doiUrl}>
                          {`https://doi.org/${doiDisplay}`}
                        </a>
                      ) : (
                        <span>Not assigned</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="author-card-actions">
                {p.paperUrl ? (
                  <a className="btn btn-card-primary" href={p.paperUrl} target="_blank" rel="noopener noreferrer">
                    <Icon name="link" size={16} />
                    <span>Open Paper Link</span>
                    <span className="btn-arrow" aria-hidden="true">→</span>
                  </a>
                ) : (
                  <button className="btn btn-card-primary disabled" disabled aria-disabled="true" title="No paper link has been added">
                    <Icon name="link" size={16} />
                    <span>Link unavailable</span>
                  </button>
                )}
                <a className="btn btn-card-secondary" href={`#${firstBody}`}>
                  <Icon name="book" size={16} />
                  <span>Read Full Text</span>
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container article-body">
        {secs.length > 0 ? <Toc secs={secs} /> : null}
        <article className="prose">
          {secs.length > 0 ? (
            secs.map((s) => (
              <section id={s.id} key={s.id}>
                <h2>{s.title}</h2>
                {s.paras.map((t, i) => <p key={i}>{t}</p>)}
                {s.link ? <p><a href={s.link} target="_blank" rel="noopener noreferrer" className="read-link">Open the paper <Icon name="arrow" size={16} /></a></p> : null}
                {s.id === 'manuscript-pdf' && p.paperUrl ? (
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '100%', height: '750px', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', background: '#525659' }}>
                      <iframe
                        src={`${p.paperUrl}#toolbar=1`}
                        title={p.title}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                      />
                    </div>
                  </div>
                ) : null}
                {s.refs && s.refs.length ? <ol>{s.refs.map((r, i) => <li key={i}>{r}</li>)}</ol> : null}
              </section>
            ))
          ) : (
            <section>
              <p className="muted">No content sections have been added for this paper.</p>
              {p.keywords && p.keywords.length ? (
                <ul className="tags kw" aria-label="Keywords">{p.keywords.map((k) => <li key={k}><Link href={`/search?q=${encodeURIComponent(k)}`}>{k}</Link></li>)}</ul>
              ) : null}
            </section>
          )}
          <CiteBox base={citeBase(p, h)} />
          <ShareRow title={p.title} />
          <section className="about-authors">
            <h2>About the {p.authors.length > 1 ? 'authors' : 'author'}</h2>
            {p.authors.map((s) => {
              const a = h.author(s);
              return (
                <div className="author-row" key={s}>
                  <Avatar a={a} />
                  <div><h3><Link href={`/authors/${a.slug}`}>{a.name}</Link></h3><p>{a.designation}{a.designation && a.inst ? ', ' : ''}{a.inst}</p><p className="muted">{a.bio}</p></div>
                </div>
              );
            })}
          </section>
        </article>
      </section>

      {rel.length ? (
        <section className="section tint"><div className="container">
          <div className="section-head"><div><p className="eyebrow">Keep reading</p><h2>Related research</h2></div><Link className="more" href={`/categories?cat=${c.slug}`}>More in {c.short} <Icon name="arrow" size={16} /></Link></div>
          <div className="grid g3">{rel.map((x) => <PaperCard key={x.id} p={x} h={h} />)}</div>
        </div></section>
      ) : null}
    </>
  );
}
