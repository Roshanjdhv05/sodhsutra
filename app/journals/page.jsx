import { getAll, slim } from '@/lib/data';
import { SetupNotice } from '@/components/ui';
import JournalLibrary from '@/components/JournalLibrary';

export const metadata = {
  title: 'Issues & Volumes',
  description: 'Explore peer-reviewed issues and bi-annual volumes by academic year. Open any issue to inspect and read published research articles.',
  alternates: { canonical: 'https://shodhsutra.in/journals' },
};

export default async function JournalsPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;

  return <JournalLibrary data={slim(D)} />;
}
