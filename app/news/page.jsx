import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import NewsClient from '@/components/NewsClient';

export const metadata = { title: 'Research News' };

export default async function NewsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return (
    <>
      <PageHead eyebrow="Editorial" title="Research News" intro="Editorial features and explainers. News is editorial content — it is separate from the research papers and is not peer-reviewed." crumbs={[['Home', '/'], ['Research News']]} />
      <NewsClient data={slim(D)} initialQ={one(sp.q)} initialCat={one(sp.cat)} />
    </>
  );
}
