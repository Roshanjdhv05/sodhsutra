/**
 * Citation formatting utilities for ShodhSutra.
 * Supports: APA 7, IEEE, MLA 9, Harvard, Chicago, Vancouver.
 *
 * All functions are pure — no side effects, no DOM access, safe for SSR.
 */

export const CITATION_STYLES = [
  { id: 'apa',       label: 'APA 7th Edition',  short: 'APA' },
  { id: 'ieee',      label: 'IEEE',              short: 'IEEE' },
  { id: 'mla',       label: 'MLA 9th Edition',  short: 'MLA' },
  { id: 'harvard',   label: 'Harvard',           short: 'Harvard' },
  { id: 'chicago',   label: 'Chicago',           short: 'Chicago' },
  { id: 'vancouver', label: 'Vancouver',         short: 'Vancouver' },
];

/** Normalise a DOI value — strip any leading https://doi.org/ prefix. */
export function normaliseDoi(doi) {
  if (!doi) return null;
  return String(doi)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
}

/** Build a clean DOI URL. */
export function doiUrl(doi) {
  const d = normaliseDoi(doi);
  return d ? `https://doi.org/${d}` : null;
}

/** Normalize URL to ensure production domain rather than localhost. */
export function normaliseUrl(url) {
  if (!url) return '';
  return String(url)
    .trim()
    .replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, 'https://shodhsutra.com');
}

/**
 * Parse author names into an array of { first, last } objects.
 * Each authorName may be "First Last", "Last, First", or just a single word.
 */
function parseAuthors(authorNames) {
  return (authorNames || []).map((name) => {
    const n = String(name || '').trim();
    if (!n) return null;
    // "Last, First" format
    if (n.includes(',')) {
      const [last, first] = n.split(',').map((x) => x.trim());
      return { first: first || '', last: last || n };
    }
    const parts = n.split(/\s+/);
    if (parts.length === 1) return { first: '', last: parts[0] };
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return { first, last };
  }).filter(Boolean);
}

/** "Last, F. M." initials style used by APA / Vancouver */
function apaName(a) {
  if (!a.first) return a.last;
  const initials = a.first.split(/[\s-]+/).map((w) => w[0]?.toUpperCase() + '.').join(' ');
  return `${a.last}, ${initials}`;
}

/** "F. Last" style used by Chicago Notes / MLA */
function mlaNormalName(a) {
  if (!a.first) return a.last;
  return `${a.first} ${a.last}`;
}

/** "Last, First" for MLA first author; subsequent authors "First Last" */
function mlaAuthorList(authors) {
  if (!authors.length) return '';
  if (authors.length === 1) {
    const a = authors[0];
    return a.first ? `${a.last}, ${a.first}` : a.last;
  }
  const [first, ...rest] = authors;
  const firstStr = first.first ? `${first.last}, ${first.first}` : first.last;
  if (authors.length > 3) return `${firstStr}, et al.`;
  const restStr = rest.map(mlaNormalName).join(', and ');
  return `${firstStr}, and ${restStr}`;
}

/** Italicise title in plain text — wrap with * for display; markdown-aware */
function italic(t) { return `*${t}*`; }

/**
 * Build a citation string for the given style.
 *
 * @param {object} opts
 * @param {string[]} opts.authorNames   - display names ["First Last", …]
 * @param {number|string} opts.year     - publication year e.g. 2026
 * @param {string} opts.title           - paper title
 * @param {string} [opts.journal]       - journal / venue name (default "ShodhSutra")
 * @param {number|string} [opts.volume] - volume number
 * @param {number|string} [opts.issue]  - issue number
 * @param {string} [opts.pages]         - page range e.g. "12–24"
 * @param {string} [opts.doi]           - DOI value (normalised internally)
 * @param {string} [opts.url]           - canonical article URL (fallback if no DOI)
 * @param {string} [opts.style]         - citation style id (default 'apa')
 * @returns {string} formatted citation (plain text, italics marked with *)
 */
