import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import JournalsClient from '@/components/JournalsClient';

export const metadata = {
  title: 'Published Papers',
  description: 'Browse all published research papers, filter by category, author type, or publication year.',
};

export default async function PublishedPapersPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return (
    <>
      <PageHead
        eyebrow="Published Research"
        title="Published Papers"
        intro="Search, filter, and explore all published papers in the collection. Each card opens the full article page."
        crumbs={[['Home', '/'], ['Published Papers']]}
      />
      <JournalsClient
        data={slim(D)}
        initial={{
          q: one(sp.q),
          cat: one(sp.cat),
          type: one(sp.type),
          year: one(sp.year),
          sort: one(sp.sort) || 'latest',
        }}
      />
    </>
  );
}
