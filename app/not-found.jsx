import Link from 'next/link';
import { PageHead } from '@/components/ui';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      <PageHead title="Page not found" intro="The link may be out of date, or the item does not exist in the collection." />
      <div className="container section">
        <div className="empty" role="status">
          <h3>We couldn’t find that page</h3>
          <p>Try browsing the full list instead.</p>
          <div className="row"><Link className="btn btn-primary" href="/categories">Browse categories</Link><Link className="btn btn-ghost" href="/">Go home</Link></div>
        </div>
      </div>
    </>
  );
}
