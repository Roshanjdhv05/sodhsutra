/**
 * Strips script tags, event handlers, and dangerous protocols from HTML strings.
 * Allows safe academic formatting tags: div, table, caption, thead, tbody, tr, th, td, p, strong, em, code, ul, ol, li, span, br.
 */
export function sanitizeArticleHtml(html = '') {
  if (!html) return '';
  return String(html)
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
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

