import { getAll } from '@/lib/data';
import { PageHead, AuthorCard, SetupNotice } from '@/components/ui';

export const metadata = { title: 'Authors' };

export default async function AuthorsPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  return (
    <>
      <PageHead eyebrow="Authors" title="Contributing authors" intro="Everyone who has published in the collection." crumbs={[['Home', '/'], ['Authors']]} />
      <section className="section"><div className="container"><div className="grid g3">{D.authors.map((a) => <AuthorCard key={a.slug} a={a} />)}</div></div></section>
    </>
  );
}
