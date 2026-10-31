import { PDFParse } from 'pdf-parse';

/**
 * Strips script tags, event handlers, and dangerous protocols from HTML strings.
 * Allows safe academic formatting tags: div, table, caption, thead, tbody, tr, th, td, p, strong, em, code, ul, ol, li, span, br.
 */
export function sanitizeArticleHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:(?!image\/)/gi, '');
}

/**
 * Converts a string to a clean URL-friendly anchor slug.
 */
export function slugifyId(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Detects whether a string looks like a row of table cells.
 */
function splitRowCells(line = '') {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // Pipe separated
  if (trimmed.includes('|')) {
    return trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c !== '---' && !/^:?-+:?$/.test(c));
  }

  // Tab separated
  if (trimmed.includes('\t')) {
    return trimmed.split('\t').map((c) => c.trim()).filter(Boolean);
  }

  // Multiple consecutive spaces (2 or more)
  const parts = trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  if (parts.length > 1) return parts;

  // Heuristic for label + numbers/percentages at end
  const numMatch = trimmed.match(/^([A-Za-z\s&/\-–—()]+?)\s+(\d+[\.\d]*%?)\s+([\d\.\-–—]+%?)\s*(.*)$/);
  if (numMatch) {
    return [numMatch[1].trim(), numMatch[2].trim(), numMatch[3].trim(), numMatch[4].trim()].filter(Boolean);
  }

  return [];
}

/**
 * Converts detected table text into a clean HTML table.
 */
export function convertTextTableToHtml(tableText = '', caption = '') {
  const lines = tableText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^[-_=\s|]{3,}$/.test(l));

  if (lines.length < 2) return '';

  const headerCells = splitRowCells(lines[0]);
  if (!headerCells || headerCells.length < 2) return '';

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRowCells(lines[i]);
    if (cells && cells.length > 0) {
      // Pad or trim to match header length if close
      if (cells.length === 1 && rows.length > 0) {
        // Append to last cell as note
        rows[rows.length - 1][rows[rows.length - 1].length - 1] += ` ${cells[0]}`;
      } else {
        rows.push(cells);
      }
    }
  }

  if (rows.length === 0) return '';

  let html = '<div class="article-table-wrap">\n';
  html += '  <table class="article-table">\n';
  if (caption) {
    html += `    <caption>${sanitizeArticleHtml(caption)}</caption>\n`;
  }
  html += '    <thead>\n      <tr>';
  headerCells.forEach((h) => {
    html += `<th>${sanitizeArticleHtml(h)}</th>`;
  });
  html += '</tr>\n    </thead>\n    <tbody>\n';
  rows.forEach((r) => {
    html += '      <tr>';
    r.forEach((cell) => {
      html += `<td>${sanitizeArticleHtml(cell)}</td>`;
    });
    html += '</tr>\n';
  });
  html += '    </tbody>\n  </table>\n</div>';
  return html;
}

/**
 * Main server-side PDF extraction function.
 * Extracts title, authors, abstract, keywords, sections, tables, references, and scans status.
 *
 * @param {Buffer} buffer - Raw PDF buffer
 * @param {string} [originalFilename] - Original filename for fallback
 * @returns {Promise<object>} Extracted metadata, sections, and structured full text
 */
