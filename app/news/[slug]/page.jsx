import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { PageHead, NewsCard, Thumb, SetupNotice } from '@/components/ui';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const D = await getAll();
  const n = D.news.find((x) => x.slug === slug);
  return { title: n ? n.title : 'News', description: n?.summary };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const n = D.news.find((x) => x.slug === slug);
  if (!n) notFound();
  const rp = n.relSlug ? D.papers.find((p) => p.slug === n.relSlug) : null;
  const more = D.news.filter((x) => x.id !== n.id).sort(h.byDate).slice(0, 3);
  return (
    <>
      <PageHead eyebrow={`Editorial · ${n.cat}`} title={n.title} intro={n.summary} crumbs={[['Home', '/'], ['Research News', '/news'], [n.cat]]} />
      <section className="container narrow section">
        <div className="editorial-banner"><Icon name="info" size={18} /> <span><strong>Editorial content.</strong> This is a news article, not a peer-reviewed research paper.</span></div>
        <div className="news-hero"><Thumb n={n} /></div>
        <p className="byline">{n.byline} · <time dateTime={n.date}>{h.fmt(n.date)}</time></p>
        <div className="prose">{n.body.map((b, i) => <p key={i}>{b}</p>)}</div>
        {rp ? (
          <aside className="related-paper"><p className="eyebrow">Related research</p><Link href={`/journals/${rp.slug}`}>{rp.title}</Link><span>{h.authorNames(rp)}</span></aside>
        ) : null}
      </section>
      {more.length ? (
        <section className="section tint"><div className="container"><h2>More news</h2><div className="grid g3">{more.map((x) => <NewsCard key={x.id} n={x} h={h} />)}</div></div></section>
      ) : null}
    </>
  );
}
