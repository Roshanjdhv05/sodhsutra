import Link from 'next/link';
import { getAll, slim } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { PageHead, Cover, Avatar, AuthorCard, SetupNotice } from '@/components/ui';
import StudentFilter from '@/components/StudentFilter';

export const metadata = { title: 'Student Research' };

export default async function StudentPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const base = D.papers.filter((p) => h.hasType(p, 'student')).sort(h.byDate);
  const stories = [...base].sort((a, b) => b.views - a.views).slice(0, 2);
  const students = D.authors.filter((a) => a.type === 'student');
  return (
    <>
      <PageHead eyebrow="Student Research" title="Early-career voices" intro="Research contributed by undergraduate and postgraduate students. Affiliations and credentials appear only where provided." crumbs={[['Home', '/'], ['Student Research']]} />
      <section className="section"><div className="container">
        <h2>Featured stories</h2>
        <div className="stories">
          {stories.map((p) => {
            const a = h.author(p.authors.find((s) => h.author(s).type === 'student'));
            return (
              <article className="story reveal" key={p.id}>
                <Link href={`/journals/${p.slug}`} aria-label={p.title}><Cover p={p} h={h} /></Link>
                <div>
                  <p className="eyebrow">{h.cat(p.cat).name}</p>
                  <h3><Link href={`/journals/${p.slug}`}>{p.title}</Link></h3>
                  <p className="who"><Avatar a={a} size="sm" /> <span><strong>{a.name}</strong> · {a.designation}<br />{a.inst}</span></p>
                  <p>{p.abstract}</p>
                  <Link className="read-link" href={`/journals/${p.slug}`}>Read Paper <Icon name="arrow" size={16} /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </div></section>
      <section className="section tint"><StudentFilter data={slim(D)} /></section>
      <section className="section"><div className="container">
        <h2>Student author profiles</h2>
        <div className="grid g3">{students.map((a) => <AuthorCard key={a.slug} a={a} />)}</div>
      </div></section>
    </>
  );
}
