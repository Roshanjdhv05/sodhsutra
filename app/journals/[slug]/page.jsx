import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { sectionsFor, citeBase } from '@/lib/sections';
import { Icon } from '@/components/Icon';
import { Cover, PaperCard, Avatar, SetupNotice } from '@/components/ui';
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
  const firstBody = secs[1]?.id || 'abstract';

  return (
    <>
      <ProgressBar />
      <section className="article-head">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li><li><Link href="/published-papers">Published Papers</Link></li>
              <li><Link href={`/published-papers?cat=${c.slug}`}>{c.short}</Link></li>
              <li><span aria-current="page">{p.title.length > 48 ? p.title.slice(0, 48) + '…' : p.title}</span></li>
            </ol>
          </nav>
          <div className="article-grid">
            <div>
              <p className="eyebrow"><Link href={`/published-papers?cat=${c.slug}`}>{c.name}</Link> · {p.type}</p>
              <h1>{p.title}</h1>
              <ul className="authors-line">
                {p.authors.map((s) => {
                  const a = h.author(s);
                  return (
                    <li key={s}><Avatar a={a} size="sm" /><span><Link href={`/authors/${a.slug}`}>{a.name}</Link><small>{a.designation}{a.designation && a.inst ? ' · ' : ''}{a.inst}</small></span></li>
                  );
                })}
              </ul>
              <dl className="meta-grid">
                <div><dt>Published</dt><dd><time dateTime={p.date}>{h.fmt(p.date)}</time></dd></div>
                <div><dt>DOI</dt><dd>{p.doi ? <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">{p.doi}</a> : 'Not assigned'}</dd></div>
                <div><dt>Peer review</dt><dd>{p.peerReviewed ? 'Verified' : 'Not verified'}</dd></div>
                <div><dt>Readership</dt><dd>{h.num(p.views)}{p.demo ? <> <small>(sample)</small></> : null}</dd></div>
              </dl>
              {p.demo ? (
                <p className="demo-banner"><Icon name="info" size={16} /> <span><strong>Demonstration record.</strong> Authors, institutions and text are fictional. No DOI, PDF, peer-review status or references have been invented.</span></p>
              ) : null}
              <div className="hero-cta">
                {p.paperUrl ? (
                  <a className="btn btn-primary" href={p.paperUrl} target="_blank" rel="noopener noreferrer"><Icon name="link" size={18} /> Open Paper Link</a>
                ) : (
                  <button className="btn btn-primary" disabled aria-disabled="true" title="No paper link has been added to this record"><Icon name="link" size={18} /> Link unavailable</button>
                )}
                <a className="btn btn-ghost" href={`#${firstBody}`}><Icon name="book" size={18} /> Read Full Text</a>
              </div>
            </div>
            <div className="article-cover"><Cover p={p} h={h} cls="xl" /></div>
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
                {s.refs && s.refs.length ? <ol>{s.refs.map((r, i) => <li key={i}>{r}</li>)}</ol> : null}
                {s.id === 'abstract' ? (
                  <ul className="tags kw" aria-label="Keywords">{p.keywords.map((k) => <li key={k}><Link href={`/search?q=${encodeURIComponent(k)}`}>{k}</Link></li>)}</ul>
                ) : null}
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
