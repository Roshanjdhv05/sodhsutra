import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { citeBase } from '@/lib/sections';
import { Icon } from '@/components/Icon';
import { PaperCard, Avatar, SetupNotice } from '@/components/ui';
import { ProgressBar, CiteBox, ShareRow } from '@/components/PaperTools';

import { SITE_URL as SITE } from '@/lib/site';

/** Normalise a raw DOI string — returns bare DOI like "10.1234/abc" or null */
function normaliseDoi(raw) {
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .trim() || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const D = await getAll();
  const p = D.papers?.find((x) => x.slug === slug);

  if (!p) return { title: 'Paper Not Found' };

  const h = makeHelpers(D);

  const canonicalUrl = `${SITE}/journals/${slug}`;
  const doi = normaliseDoi(p.doi);
  const authors = (p.authors || []).map((s) => h.author(s)?.name).filter(Boolean);

  // Build Google Scholar citation_* meta tags (name/content pairs injected via `other`)
  const scholarMeta = {};

  scholarMeta['citation_title'] = p.title || 'Untitled';

  // One entry per author — Next.js `other` supports arrays
  // We store as pipe-separated and split below, or use direct array approach
  // Actually Next.js `other` accepts arrays when the key is repeated — use array values
  if (authors.length > 0) {
    scholarMeta['citation_author'] = authors; // Next.js renders one <meta> per array entry
  }

  if (p.date) {
    // Google Scholar expects YYYY/MM/DD
    const d = String(p.date).slice(0, 10).replace(/-/g, '/');
    scholarMeta['citation_publication_date'] = d;
  }

  scholarMeta['citation_journal_title'] = 'ShodhSutra';

  if (p.paperUrl) {
    scholarMeta['citation_pdf_url'] = p.paperUrl;
  }

  if (p.abstract) {
    scholarMeta['citation_abstract'] = String(p.abstract).slice(0, 500);
  }

  if (p.keywords && p.keywords.length > 0) {
    scholarMeta['citation_keywords'] = p.keywords.join('; ');
  }

  if (doi) {
    scholarMeta['citation_doi'] = doi;
  }

  // Volume / issue from the volumes list if available
  const vols = D.volumes || [];
  const vol = vols.find((v) => (v.paperIds || []).includes(p.id));
  if (vol) {
    if (vol.volNo) scholarMeta['citation_volume'] = String(vol.volNo);
    if (vol.issueNo) scholarMeta['citation_issue'] = String(vol.issueNo);
  }

  // Page range — detected from PDF footer or manually entered
  if (p.pages) {
    scholarMeta['citation_firstpage'] = String(p.pageStart || p.pages.split(/[–\-]/)[0]).trim();
    if (p.pageEnd) scholarMeta['citation_lastpage'] = String(p.pageEnd).trim();
  }

  return {
    title: p.title || 'Paper',
    description: p.abstract ? String(p.abstract).slice(0, 160) : `Research paper published on ShodhSutra`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: p.title,
      description: p.abstract ? String(p.abstract).slice(0, 200) : undefined,
      url: canonicalUrl,
      type: 'article',
      ...(authors.length > 0 && { authors }),
      publishedTime: p.date,
    },
    other: scholarMeta,
  };
}

export default async function PaperPage({ params }) {
  const { slug } = await params;
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const p = D.papers.find((x) => x.slug === slug);
  if (!p) notFound();
  const c = h.cat(p.cat);
  const rel = h.related(p);
  const firstBody = p.paperUrl ? 'manuscript-pdf' : 'cite';

  // Format clean DOI URL and display text
  const doiStr = typeof p.doi === 'string' ? p.doi.trim() : '';
  const doiUrl = doiStr
    ? (doiStr.startsWith('http') ? doiStr : `https://doi.org/${doiStr}`)
    : null;
  const doiDisplay = doiStr
    ? (doiStr.startsWith('http') ? doiStr.replace(/^https?:\/\/(doi\.org\/)?/, '') : doiStr)
    : 'Not assigned';

  // Extract first sentence of abstract for subtitle/lede
  const absStr = typeof p.abstract === 'string' ? p.abstract.trim() : '';
  const firstSentence = absStr
    ? (absStr.split(/(?<=[.?!])\s+/)[0] || absStr).trim()
    : null;

  const citeMeta = {
    authorNames: (p.authors || []).map((s) => h.author(s)?.name).filter(Boolean),
    year: p.year || 2026,
    title: p.title || '',
    journal: 'ShodhSutra',
    doi: p.doi || null,
    url: `https://shodhsutra.com/journals/${p.slug}`,
    defaultStyle: p.citationStyle || 'apa',
    pages: p.pages || undefined,
  };

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
                  <a className="btn btn-card-primary" href="#manuscript-pdf">
                    <Icon name="link" size={16} />
                    <span>View Original PDF</span>
                    <span className="btn-arrow" aria-hidden="true">↓</span>
                  </a>
                ) : (
                  <button className="btn btn-card-primary disabled" disabled aria-disabled="true" title="No paper manuscript has been added">
                    <Icon name="link" size={16} />
                    <span>PDF unavailable</span>
                  </button>
                )}
                {p.paperUrl ? (
                  <a className="btn btn-card-secondary" href={p.paperUrl} target="_blank" rel="noopener noreferrer">
                    <Icon name="book" size={16} />
                    <span>Open in new tab ↗</span>
                  </a>
                ) : null}
                <a className="btn btn-card-ghost" href="#cite">
                  <Icon name="copy" size={16} />
                  <span>Cite This Paper</span>
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container article-body article-body--no-toc">
        <article className="prose">
          {/* Directly show Original Manuscript (PDF) */}
          {p.paperUrl ? (
            <section id="manuscript-pdf" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>Original Manuscript (PDF)</h2>
                <a
                  href={p.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="read-link"
                >
                  Open in new tab <Icon name="arrow" size={16} />
                </a>
              </div>
              <div style={{ width: '100%', height: 'clamp(540px, 80vh, 900px)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', background: '#525659', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <iframe
                  src={`${p.paperUrl}#toolbar=1`}
                  title={p.title}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </div>
            </section>
          ) : (
            <section style={{ marginBottom: '2rem' }}>
              <p className="muted">PDF manuscript is not currently available for this paper.</p>
            </section>
          )}
          <CiteBox base={citeBase(p, h)} meta={citeMeta} />
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
