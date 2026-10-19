import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { PageHead, PaperCard, Empty, SetupNotice } from '@/components/ui';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const D = await getAll();
  const c = D.categories.find((x) => x.slug === slug);
  return { title: c ? c.name : 'Category' };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const c = D.categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const list = D.papers.filter((p) => h.inCat(p, c.slug)).sort(h.byDate);
  return (
    <>
      <PageHead eyebrow="Category" title={c.name} intro={c.desc} crumbs={[['Home', '/'], ['Categories', '/categories'], [c.short]]} />
      <section className="section"><div className="container">
        <div className="section-head"><p className="count-line">{list.length} paper{list.length === 1 ? '' : 's'} in this category</p><Link className="more" href={`/journals?cat=${c.slug}`}>Open in journal listing <Icon name="arrow" size={16} /></Link></div>
        {list.length ? <div className="grid g3">{list.map((p) => <PaperCard key={p.id} p={p} h={h} />)}</div> : <Empty message="No papers in this category yet." />}
      </div></section>
      <section className="section tint"><div className="container">
        <h2>Other categories</h2>
        <div className="chips">{D.categories.filter((x) => x.slug !== c.slug).map((x) => <Link key={x.slug} className="chip big" href={`/categories/${x.slug}`}>{x.short}</Link>)}</div>
      </div></section>
    </>
  );
}
