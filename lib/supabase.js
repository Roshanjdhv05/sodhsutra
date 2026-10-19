import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const noStore = (u, o) => fetch(u, { ...o, cache: 'no-store' });
const opts = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: noStore } };

const placeholder = (v) => !v || /your-|your_|xxxx/i.test(v);

export function isConfigured() {
  return !placeholder(url) && !placeholder(anon);
}
export function isAdminConfigured() {
  return isConfigured() && !placeholder(service);
}

/** Read-only client (anon key). Row Level Security allows public SELECT on published tables. */
export function supabasePublic() {
  if (!isConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  return createClient(url, anon, opts);
}

/** Server-only client (service role key). Never import this into a client component. */
export function supabaseAdmin() {
  if (!isAdminConfigured()) throw new Error('SUPABASE_SERVICE_KEY_MISSING');
  return createClient(url, service, opts);
}
