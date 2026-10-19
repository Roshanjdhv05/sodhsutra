import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import JournalsClient from '@/components/JournalsClient';

export const metadata = { title: 'Journals' };

export default async function JournalsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return (
    <>
      <PageHead eyebrow="Journals" title="Browse the research" intro="Search, filter and sort every paper in the collection. Each card opens the full article page." crumbs={[['Home', '/'], ['Journals']]} />
      <JournalsClient data={slim(D)} initial={{ q: one(sp.q), cat: one(sp.cat), type: one(sp.type), year: one(sp.year), sort: one(sp.sort) || 'latest' }} />
    </>
  );
}
