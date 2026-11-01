/** Canonical site URL — used for sitemaps, canonical tags, and Scholar metadata. */
export const SITE_URL = 'https://shodhsutra.com';

/** Build an absolute canonical URL from a path. */
export function canonical(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

