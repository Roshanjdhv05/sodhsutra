import { redirect } from 'next/navigation';

export default async function JournalsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const u = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (v) u.set(k, Array.isArray(v) ? v[0] : v);
  });
  const qs = u.toString();
  redirect(`/categories${qs ? `?${qs}` : ''}`);
}
