import { SITE_URL as SITE } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        // Allow all legitimate crawlers to access public pages
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/login',
          '/login/',
          '/_next/',
        ],
      },
      {
        // Explicitly allow Googlebot Scholar to crawl research content
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/journals/',
          '/published-papers',
          '/authors/',
          '/news/',
          '/student-research',
          '/faculty-research',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/login',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
