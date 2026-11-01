'use client';
import { useEffect, useState, useCallback } from 'react';
import { Icon } from './Icon';
import { copyText } from '@/lib/toast';
import { CITATION_STYLES, formatCitation, citationToHtml, citationToText, toRIS } from '@/lib/cite';

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

/**
 * Interactive academic citation box with style selection tabs, formatted
 * live preview with italics, Copy Citation button, and RIS export download.
 *
 * Props:
 *   base — legacy fallback string
 *   meta — { authorNames[], year, title, journal, volume, issue, pages, doi, defaultStyle }
 */
export function CiteBox({ base, meta }) {
  const [url, setUrl] = useState('');
  const [activeStyle, setActiveStyle] = useState(meta?.defaultStyle || 'apa');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
    if (meta?.defaultStyle) {
      setActiveStyle(meta.defaultStyle);
    }
  }, [meta?.defaultStyle]);

  // Build citation for the active style
  const citationRaw = formatCitation({
    ...(meta || {}),
    url,
    style: activeStyle,
  });

  const citationPlain = citationToText(citationRaw);
  const citationHtml = citationToHtml(citationRaw);

  const handleCopy = useCallback(() => {
    copyText(citationPlain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [citationPlain]);

  const handleDownloadRIS = useCallback(() => {
    const content = toRIS({ ...(meta || {}), url });
    const blob = new Blob([content], { type: 'application/x-research-info-systems' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeTitle = (meta?.title || 'citation').slice(0, 30).replace(/[^a-z0-9]/gi, '_');
    a.download = `${safeTitle}.ris`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [meta, url]);

  // Legacy plain-text base string fallback (keeps old behavior when meta is absent)
  if (!meta && base) {
    const legacyText = url ? `${base} ${url}` : base;
    return (
      <section className="cite-box" id="cite">
        <h2>Cite this paper</h2>
        <p>{legacyText}</p>
        <button className="btn btn-ghost btn-sm" onClick={() => copyText(legacyText)}>
          <Icon name="copy" size={16} /> Copy citation
        </button>
      </section>
    );
  }

  const defaultStyleLabel = CITATION_STYLES.find((s) => s.id === (meta?.defaultStyle || 'apa'))?.label || 'APA 7th Edition';

  return (
    <section className="cite-box cite-box--rich" id="cite">
      <div className="cite-box-header">
        <div>
          <h2>Cite this paper</h2>
          <p className="cite-box-sub">
            Author-selected default: <strong>{defaultStyleLabel}</strong>. Switch style tabs to reformat.
          </p>
        </div>
      </div>

      <div className="cite-panel" role="region" aria-label="Citation styles and tools">
        {/* Style tabs */}
        <div className="cite-style-tabs" role="tablist" aria-label="Citation styles">
          {CITATION_STYLES.map((s) => {
            const isActive = activeStyle === s.id;
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                className={`cite-tab${isActive ? ' cite-tab--active' : ''}`}
                aria-selected={isActive}
                onClick={() => setActiveStyle(s.id)}
              >
                <span>{s.short}</span>
                {s.id === meta?.defaultStyle && (
                  <span className="cite-tab-dot" title="Default style" />
                )}
              </button>
            );
          })}
        </div>

        {/* Citation text box */}
        <div className="cite-text-wrap" role="tabpanel">
          <p
            className="cite-text"
            dangerouslySetInnerHTML={{ __html: citationHtml }}
          />
        </div>

        {/* Actions: Copy & Download */}
        <div className="cite-actions">
          <button
            type="button"
            className={`btn btn-primary btn-sm cite-action-btn${copied ? ' cite-copied' : ''}`}
            onClick={handleCopy}
          >
            <Icon name="copy" size={16} />
            {copied ? 'Citation Copied!' : 'Copy Citation'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm cite-action-btn"
            onClick={handleDownloadRIS}
            title="Download citation in .ris format (for Zotero, Mendeley, EndNote)"
          >
            <Icon name="arrow" size={16} />
            Download Citation (.ris)
          </button>
        </div>
      </div>
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
