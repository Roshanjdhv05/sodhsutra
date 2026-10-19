import { getAll } from '@/lib/data';
import { PageHead, SetupNotice } from '@/components/ui';
import SubmitForm from '@/components/SubmitForm';

export const metadata = { title: 'Submit Research' };

export default async function SubmitPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  return (
    <>
      <PageHead eyebrow="Submit" title="Submit your research" intro="Share your paper for editorial consideration. Submitting does not mean acceptance or publication." crumbs={[['Home', '/'], ['Submit Research']]} />
      <section className="section"><div className="container narrow"><SubmitForm categories={D.categories} /></div></section>
    </>
  );
}
