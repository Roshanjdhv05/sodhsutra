import { getAll, slim } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import SearchClient from '@/components/SearchClient';

export const metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return (
    <>
      <PageHead eyebrow="Search" title="Search the collection" intro="Matches paper titles, abstracts, authors, keywords, categories and institutions." crumbs={[['Home', '/'], ['Search']]} />
      <SearchClient data={slim(D)} initialQ={one(sp.q)} initialCat={one(sp.cat)} />
    </>
  );
}
