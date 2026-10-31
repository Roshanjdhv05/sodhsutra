import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import JournalsClient from '@/components/JournalsClient';

export const metadata = {
  title: 'Articles',
  description: 'Browse all published research articles, filter by theme, author type, or publication year.',
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
        title="Articles"
        intro="Search, filter, and explore all published articles in the collection. Each card opens the full article page."
        crumbs={[['Home', '/'], ['Articles']]}
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
