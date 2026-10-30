'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from './Icon';
import { CoverArt } from './ui';
import { makeHelpers } from '@/lib/helpers';

export default function JournalLibrary({ data }) {
  const searchParams = useSearchParams();
  const h = useMemo(() => makeHelpers(data), [data]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [activeVolume, setActiveVolume] = useState(null);
  const [paperQuery, setPaperQuery] = useState('');

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

  // Sync with ?volume= query param if present
  useEffect(() => {
    const volId = searchParams.get('volume');
    if (volId && data.volumes) {
      const found = data.volumes.find((v) => String(v.id) === volId);
      if (found) setActiveVolume(found);
    }
  }, [searchParams, data.volumes]);

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
    setPaperQuery('');
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      u.searchParams.set('volume', vol.id);
      window.history.replaceState(null, '', u.toString());
    }
  };

  const closeBook = () => {
    setActiveVolume(null);
    setPaperQuery('');
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      u.searchParams.delete('volume');
      window.history.replaceState(null, '', u.toString());
    }
  };

  // Find papers for the currently opened volume
  const volumePapers = useMemo(() => {
    if (!activeVolume) return [];
    const ids = activeVolume.paperIds || [];
    let list = ids
      .map((id) => data.papers.find((p) => p.id === id))
      .filter(Boolean);

    // If no papers explicitly mapped, show all papers as fallback
    if (!list.length && data.papers.length > 0) {
      list = data.papers.slice(0, 4);
    }

    if (!paperQuery.trim()) return list;
    const q = paperQuery.toLowerCase();
    return list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.abstract || '').toLowerCase().includes(q) ||
      h.authorNames(p).toLowerCase().includes(q)
    );
  }, [activeVolume, data.papers, paperQuery, h]);

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
              Select any issue below to open the book and read all published research articles.
            </p>
            <div className="journal-stats-row">
              <span className="journal-stat-chip">
                <Icon name="book" size={16} /> <strong>{totalVolumes}</strong> Quarterly Issues
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
                  Click on any journal book cover to open and read its articles
                </p>
              </div>

              {/* 3D Journal Books Grid */}
              <div className="journal-books-grid">
                {issues.map((vol) => {
                  const paperCount = vol.paperIds ? vol.paperIds.length : 0;
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
                              {paperCount} {paperCount === 1 ? 'Paper' : 'Papers'}
                            </span>
                            <span className="journal-book-open-hint">
                              Open Book <Icon name="arrow" size={12} />
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
                          <Icon name="book" size={13} /> {paperCount} Research {paperCount === 1 ? 'Paper' : 'Papers'}
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
          Interactive Open Book Reader Modal
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
                <Icon name="book" size={18} />
                <span>Academic Archive</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span>{activeVolume.year}</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span>{activeVolume.name}</span>
              </div>
              <button
                type="button"
                className="book-reader-close-btn"
                onClick={closeBook}
                aria-label="Close Book"
              >
                <Icon name="x" size={16} /> Close Book
              </button>
            </div>

            {/* Split Page Layout (Left: Cover & Info, Right: Included Papers) */}
            <div className="book-reader-layout">
              {/* Left Page */}
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
                    'Official quarterly publication of peer-reviewed multidisciplinary academic research.'}
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
                  <div className="book-reader-detail-item">
                    <dt>Articles Included:</dt>
                    <dd>{volumePapers.length} Papers</dd>
                  </div>
                  <div className="book-reader-detail-item">
                    <dt>Peer Review:</dt>
                    <dd>Double-Blind Verified</dd>
                  </div>
                </dl>
              </aside>

              {/* Right Page */}
              <section className="book-reader-right">
                <div className="book-reader-right-head">
                  <div>
                    <h3>Included Research Papers</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '0.86rem' }}>
                      Showing {volumePapers.length} {volumePapers.length === 1 ? 'paper' : 'papers'} in this volume
                    </p>
                  </div>
                  <div className="search-box small book-reader-paper-search">
                    <Icon name="search" size={16} />
                    <input
                      type="search"
                      placeholder="Filter papers in this volume…"
                      value={paperQuery}
                      onChange={(e) => setPaperQuery(e.target.value)}
                    />
                    {paperQuery && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setPaperQuery('')}
                        style={{ width: 22, height: 22 }}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="book-papers-list">
                  {volumePapers.map((paper, idx) => {
                    const cat = h.cat(paper.cat);
                    return (
                      <article key={paper.id} className="book-paper-row-item">
                        <div className="book-paper-row-top">
                          <span className="chip">{cat.short || cat.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>
                            Article #{idx + 1} · {h.fmt(paper.date)}
                          </span>
                        </div>
                        <h4 className="book-paper-row-title">
                          <Link href={`/journals/${paper.slug}`}>
                            {paper.title}
                          </Link>
                        </h4>
                        <p className="book-paper-row-authors">
                          <Icon name="user" size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                          {h.authorNames(paper)}
                          {paper.inst ? ` · ${paper.inst}` : ''}
                        </p>
                        <p className="book-paper-row-abstract">
                          {paper.abstract}
                        </p>
                        <div className="book-paper-row-actions">
                          <Link href={`/journals/${paper.slug}`} className="btn btn-primary btn-sm">
                            <Icon name="book" size={15} /> Read Full Paper
                          </Link>
                          {paper.paperUrl && (
                            <a
                              href={paper.paperUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                            >
                              <Icon name="link" size={15} /> Open Manuscript ↗
                            </a>
                          )}
                          {paper.doi && (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="read-link"
                              style={{ fontSize: '0.82rem' }}
                            >
                              DOI: {paper.doi}
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}

                  {!volumePapers.length && (
                    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <p className="muted">
                        {paperQuery
                          ? `No papers found matching “${paperQuery}” in this volume.`
                          : 'No research papers have been assigned to this volume yet.'}
                      </p>
                      {paperQuery && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setPaperQuery('')}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
