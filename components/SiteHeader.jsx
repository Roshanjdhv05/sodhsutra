'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { Avatar } from './ui';
import { makeHelpers, initials } from '@/lib/helpers';
import { toast } from '@/lib/toast';

const NAV = [
  ['Home', '/', 'home'],
  ['Journals', '/journals', 'journals'],
  ['Published Papers', '/published-papers', 'published-papers'],
  ['About', '/about', 'about'],
  ['Contact Us', '/contact', 'contact'],
];

function activeKey(p) {
  if (p === '/') return 'home';
  if (p === '/journals') return 'journals';
  if (/^\/(about|editorial-policy|submission-guidelines)/.test(p)) return 'about';
  if (p.startsWith('/published-papers') || p.startsWith('/journals') || p.startsWith('/categories')) return 'published-papers';
  if (p.startsWith('/contact')) return 'contact';
  return '';
}

export function Logo({ className = '', size = 40 }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="ShodhSutra Logo"
      width={size}
      height={Math.round(size * 1.24)}
      className={`logo ${className}`.trim()}
      loading="eager"
      decoding="async"
    />
  );
}

export default function SiteHeader({ data }) {
  const pathname = usePathname();
  const act = activeKey(pathname || '/');
  const h = useMemo(() => makeHelpers(data), [data]);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const qRef = useRef(null);

  useEffect(() => { setDrawer(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => { document.body.classList.toggle('lock', searchOpen || drawer); }, [searchOpen, drawer]);
  useEffect(() => {
    const hd = document.querySelector('.site-header');
    const onS = () => hd && hd.classList.toggle('scrolled', window.scrollY > 8);
    onS(); window.addEventListener('scroll', onS, { passive: true });
    const onK = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setDrawer(false); }
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onK);
    return () => { window.removeEventListener('scroll', onS); document.removeEventListener('keydown', onK); };
  }, []);
  useEffect(() => { if (searchOpen) setTimeout(() => qRef.current?.focus(), 30); }, [searchOpen]);

  const results = useMemo(() => (q.trim() ? { ps: h.search(q.trim()).slice(0, 5), as: h.searchAuthors(q.trim()).slice(0, 3) } : null), [q, h]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" href="/" aria-label={`${data.brand} home`}><Logo /><span>{data.brand}</span></Link>
          <nav className="nav-links" aria-label="Primary">
            {NAV.map((n) => <Link key={n[1]} href={n[1]} className={act === n[2] ? 'active' : undefined} aria-current={act === n[2] ? 'page' : undefined}>{n[0]}</Link>)}
          </nav>
          <div className="nav-actions">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Open search"><Icon name="search" /></button>
            <Link className="btn btn-primary btn-sm" href="/submit">Submit Research</Link>
            <button className="icon-btn menu-btn" onClick={() => setDrawer((d) => !d)} aria-label={drawer ? 'Close menu' : 'Open menu'} aria-expanded={drawer} aria-controls="drawer"><Icon name={drawer ? 'x' : 'menu'} /></button>
          </div>
        </div>

        {/* Backdrop for mobile drawer */}
        <div
          className={`drawer-backdrop ${drawer ? 'open' : ''}`}
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />

        {/* Mobile drawer sliding from left side */}
        <div className={`drawer ${drawer ? 'open' : ''}`} id="drawer" role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div className="drawer-head">
            <Link className="brand" href="/" onClick={() => setDrawer(false)} aria-label={`${data.brand} home`}>
              <Logo size={36} />
              <span>{data.brand}</span>
            </Link>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu">
              <Icon name="x" size={20} />
            </button>
          </div>
          <nav aria-label="Mobile" className="drawer-nav">
            {NAV.map((n) => (
              <Link
                key={n[1]}
                href={n[1]}
                className={act === n[2] ? 'active' : undefined}
                aria-current={act === n[2] ? 'page' : undefined}
                onClick={() => setDrawer(false)}
              >
                {n[0]}
              </Link>
            ))}
            <div className="drawer-foot">
              <Link href="/submit" className="btn btn-primary btn-block" onClick={() => setDrawer(false)}>
                Submit Research
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="overlay" hidden={!searchOpen} role="dialog" aria-modal="true" aria-label="Search research" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
        <div className="overlay-panel">
          <button className="overlay-close icon-btn" aria-label="Close search" onClick={() => setSearchOpen(false)}><Icon name="x" /></button>
          <form action="/search">
            <label className="sr" htmlFor="overlay-q">Search research</label>
            <div className="search-box"><Icon name="search" /><input id="overlay-q" ref={qRef} name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search research papers, authors, topics..." autoComplete="off" /><button className="btn btn-primary" type="submit">Search</button></div>
          </form>
          <div className="overlay-results">
            {!results ? <p className="muted">Start typing to see matching papers and authors. Press Esc to close.</p>
              : !results.ps.length && !results.as.length ? <p className="muted">No matches for “{q}”. Try a broader keyword.</p>
                : (
                  <>
                    {results.ps.map((p) => <Link key={p.slug} className="sr-item" href={`/journals/${p.slug}`}><span className="chip">{h.cat(p.cat).short}</span><span>{p.title}<small>{h.authorNames(p)}</small></span></Link>)}
                    {results.as.map((a) => <Link key={a.slug} className="sr-item" href={`/authors/${a.slug}`}><span className="chip chip-dark">Author</span><span>{a.name}<small>{a.inst}</small></span></Link>)}
                    <Link className="sr-all" href={`/search?q=${encodeURIComponent(q)}`}>See all results for “{q}” <Icon name="arrow" size={16} /></Link>
                  </>
                )}
          </div>
        </div>
      </div>
    </>
  );
}
