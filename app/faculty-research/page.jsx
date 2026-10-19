import Link from 'next/link';
import { getAll, slim } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { PageHead, Cover, Avatar, SetupNotice } from '@/components/ui';
import FacultyFilter from '@/components/FacultyFilter';

export const metadata = { title: 'Faculty Research' };

export default async function FacultyPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const base = D.papers.filter((p) => h.hasType(p, 'faculty') || h.hasType(p, 'researcher')).sort(h.byDate);
  const feat = [...base].sort((a, b) => b.views - a.views)[0];
  const fa = feat ? h.author(feat.authors[0]) : null;
  return (
    <>
      <PageHead eyebrow="Faculty Research" title="Scholarship from the academy" intro="Papers by professors, teachers and academic researchers, using the same dataset and article pages as the rest of the site." crumbs={[['Home', '/'], ['Faculty Research']]} />
      {feat ? (
        <section className="section"><div className="container">
          <h2>Featured faculty research</h2>
          <article className="story reveal">
            <Link href={`/journals/${feat.slug}`} aria-label={feat.title}><Cover p={feat} h={h} /></Link>
            <div>
              <p className="eyebrow">{h.cat(feat.cat).name}</p>
              <h3><Link href={`/journals/${feat.slug}`}>{feat.title}</Link></h3>
              <p className="who"><Avatar a={fa} size="sm" /> <span><strong>{fa.name}</strong> · {fa.designation}<br />{fa.inst}</span></p>
              <p>{feat.abstract}</p>
              <Link className="read-link" href={`/journals/${feat.slug}`}>Read Paper <Icon name="arrow" size={16} /></Link>
            </div>
          </article>
        </div></section>
      ) : null}
      <section className="section tint"><FacultyFilter data={slim(D)} /></section>
    </>
  );
}
