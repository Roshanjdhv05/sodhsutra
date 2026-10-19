import Link from 'next/link';
import { PageHead } from './ui';
import { Toc } from './PaperTools';

export const Ph = () => <span className="ph">Placeholder — to be finalised</span>;

export default function StaticPage({ eyebrow, title, intro, secs, crumb }) {
  return (
    <>
      <PageHead eyebrow={eyebrow} title={title} intro={intro} crumbs={[['Home', '/'], [crumb]]} />
      <section className="container article-body">
        <Toc secs={secs.map((s) => ({ id: s.id, title: s.title }))} title="On this page" />
        <article className="prose">
          {secs.map((s) => <section id={s.id} key={s.id}><h2>{s.title}</h2>{s.body}</section>)}
        </article>
      </section>
    </>
  );
}

export { Link };
