import { getAll, slim } from '@/lib/data';
import { SetupNotice } from '@/components/ui';
import JournalLibrary from '@/components/JournalLibrary';

export const metadata = {
  title: 'Journals & Volumes',
  description: 'Explore peer-reviewed journal volumes and quarterly issues by academic year. Open any journal book to inspect and read published research papers.',
};

export default async function JournalsPage() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;

  return <JournalLibrary data={slim(D)} />;
}
