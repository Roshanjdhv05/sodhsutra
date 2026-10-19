import Link from 'next/link';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { artInner } from '@/lib/art';
import { Icon } from '@/components/Icon';
import { PageHead, SetupNotice } from '@/components/ui';

export const metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  return (
    <>
      <PageHead eyebrow="Categories" title={`${D.categories.length} fields, one reading list`} intro="Every category links to a filtered journal listing. Counts come from the papers currently published." crumbs={[['Home', '/'], ['Categories']]} />
      <section className="section"><div className="container">
        <div className="grid g3">
          {D.categories.map((c, i) => {
            const n = D.papers.filter((p) => h.inCat(p, c.slug)).length;
            return (
              <article className="catcard reveal" key={c.slug}>
                <Link href={`/journals?cat=${c.slug}`} className={`catcard-art t${i % 6}`} aria-label={`Browse ${c.name}`}>
                  <span className="cover-art"><svg className="cover-svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artInner((i * 3 + 1) % 8, i + 40) }} /></span>
                  <span className="catcard-ic"><Icon name={c.icon} size={30} /></span>
                </Link>
                <div className="catcard-body">
                  <h3>{c.name}</h3><p>{c.desc}</p>
                  <div className="catcard-foot"><span className="chip">{n} paper{n === 1 ? '' : 's'}</span><Link className="read-link" href={`/journals?cat=${c.slug}`}>Browse papers <Icon name="arrow" size={16} /></Link></div>
                  <Link className="muted-link" href={`/categories/${c.slug}`}>Category page</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div></section>
    </>
  );
}
