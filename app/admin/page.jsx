import { isAdmin, adminPasswordSet } from '@/lib/admin-auth';
import { isAdminConfigured } from '@/lib/supabase';
import { getAdminData } from '@/lib/admin-data';
import AdminApp, { AdminLogin } from '@/components/AdminApp';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="container"><div className="setup">
        <p className="eyebrow">Admin setup</p><h1 style={{ fontSize: '2rem' }}>Supabase keys are missing</h1>
        <p>Open <code>.env</code> and fill in <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>, then restart <code>npm run dev</code>.</p>
      </div></div>
    );
  }
  if (!adminPasswordSet()) {
    return (
      <div className="container"><div className="setup">
        <p className="eyebrow">Admin setup</p><h1 style={{ fontSize: '2rem' }}>Set an admin password</h1>
        <p>Add <code>ADMIN_PASSWORD</code> (and a long random <code>ADMIN_SESSION_SECRET</code>) to <code>.env</code>, then restart the server.</p>
      </div></div>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;

  let data;
  try { data = await getAdminData(); } catch (e) {
    return (
      <div className="container"><div className="setup">
        <p className="eyebrow">Admin</p><h1 style={{ fontSize: '2rem' }}>Could not read the database</h1>
        <p className="muted">Supabase answered with: <code>{String(e.message)}</code></p>
        <p>Run <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code> in the Supabase SQL editor, then refresh.</p>
      </div></div>
    );
  }
  return <AdminApp data={data} />;
}
