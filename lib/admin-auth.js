import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const NAME = 'ss_admin';
const DAYS = 7;

const secret = () => process.env.ADMIN_SESSION_SECRET || ('ss:' + (process.env.ADMIN_PASSWORD || ''));
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();

export function adminPasswordSet() {
  const p = process.env.ADMIN_PASSWORD;
  return !!p && !/your-|change-me/i.test(p);
}

export function checkPassword(input) {
  if (!adminPasswordSet()) return false;
  return crypto.timingSafeEqual(sha(input || ''), sha(process.env.ADMIN_PASSWORD));
}

function makeToken() {
  const exp = String(Date.now() + DAYS * 864e5);
  return exp + '.' + sign(exp);
}

function verifyToken(t) {
  if (!t || !adminPasswordSet()) return false;
  const [exp, sig] = String(t).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  if (good.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig));
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyToken(jar.get(NAME)?.value);
}

export async function startAdminSession() {
  const jar = await cookies();
  jar.set(NAME, makeToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete(NAME);
}