export function formatCitation({
  authorNames = [],
  year,
  title = '',
  journal = 'ShodhSutra',
  volume,
  issue,
  pages,
  doi,
  url,
  style = 'apa',
}) {
  const authors = parseAuthors(authorNames);
  const yr = year ? String(year) : 'n.d.';
  const doi_ = normaliseDoi(doi);
  const cleanUrl = normaliseUrl(url);
  const doiLink = doiUrl(doi) || cleanUrl || '';
  const jrn = journal || 'ShodhSutra';
  const volStr = volume ? String(volume) : '';
  const issStr = issue ? `(${issue})` : '';
  const pgStr = pages ? `, ${pages}` : '';

  switch (style) {
    /* ------------------------------------------------------------------ APA 7 */
    case 'apa': {
      const nameList = (() => {
        if (!authors.length) return '';
        if (authors.length > 20) {
          return authors.slice(0, 19).map(apaName).join(', ') + ', … ' + apaName(authors[authors.length - 1]);
        }
        return authors.map(apaName).join(', ');
      })();
      const volPart = volStr ? ` ${italic(volStr)}${issStr}${pgStr}` : '';
      const doiPart = doiLink ? ` ${doiLink}` : '';
      return `${nameList ? nameList + ' ' : ''}(${yr}). ${italic(title)}. ${jrn}.${volPart}${doiPart}`;
    }

    /* ----------------------------------------------------------------- IEEE */
    case 'ieee': {
      const nameList = (() => {
        if (!authors.length) return '';
        const fmt = (a) => {
          if (!a.first) return a.last;
          const initials = a.first.split(/[\s-]+/).map((w) => w[0]?.toUpperCase() + '.').join(' ');
          return `${initials} ${a.last}`;
        };
        if (authors.length > 6) return authors.slice(0, 6).map(fmt).join(', ') + ' et al.';
        return authors.map(fmt).join(', ');
      })();
      const volPart = volStr ? `, vol. ${volStr}${issue ? `, no. ${issue}` : ''}${pages ? `, pp. ${pages}` : ''}` : '';
      const doiPart = doi_ ? `, doi: ${doi_}` : (cleanUrl ? `, [Online]. Available: ${cleanUrl}` : '');
      return `${nameList ? nameList + ', ' : ''}"${title}," ${italic(jrn)}${volPart}, ${yr}${doiPart}.`;
    }

    /* ------------------------------------------------------------------ MLA 9 */
    case 'mla': {
      const nameList = mlaAuthorList(authors);
      const volPart = volStr ? `, vol. ${volStr}${issue ? `, no. ${issue}` : ''}${pages ? `, ${yr}, pp. ${pages}` : `, ${yr}`}` : `, ${yr}`;
      const doiPart = doiLink ? `, ${doiLink}` : '';
      return `${nameList ? nameList + '. ' : ''}"${title}." ${italic(jrn)}${volPart}${doiPart}.`;
    }

    /* --------------------------------------------------------------- Harvard */
    case 'harvard': {
      const nameList = (() => {
        if (!authors.length) return '';
        if (authors.length > 3) {
          return apaName(authors[0]) + ' et al.';
        }
        return authors.map(apaName).join(', ');
      })();
      const volPart = volStr ? `, ${volStr}${issStr}${pgStr}` : '';
      const doiPart = doi_ ? `. Available at: ${doiLink}` : (cleanUrl ? `. Available at: ${cleanUrl}` : '');
      return `${nameList ? nameList + ' ' : ''}(${yr}) '${title}', ${italic(jrn)}${volPart}${doiPart}.`;
    }

    /* --------------------------------------------------------------- Chicago (Author-Date) */
    case 'chicago': {
      const nameList = (() => {
        if (!authors.length) return '';
        const [first, ...rest] = authors;
        const firstStr = first.first ? `${first.last}, ${first.first}` : first.last;
        if (authors.length === 1) return firstStr;
        if (authors.length > 10) return firstStr + ', et al.';
        return firstStr + ', ' + rest.map(mlaNormalName).join(', ');
      })();
      const volPart = volStr ? ` ${volStr}${issue ? `, no. ${issue}` : ''}${pages ? `: ${pages}` : ''}` : '';
      const doiPart = doi_ ? `. ${doiLink}` : (cleanUrl ? `. ${cleanUrl}` : '');
      return `${nameList ? nameList + '. ' : ''}${yr}. "${title}." ${italic(jrn)}${volPart}${doiPart}.`;
    }

    /* ------------------------------------------------------------- Vancouver */
    case 'vancouver': {
      const nameList = (() => {
        if (!authors.length) return '';
        if (authors.length > 6) return authors.slice(0, 6).map(apaName).join(', ') + ', et al.';
        return authors.map(apaName).join(', ');
      })();
      const volPart = volStr
        ? `${volStr}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}`
        : '';
      const doiPart = doi_ ? ` doi: ${doi_}` : (cleanUrl ? ` Available from: ${cleanUrl}` : '');
      return `${nameList ? nameList + '. ' : ''}${title}. ${italic(jrn)}. ${yr}${volPart ? `;${volPart}` : ''}${doiPart}.`;
    }

    default:
      return formatCitation({ authorNames, year, title, journal, volume, issue, pages, doi, url, style: 'apa' });
  }
}

/**
 * Return a short illustrative example for each citation style card.
 * Uses fixed dummy data so it's always readable regardless of form state.
 */
export function styleExample(styleId) {
  const eg = {
    authorNames: ['Anika Mahekar'],
    year: 2026,
    title: 'Financial Literacy in India',
    journal: 'ShodhSutra',
    volume: 1,
    issue: 1,
    doi: '10.5281/zenodo.00000001',
    url: 'https://shodhsutra.com/journals/example',
  };
  return formatCitation({ ...eg, style: styleId });
}

/**
 * Convert a plain-text citation (with *italic* markers) to HTML.
 * Only *...* → <em>...</em> is transformed; all other HTML is escaped.
 */
export function citationToHtml(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Convert a plain-text citation to plain string (strip * markers).
 */
export function citationToText(text) {
  return text.replace(/\*/g, '');
}

/**
 * Generate a .ris file content for the given citation data.
 */
export function toRIS({ authorNames = [], year, title, journal, volume, issue, pages, doi, url }) {
  const lines = ['TY  - JOUR'];
  parseAuthors(authorNames).forEach((a) => {
    lines.push(`AU  - ${a.last}${a.first ? ', ' + a.first : ''}`);
  });
  if (title) lines.push(`TI  - ${title}`);
  if (journal) lines.push(`JO  - ${journal}`);
  if (year) lines.push(`PY  - ${year}`);
  if (volume) lines.push(`VL  - ${volume}`);
  if (issue) lines.push(`IS  - ${issue}`);
  if (pages) {
    const [sp, ep] = String(pages).split(/[-–—]/);
    if (sp) lines.push(`SP  - ${sp.trim()}`);
    if (ep) lines.push(`EP  - ${ep.trim()}`);
  }
  const d = normaliseDoi(doi);
  const cleanUrl = normaliseUrl(url);
  if (d) lines.push(`DO  - ${d}`);
  if (cleanUrl && !d) lines.push(`UR  - ${cleanUrl}`);
  lines.push('ER  -');
  return lines.join('\n');
}

