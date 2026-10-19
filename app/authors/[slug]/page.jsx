import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Avatar, PaperCard, DemoNote, SetupNotice } from '@/components/ui';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const D = await getAll();
  const a = D.authors.find((x) => x.slug === slug);
  return { title: a ? a.name : 'Author' };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const a = D.authors.find((x) => x.slug === slug);
  if (!a) notFound();
  const ps = h.papersByAuthor(slug).sort(h.byDate);
  const cs = [...new Set(ps.flatMap((p) => [p.cat, p.cat2].filter(Boolean)))];
  const kind = a.type === 'student' ? 'Student' : a.type === 'faculty' ? 'Faculty' : 'Researcher';
  return (
    <>
      <section className="page-head author-head">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb"><ol><li><Link href="/">Home</Link></li><li><Link href="/authors">Authors</Link></li><li><span aria-current="page">{a.name}</span></li></ol></nav>
          <div className="author-hero">
            <Avatar a={a} size="xl" />
            <div><p className="eyebrow">{kind} author</p><h1>{a.name}</h1><p className="lede">{a.designation}{a.designation && a.inst ? ' · ' : ''}{a.inst}</p></div>
          </div>
        </div>
      </section>
      <section className="section"><div className="container author-cols">
        <div>
          <h2>Biography</h2>
          <p className="prose-p">{a.bio || 'No biography supplied.'}</p>
          <h3>Research interests</h3>
          <ul className="tags">{a.interests.map((i) => <li key={i}><Link href={`/search?q=${encodeURIComponent(i)}`}>{i}</Link></li>)}</ul>
          <h3>Research categories</h3>
          <div className="chips">{cs.map((c) => <Link key={c} className="chip big" href={`/journals?cat=${c}`}>{h.cat(c).short}</Link>)}</div>
          <h3>External profiles</h3>
          <p className="muted">No external researcher profiles supplied.</p>
          {ps.some((p) => p.demo) ? <DemoNote>Sample profile — fictional demonstration data.</DemoNote> : null}
        </div>
        <div>
          <h2>Published papers ({ps.length})</h2>
          <div className="grid g2">{ps.map((p) => <PaperCard key={p.id} p={p} h={h} />)}</div>
        </div>
      </div></section>
    </>
  );
}
