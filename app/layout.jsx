import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Effects from '@/components/Effects';
import { getAll, slim, BRAND } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { default: `${BRAND} — Ideas that move knowledge forward`, template: `%s — ${BRAND}` },
  description: `${BRAND} — a multidisciplinary research journal platform for students, teachers and independent researchers.`,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const D = await getAll();
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <noscript><style>{'.reveal{opacity:1!important;transform:none!important}'}</style></noscript>
      </head>
      <body>
        <SiteHeader data={slim(D)} />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter brand={BRAND} />
        <Effects />
      </body>
    </html>
  );
}
