'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { copyText } from '@/lib/toast';

export function ProgressBar() {
  useEffect(() => {
    const bar = document.getElementById('progress'); if (!bar) return undefined;
    const upd = () => { const d = document.documentElement; bar.style.transform = `scaleX(${Math.min(1, d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight))})`; };
    window.addEventListener('scroll', upd, { passive: true }); upd();
    return () => window.removeEventListener('scroll', upd);
  }, []);
  return <div className="progress" id="progress" aria-hidden="true" />;
}

export function Toc({ secs, title = 'Contents' }) {
  const [on, setOn] = useState('');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setOn(e.target.id); }), { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.prose > section[id]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <aside className="toc" aria-label="Table of contents">
      <h2>{title}</h2>
      <ol>{secs.map((s) => <li key={s.id}><a href={`#${s.id}`} className={on === s.id ? 'on' : undefined}>{s.title}</a></li>)}</ol>
    </aside>
  );
}

export function CiteBox({ base }) {
  const [url, setUrl] = useState('');
  useEffect(() => { setUrl(window.location.href); }, []);
  const text = url ? `${base} ${url}` : base;
  return (
    <section className="cite-box" id="cite">
      <h2>Cite this paper</h2>
      <p>{text}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => copyText(text)}><Icon name="copy" size={16} /> Copy citation</button>
    </section>
  );
}

export function ShareRow({ title }) {
  const [url, setUrl] = useState('');
  useEffect(() => { setUrl(window.location.href); }, []);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  return (
    <section className="share" aria-label="Share">
      <h2>Share</h2>
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => copyText(url)}><Icon name="link" size={16} /> Copy link</button>
        <a className="btn btn-ghost btn-sm" href={`mailto:?subject=${t}&body=${u}`}><Icon name="mail" size={16} /> Email</a>
        <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`}>X</a>
        <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}>LinkedIn</a>
      </div>
    </section>
  );
}
