'use client';
import { useMemo } from 'react';
import { CITATION_STYLES, formatCitation, citationToHtml, styleExample } from '@/lib/cite';

/**
 * Citation Style & Preview component for the paper creation / edit form.
 *
 * Props:
 *   selected      — currently selected style id (e.g. 'apa')
 *   onSelect      — called with style id when a card is clicked
 *   paperMeta     — { authorNames[], year, title, journal, volume, issue, pages, doi }
 */
export default function CitationPicker({ selected = 'apa', onSelect, paperMeta = {} }) {
  // Build live citations for every style using the form's current data
  const styleCitations = useMemo(() => {
    const hasData = Boolean(
      (paperMeta.title && paperMeta.title.trim()) ||
      (paperMeta.authorNames && paperMeta.authorNames.length > 0)
    );

    return CITATION_STYLES.map((s) => {
      const raw = hasData
        ? formatCitation({ ...paperMeta, style: s.id })
        : styleExample(s.id);
      return {
        ...s,
        citation: raw,
        isLive: hasData,
      };
    });
  }, [paperMeta]);

  const activeStyle = CITATION_STYLES.find((s) => s.id === selected) || CITATION_STYLES[0];
  const activeCitation = styleCitations.find((s) => s.id === activeStyle.id) || styleCitations[0];

  return (
    <div className="cite-picker-section">
      {/* Selected Style Live Preview Card */}
      <div className="cite-live-preview-box">
        <div className="cite-live-preview-header">
          <div className="cite-live-preview-title">
            <span className="cite-badge">Selected Default Style</span>
            <strong>{activeStyle.label}</strong>
          </div>
          <span className="cite-live-indicator">
            <span className="cite-live-dot" /> Live Preview
          </span>
        </div>
        <div
          className="cite-live-preview-text"
          dangerouslySetInnerHTML={{ __html: citationToHtml(activeCitation.citation) }}
        />
      </div>

      {/* Grid of clickable style cards */}
      <div className="cite-cards-grid" role="radiogroup" aria-label="Citation styles">
        {styleCitations.map((s) => {
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`cite-card${isSelected ? ' cite-card--selected' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <div className="cite-card-top">
                <div className="cite-card-name">
                  <span className={`cite-radio-indicator${isSelected ? ' on' : ''}`} />
                  <strong>{s.label}</strong>
                </div>
                {isSelected && (
                  <span className="cite-selected-pill">Active</span>
                )}
              </div>

              <div
                className="cite-card-snippet"
                dangerouslySetInnerHTML={{ __html: citationToHtml(s.citation) }}
              />

              <div className="cite-card-footer">
                <span className="cite-card-tag">{s.short}</span>
                <span className="cite-card-action">
                  {isSelected ? '✓ Default Selected' : 'Click to select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
