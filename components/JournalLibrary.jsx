'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { CoverArt } from './ui';

export default function JournalLibrary({ data }) {
  const [selectedYear, setSelectedYear] = useState('all');
  const [activeVolume, setActiveVolume] = useState(null);

  // Extract all distinct academic years from volumes
  const allYears = useMemo(() => {
    const list = [...new Set((data.volumes || []).map((v) => v.year))].filter(Boolean);
    // Ensure '2026- 2027' is first
    return list.sort((a, b) => {
      if (a.includes('2026')) return -1;
      if (b.includes('2026')) return 1;
      return b.localeCompare(a);
    });
  }, [data.volumes]);

  // Group volumes by academic year
  const groupedVolumes = useMemo(() => {
    const map = {};
    (data.volumes || []).forEach((vol) => {
      const yr = vol.year || '2026- 2027';
      (map[yr] ||= []).push(vol);
    });
    // Sort issues within each year by volume_no then issue_no
    Object.keys(map).forEach((yr) => {
      map[yr].sort((a, b) => (a.volNo || 1) - (b.volNo || 1) || (a.issueNo || 1) - (b.issueNo || 1));
    });
    return map;
  }, [data.volumes]);

  // Sync with ?volume= query param if present on load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const p = new URLSearchParams(window.location.search);
      const volId = p.get('volume');
      if (volId && data?.volumes) {
        const found = data.volumes.find((v) => String(v.id) === volId);
        if (found) setActiveVolume(found);
      }
    } catch {}
  }, [data?.volumes]);

  // Lock body scroll when book modal is open
  useEffect(() => {
    document.body.classList.toggle('lock', !!activeVolume);
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveVolume(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('lock');
      window.removeEventListener('keydown', onKey);
    };
  }, [activeVolume]);

  const openBook = (vol) => {
    setActiveVolume(vol);
    if (typeof window !== 'undefined') {
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('volume', vol.id);
        window.history.replaceState(window.history.state, '', u.pathname + u.search);
      } catch {}
    }
  };

  const closeBook = () => {
    setActiveVolume(null);
    if (typeof window !== 'undefined') {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('volume');
        window.history.replaceState(window.history.state, '', u.pathname + (u.search ? u.search : ''));
      } catch {}
    }
  };

  const displayedYears = selectedYear === 'all' ? allYears : [selectedYear];
  const totalVolumes = (data.volumes || []).length;
  const totalPapers = data.papers.length;

  return (
    <>
      {/* Header Banner */}
      <section className="journal-hero">
        <div className="container journal-hero-inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><span aria-current="page">Issues</span></li>
            </ol>
          </nav>
          <div style={{ maxWidth: '780px' }}>
            <p className="eyebrow">Academic Archive</p>
            <h1>Issues &amp; Volumes</h1>
            <p className="lede">
              Explore ShodhSutra’s official peer-reviewed issues presented as interactive books.
              Select any issue below to directly read its published manuscript PDF.
            </p>
            <div className="journal-stats-row">
              <span className="journal-stat-chip">
                <Icon name="book" size={16} /> <strong>{totalVolumes}</strong> Bi-annual {totalVolumes === 1 ? 'Issue' : 'Issues'}
              </span>
              <span className="journal-stat-chip">
                <Icon name="check" size={16} /> <strong>{totalPapers}</strong> Peer-Reviewed Papers
              </span>
              <span className="journal-stat-chip">
                <Icon name="building" size={16} /> Academic Year <strong>2026 – 2027</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Journal Library Content */}
      <main className="container" style={{ paddingBottom: '96px' }}>
        {/* Year Filter Pills */}
        {allYears.length > 1 && (
          <div className="year-filter-bar">
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--mut)' }}>Filter by Year:</span>
            <button
              type="button"
              className={`year-pill-btn ${selectedYear === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedYear('all')}
            >
              All Academic Years
            </button>
            {allYears.map((yr) => (
              <button
                key={yr}
                type="button"
                className={`year-pill-btn ${selectedYear === yr ? 'active' : ''}`}
                onClick={() => setSelectedYear(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        )}

        {/* Year-wise Sections */}
        {displayedYears.map((yearKey) => {
          const issues = groupedVolumes[yearKey] || [];
          return (
            <section key={yearKey} className="year-section" aria-labelledby={`heading-year-${yearKey}`}>
              <div className="year-section-head">
                <div className="year-section-title-wrap">
                  <h2 id={`heading-year-${yearKey}`} className="year-section-title">
                    Academic Year {yearKey}
                  </h2>
                  <span className="year-badge">
                    {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}
                  </span>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                  Click on any journal book cover to directly open and read its manuscript PDF
                </p>
              </div>

              {/* 3D Journal Books Grid */}
              <div className="journal-books-grid">
                {issues.map((vol) => {
                  return (
                    <article
                      key={vol.id}
                      className="journal-book-card"
                      onClick={() => openBook(vol)}
                      tabIndex={0}
                      role="button"
                      aria-haspopup="dialog"
                      aria-label={`Open ${vol.name} (${vol.period || vol.year})`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openBook(vol);
                        }
                      }}
                    >
                      {/* Realistic 3D Hardcover Book */}
                      <div className={`journal-book-3d ${vol.cover ? 'has-cover-image' : ''}`.trim()}>
                        <div className="journal-book-spine-groove" aria-hidden="true" />
                        <div className="journal-book-art-bg" aria-hidden="true">
                          <CoverArt style={vol.style} seed={vol.n} image={vol.cover} />
                        </div>
                        <div className="journal-book-cover-content">
                          <div className="journal-book-brand-tag">
                            ShodhSutra Journal
                          </div>
                          <div>
                            <span className="journal-book-year-tag">{vol.year}</span>
                            <h3 className="journal-book-main-title">{vol.name}</h3>
                            {vol.period && (
                              <p className="journal-book-period">{vol.period}</p>
                            )}
                          </div>
                          <div className="journal-book-foot">
                            <span className="journal-book-count-badge">
                              Full Issue PDF
                            </span>
                            <span className="journal-book-open-hint">
                              Open PDF <Icon name="arrow" size={12} />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Metadata below book */}
                      <div className="journal-book-meta">
                        <div className="journal-book-title-sub">{vol.name}</div>
                        {vol.period && (
                          <div className="journal-book-period-sub">{vol.period}</div>
                        )}
                        <span className="journal-book-papers-badge">
                          <Icon name="file" size={13} /> Complete Manuscript (PDF)
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* ============================================================
          Interactive Open Book Reader Modal — Direct PDF View
          ============================================================ */}
      {activeVolume && (
        <div
          className="book-reader-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-vol-name"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBook();
          }}
        >
          <div className="book-reader-container">
            {/* Top Bar Navigation */}
            <div className="book-reader-top-bar">
              <div className="book-reader-breadcrumbs">
                <Icon name="book" size={16} />
                <span className="book-reader-bread-archive">Academic Archive / {activeVolume.year} / </span>
                <span className="book-reader-bread-name">{activeVolume.name}</span>
              </div>
              <div className="book-reader-top-actions">
                {activeVolume.pdfUrl && (
                  <a
                    href={activeVolume.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm book-reader-newtab-btn"
                    title="Open PDF in new tab"
                  >
                    <Icon name="link" size={14} /> <span className="book-reader-btn-label">New Tab ↗</span>
                  </a>
                )}
                <button
                  type="button"
                  className="book-reader-close-btn"
                  onClick={closeBook}
                  aria-label="Close Book"
                >
                  <Icon name="x" size={16} /> <span>Close</span>
                </button>
              </div>
            </div>

            {/* Split Page Layout (Left: Cover & Info, Right: Direct PDF Viewer) */}
            <div className="book-reader-layout">
              {/* Left Page: Volume Information */}
              <aside className="book-reader-left">
                <div className={`book-reader-cover-preview ${activeVolume.cover ? 'has-cover-image' : ''}`.trim()}>
                  <div className="journal-book-art-bg" aria-hidden="true">
                    <CoverArt style={activeVolume.style} seed={activeVolume.n} image={activeVolume.cover} />
                  </div>
                  <div className="book-reader-cover-preview-content">
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FBD3B6' }}>
                      ShodhSutra
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#FFE3CC' }}>{activeVolume.year}</div>
                      <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: '#fff', margin: '4px 0' }}>
                        {activeVolume.name}
                      </h4>
                      {activeVolume.period && (
                        <div style={{ fontSize: '0.78rem', color: '#FFD7B5' }}>{activeVolume.period}</div>
                      )}
                    </div>
                  </div>
                </div>

                <h3 id="reader-vol-name" className="book-reader-vol-name">
                  {activeVolume.name}
                </h3>
                {activeVolume.period && (
                  <span className="book-reader-period-pill">
                    {activeVolume.period}
                  </span>
                )}
                <p className="book-reader-desc">
                  {activeVolume.desc ||
                    'Official bi-annual publication of peer-reviewed multidisciplinary academic research.'}
                </p>

                <dl className="book-reader-details-list">
                  <div className="book-reader-detail-item">
                    <dt>Academic Cycle:</dt>
                    <dd>{activeVolume.year}</dd>
                  </div>
                  <div className="book-reader-detail-item">
                    <dt>Volume Number:</dt>
                    <dd>Vol {activeVolume.volNo || 1}</dd>
                  </div>
                  <div className="book-reader-detail-item">
                    <dt>Issue Number:</dt>
                    <dd>Issue {activeVolume.issueNo || 1}</dd>
                  </div>
                </dl>

                {activeVolume.pdfUrl ? (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <a
                      href={activeVolume.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}
                    >
                      <Icon name="link" size={15} /> Open in new tab ↗
                    </a>
                    <a
                      href={activeVolume.pdfUrl}
                      download
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', gap: '8px', fontSize: '0.88rem' }}
                    >
                      <Icon name="file" size={15} /> Download PDF ⤓
                    </a>
                  </div>
                ) : null}
              </aside>

              {/* Right Page: Direct Full Manuscript PDF Viewer */}
              <section className="book-reader-right">
                {activeVolume.pdfUrl ? (
                  <div className="book-reader-pdf-view-wrap">
                    <div className="book-reader-pdf-toolbar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pill ok" style={{ fontSize: '0.75rem' }}>Manuscript PDF</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)' }}>
                          {activeVolume.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a
                          href={activeVolume.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <Icon name="link" size={13} /> Open in new tab ↗
                        </a>
                        <a
                          href={activeVolume.pdfUrl}
                          download
                          className="btn btn-ghost btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <Icon name="file" size={13} /> Download PDF ⤓
                        </a>
                      </div>
                    </div>
                    <div className="book-reader-iframe-frame">
                      <iframe
                        src={`${activeVolume.pdfUrl}#toolbar=1`}
                        title={`${activeVolume.name} - Full Issue PDF`}
                        width="100%"
                        height="100%"
                        className="book-reader-pdf-iframe"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="book-reader-no-pdf">
                    <div className="book-reader-no-pdf-card">
                      <div className="book-reader-no-pdf-icon">
                        <Icon name="file" size={36} />
                      </div>
                      <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', color: 'var(--ink)', margin: '14px 0 6px' }}>
                        Manuscript PDF Not Available
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--mut)', lineHeight: 1.6, margin: '0 0 16px' }}>
                        The complete issue manuscript PDF has not been uploaded yet for <strong>{activeVolume.name}</strong>.
                      </p>
                      <span className="pill warn">Awaiting PDF Upload</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
