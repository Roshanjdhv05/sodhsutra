import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import JournalsClient from '@/components/JournalsClient';

export const metadata = { title: 'Categories' };

export default async function CategoriesPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return (
    <>
      <PageHead
        eyebrow="Categories"
        title="Browse research by category"
        intro="Search, filter and sort every paper in the collection. Each card opens the full article page."
        crumbs={[['Home', '/'], ['Categories']]}
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