export async function extractPaperFromPdfBuffer(buffer, originalFilename = '') {
  let parser = null;
  let rawText = '';
  let info = {};
  let totalPages = 1;

  try {
    parser = new PDFParse({ data: buffer });
    await parser.load();
    const textObj = await parser.getText();
    const infoObj = await parser.getInfo();
    rawText = textObj?.text || '';
    info = infoObj?.info || {};
    totalPages = infoObj?.total || 1;
  } catch (err) {
    console.error('PDFParse extraction error:', err?.message || err);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {}
    }
  }

  // Clean out PDF page marks
  const cleanText = rawText.replace(/-- \d+ of \d+ --/g, '').trim();

  // 1. Scanned / image-only PDF detection
  if (cleanText.length < 80) {
    let fallbackTitle = (info?.Title || '').trim();
    if (!fallbackTitle || fallbackTitle.toLowerCase().includes('untitled') || fallbackTitle.startsWith('Microsoft Word')) {
      fallbackTitle = originalFilename.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || 'Uploaded Manuscript';
    }
    return {
      isScanned: true,
      ocrRequired: true,
      message: 'This PDF appears to be a scanned document or contains image-only text. Selectable text could not be extracted; OCR is required to extract editable article content.',
      title: fallbackTitle,
      abstract: '',
      keywords: [],
      authors: [{ name: '', institution: '', designation: '' }],
      sections: [],
      tablesCount: 0,
      refs: [],
      full_text: '',
      rawText: cleanText,
    };
  }

  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 2. Title detection
  let title = '';
  if (
    info?.Title &&
    info.Title.trim() &&
    !info.Title.toLowerCase().includes('untitled') &&
    !info.Title.toLowerCase().startsWith('microsoft word')
  ) {
    title = info.Title.trim();
  } else {
    const titleCandidates = [];
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      if (/^(abstract|keywords|key words|by|author|dr\.|prof\.|1[\.\s]|introduction)/i.test(line)) break;
      if (/^(issn|isbn|vol\.|journal|http|volume|doi:|page|\d+)/i.test(line)) continue;
      titleCandidates.push(line);
      if (titleCandidates.length >= 2) break;
    }
    title = titleCandidates.join(' ').slice(0, 250).trim();
  }
  if (!title && originalFilename) {
    title = originalFilename.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
  }

  // 3. Authors detection (text between title and abstract/keywords)
  const authors = [];
  const titleSnippet = title.slice(0, 30).toLowerCase();
  const titleIdx = lines.findIndex((l) => l.toLowerCase().includes(titleSnippet));
  const absIdx = lines.findIndex((l) => /^abstract\b/i.test(l));
  const candidateAuthorLines = lines.slice(Math.max(0, titleIdx + 1), absIdx > 0 ? absIdx : 7);

  candidateAuthorLines.forEach((line) => {
    if (/^(issn|isbn|vol\.|http|doi|page|copyright|submitted|received|accepted|university of|department of)/i.test(line)) {
      // If it's an institution line for the previous author, append it
      if (authors.length > 0 && !authors[authors.length - 1].institution) {
        authors[authors.length - 1].institution = line.replace(/^(department of|university of)\s*/i, '').trim();
      }
      return;
    }

    const parts = line.split(/[,;\t|]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      const name = parts[0];
      const inst = parts.slice(1).join(', ') || '';
      const desigMatch = line.match(/\b(professor|dr\.|student|researcher|lecturer|associate professor|assistant professor|dean|scholar|fellow)\b/i);
      const designation = desigMatch ? desigMatch[0] : '';
      if (name.length >= 2 && name.length <= 80 && !/\b(abstract|keywords|table|figure)\b/i.test(name)) {
        authors.push({ name, institution: inst, designation });
      }
    }
  });

  if (authors.length === 0) {
    authors.push({ name: '', institution: '', designation: '' });
  }

  // 4. Abstract detection
  let abstract = '';
  const absMatch = cleanText.match(
    /(?:^|\n)\s*(?:ABSTRACT|Abstract)\s*[:\-\—]?\s*\n?([\s\S]*?)(?=(?:\n\s*(?:(?:keywords|key words|index terms)|(?:(?:1[\.\s]+)?(?:introduction|background)))|\n\n\n\n|$))/i
  );
  if (absMatch && absMatch[1]) {
    abstract = absMatch[1].replace(/^(?:Abstract|ABSTRACT)[:\-\—]?\s*/, '').trim();
  }

  // 5. Keywords detection
  const keywords = [];
  const kwMatch = cleanText.match(
    /(?:^|\n)\s*(?:KEYWORDS|Keywords|Key words|Index Terms)\s*[:\-\—]\s*([^\n\r]+)/i
  );
  if (kwMatch && kwMatch[1]) {
    const rawKw = kwMatch[1].replace(/^(?:keywords|key words|index terms)[:\-\—]\s*/i, '').trim();
    rawKw.split(/[,;•·]+/).forEach((k) => {
      const cleaned = k.trim().replace(/^[-–—]\s*/, '').replace(/\.$/, '');
      if (cleaned.length > 1 && cleaned.length < 60) keywords.push(cleaned);
    });
  }

  // 6. Table detection: Find table blocks and convert them to HTML
  let processedText = cleanText;
  let tablesCount = 0;
  const tableBlockRegex = /(?:^|\n)(?:(Table|TABLE)\s*(\d+)[:.]?\s*([^\n\r]*))\n([\s\S]*?)(?=(?:\n\s*(?:(?:Table|TABLE)\s*\d+|(?:(?:[0-9IVX]+[\.\s]+)?[A-Z][A-Za-z0-9\s]{2,40}))|\n\n\n|$))/g;

  processedText = processedText.replace(tableBlockRegex, (match, pfx, num, captionText, tableBody) => {
    const fullCaption = `${pfx} ${num}: ${captionText.trim()}`.trim();
    const tableHtml = convertTextTableToHtml(tableBody.trim(), fullCaption);
    if (tableHtml) {
      tablesCount++;
      return `\n\n${tableHtml}\n\n`;
    }
    return match;
  });

  // 7. Academic section detection with variations
  const sectionPatterns = [
    { key: 'introduction', pattern: /^(?:(?:1|I)[\.\s]+)?(?:Introduction|Background|Overview|Context)\b/i, defaultTitle: 'Introduction' },
    { key: 'literature-review', pattern: /^(?:(?:2|II)[\.\s]+)?(?:Literature Review|Related Work|Prior Work|Review of Literature|Theoretical Background|Conceptual Framework)\b/i, defaultTitle: 'Literature Review' },
    { key: 'methodology', pattern: /^(?:(?:3|III)[\.\s]+)?(?:Methodology|Research Methodology|Methods|Materials and Methods|Data and Methodology|Experimental Setup|Approach)\b/i, defaultTitle: 'Methodology' },
    { key: 'results-discussion', pattern: /^(?:(?:4|IV)[\.\s]+)?(?:Results and Discussion|Results|Findings|Empirical Results|Data Analysis|Discussion|Evaluation)\b/i, defaultTitle: 'Results and Discussion' },
    { key: 'conclusion', pattern: /^(?:(?:5|V)[\.\s]+)?(?:Conclusion|Conclusions|Concluding Remarks|Summary and Conclusion|Limitations and Future Scope)\b/i, defaultTitle: 'Conclusion' },
    { key: 'references', pattern: /^(?:(?:6|VI|7|VII)[\.\s]+)?(?:References|Bibliography|Works Cited|Literature Cited)\b/i, defaultTitle: 'References' },
  ];

  const headingRegex = /(?:^|\n)(?:([0-9IVX]+[\.\s]+)?([A-Z][A-Za-z0-9\s,/\-–—&]{2,55}))(?=\n|$)/g;
  const headingMatches = [...processedText.matchAll(headingRegex)];

  const validHeadings = [];
  headingMatches.forEach((m) => {
    const rawHeading = m[0].trim();
    const numPart = m[1]?.trim() || '';
    const textPart = m[2]?.trim() || '';

    // Ignore title, abstract, keywords matches as section headings
    if (new RegExp(title.slice(0, 25), 'i').test(rawHeading)) return;
    if (/^(abstract|keywords|key words|table|figure)\b/i.test(rawHeading)) return;

    const matchesStandard = sectionPatterns.some((sp) => sp.pattern.test(rawHeading) || sp.pattern.test(textPart));
    const isNumberedHeading = Boolean(numPart) && textPart.length > 2 && textPart.length < 50;

    if (matchesStandard || isNumberedHeading) {
      validHeadings.push({
        match: m,
        title: rawHeading,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  });

  const sections = [];
  if (validHeadings.length > 0) {
    validHeadings.forEach((h, idx) => {
      const contentStart = h.end;
      const contentEnd = idx + 1 < validHeadings.length ? validHeadings[idx + 1].start : processedText.length;
      let body = processedText.slice(contentStart, contentEnd).trim();
      body = body.replace(/-- \d+ of \d+ --/g, '').trim();

      const id = slugifyId(h.title);
      sections.push({
        id,
        title: h.title,
        content: body,
      });
    });
  } else {
    // If no explicit section headers detected, preserve the full text safely
    const leftover = processedText.replace(title, '').replace(abstract, '').trim();
    sections.push({
      id: 'article-body',
      title: 'Article Content',
      content: leftover,
    });
  }

  // 8. References extraction
  const refs = [];
  const refSec = sections.find((s) => /references|bibliography|works cited/i.test(s.title));
  if (refSec && refSec.content) {
    const rawRefs = refSec.content.split(/\n(?=\[\d+\]|\d+\.|\b[A-Z][a-z]+,\s+[A-Z]\.)/);
    rawRefs.forEach((r) => {
      const cleaned = r.trim().replace(/^\[\d+\]\s*/, '').replace(/^\d+[\.\s]+\s*/, '');
      if (cleaned.length > 10) refs.push(cleaned);
    });
  }

  // 9. Assemble formatted full_text
  const fullTextParts = sections
    .filter((s) => !/references|bibliography|works cited/i.test(s.title))
    .map((s) => `## ${s.title}\n\n${s.content}`);
  const full_text = fullTextParts.join('\n\n\n');

  return {
    isScanned: false,
    ocrRequired: false,
    message: null,
    title,
    abstract,
    keywords,
    authors,
    sections,
    tablesCount,
    refs,
    full_text,
    rawText: cleanText,
  };
}

