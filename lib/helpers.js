const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export const fmt = (d) => {
  const [y, m, dd] = String(d).slice(0, 10).split('-');
  return `${+dd} ${MONTHS[+m - 1]} ${y}`;
};
export const num = (n) => Number(n || 0).toLocaleString('en-US');
export const initials = (n) => String(n).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const slugify = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);
export const authorTypes = [['', 'All author types'], ['student', 'Student'], ['faculty', 'Teacher / Faculty'], ['researcher', 'Researcher']];
export const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

const BLANK_CAT = { slug: '', name: 'Uncategorised', short: 'Other', icon: 'book', desc: '' };

export function makeHelpers(D) {
  const P = D.papers, AU = D.authors, CATS = D.categories;
  const cat = (s) => CATS.find((c) => c.slug === s) || BLANK_CAT;
  const author = (s) => AU.find((a) => a.slug === s) || { slug: s, name: 'Unknown author', type: 'researcher', designation: '', inst: '', dept: '', interests: [], bio: '' };
  const authorNames = (p) => p.authors.map((s) => author(s).name).join(', ');
  const papersByAuthor = (s) => P.filter((p) => p.authors.includes(s));
  const inCat = (p, s) => p.cat === s || p.cat2 === s;
  const hasType = (p, t) => p.authors.some((s) => author(s).type === t);
  const years = (list) => [...new Set(list.map((p) => p.year))].sort().reverse();
  const sortFn = { latest: byDate, read: (a, b) => b.views - a.views, title: (a, b) => a.title.localeCompare(b.title) };

  function hay(p) {
    return { t: p.title.toLowerCase(), k: p.keywords.join(' ').toLowerCase(), a: authorNames(p).toLowerCase(), c: (cat(p.cat).name + ' ' + (p.cat2 ? cat(p.cat2).name : '')).toLowerCase(), i: (p.inst || '').toLowerCase(), ab: (p.abstract || '').toLowerCase() };
  }
  function search(q, list) {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean); list = list || P;
    if (!toks.length) return list.slice();
    return list.map((p) => {
      const h = hay(p); let sc = 0;
      for (const t of toks) {
        let s = 0;
        if (h.t.includes(t)) s += 5; if (h.k.includes(t)) s += 3; if (h.a.includes(t)) s += 3;
        if (h.c.includes(t)) s += 2; if (h.i.includes(t)) s += 2; if (h.ab.includes(t)) s += 1;
        if (!s) return null; sc += s;
      }
      return { p, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc || b.p.views - a.p.views).map((x) => x.p);
  }
  function searchAuthors(q) {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean); if (!toks.length) return [];
    return AU.filter((a) => { const h = (a.name + ' ' + a.inst + ' ' + a.interests.join(' ') + ' ' + a.dept + ' ' + a.designation).toLowerCase(); return toks.every((t) => h.includes(t)); });
  }
  function searchNews(q) {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean); const N = D.news;
    if (!toks.length) return N.slice();
    return N.filter((n) => { const h = (n.title + ' ' + n.summary + ' ' + n.cat).toLowerCase(); return toks.every((t) => h.includes(t)); });
  }
  const related = (p, k = 3) => P.filter((x) => x.id !== p.id)
    .map((x) => ({ x, s: (inCat(x, p.cat) ? 2 : 0) + x.keywords.filter((w) => p.keywords.includes(w)).length * 2 + (x.authors.some((a) => p.authors.includes(a)) ? 2 : 0) }))
    .filter((o) => o.s > 0).sort((a, b) => b.s - a.s || b.x.views - a.x.views).slice(0, k).map((o) => o.x);

  return { fmt, num, cat, author, authorNames, papersByAuthor, inCat, hasType, years, sortFn, search, searchAuthors, searchNews, related, byDate, initials };
}
