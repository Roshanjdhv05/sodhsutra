'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, ICON_NAMES } from './Icon';
import CoverUpload from './CoverUpload';
import {
  adminLogin, adminLogout, saveCategory, deleteCategory, saveAuthor, deleteAuthor, savePaper, deletePaper,
  saveNews, deleteNews, setSubmissionStatus, deleteSubmission, publishSubmission, deleteMessage,
} from '@/app/admin/actions';
import { fmt, slugify } from '@/lib/helpers';

const CONTENT_TYPES = ['Original Research', 'Review Article', 'Essay', 'Policy Analysis', 'Case Study'];
const FORMATS = [['emp', 'Original / empirical'], ['rev', 'Review'], ['ess', 'Essay / policy'], ['cas', 'Case study']];
const AUTHOR_TYPES = [['student', 'Student'], ['faculty', 'Teacher / Faculty'], ['researcher', 'Researcher']];
const STYLES = ['Rings', 'Waves', 'Dot field', 'Diagonals', 'Triangles', 'Burst', 'Bars', 'Orbits'];
const THEMES = ['Orange', 'Peach', 'Charcoal', 'Amber', 'White', 'Burnt orange'];
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- small building blocks ---------- */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k); document.body.classList.add('lock');
    return () => { document.removeEventListener('keydown', k); document.body.classList.remove('lock'); };
  }, [onClose]);
  return (
    <div className="overlay admin-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <button className="overlay-close icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
const F = ({ id, label, hint, children, full }) => (
  <div className={`field ${full ? 'full' : ''}`}><label htmlFor={id}>{label}</label>{children}{hint ? <small className="hint">{hint}</small> : null}</div>
);
function FormFoot({ busy, err, onClose, label = 'Save' }) {
  return (
    <>
      {err ? <p className="msg-err" role="alert">{err}</p> : null}
      <div className="row"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : label}</button><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
    </>
  );
}
const Thumb = ({ url }) => (url ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="mini-thumb" src={url} alt="" /> : <span className="mini-thumb" style={{ background: 'var(--o1)' }} />);

/* ---------- login ---------- */
export function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await adminLogin(pw);
    setBusy(false);
    if (r.ok) router.refresh(); else setErr(r.error);
  }
  return (
    <div className="container">
      <form className="login-card" onSubmit={go}>
        <p className="eyebrow"><Icon name="lock" size={14} /> Admin</p>
        <h1 style={{ fontSize: '2rem' }}>Sign in</h1>
        <p className="muted">Enter the admin password from your <code>.env</code> file.</p>
        <div className="field"><label htmlFor="adm-pw">Password</label><input id="adm-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></div>
        {err ? <p className="msg-err" role="alert">{err}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !pw}>{busy ? 'Checking…' : 'Log in'}</button>
      </form>
    </div>
  );
}

/* ---------- forms ---------- */
function CategoryForm({ row, onSave, onClose }) {
  const [f, setF] = useState(() => ({ name: '', short_name: '', slug: '', icon: 'book', description: '', sort_order: 0, ...(row || {}) }));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  async function submit(e) { e.preventDefault(); setBusy(true); setErr(''); const r = await onSave({ ...f, id: row?.id }); setBusy(false); if (!r.ok) setErr(r.error); }
  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <F id="c-name" label="Category name *"><input id="c-name" className="input" value={f.name} onChange={(e) => { set('name', e.target.value); if (!row && !f._slugEdited) set('slug', slugify(e.target.value)); }} autoFocus /></F>
        <F id="c-short" label="Short name" hint="Used on cards and chips. Defaults to the full name."><input id="c-short" className="input" value={f.short_name} onChange={(e) => set('short_name', e.target.value)} /></F>
        <F id="c-slug" label="URL slug" hint="/categories/your-slug — leave as is unless you need a custom one."><input id="c-slug" className="input" value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: slugify(e.target.value), _slugEdited: true }))} /></F>
        <F id="c-order" label="Sort order" hint="Lower numbers appear first."><input id="c-order" className="input" type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></F>
        <F id="c-icon" label="Icon" full>
          <div className="iconpick" role="group" aria-label="Icon">
            {ICON_NAMES.map((n) => <button type="button" key={n} className={f.icon === n ? 'on' : ''} onClick={() => set('icon', n)} aria-label={n} aria-pressed={f.icon === n}><Icon name={n} size={20} /></button>)}
          </div>
        </F>
        <F id="c-desc" label="Description" full><textarea id="c-desc" className="input" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} /></F>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save category' : 'Create category'} />
    </form>
  );
}

function AuthorForm({ row, onSave, onClose }) {
  const [f, setF] = useState(() => ({ name: '', slug: '', type: 'researcher', designation: '', institution: '', department: '', bio: '', photo_url: '', ...(row || {}), interests: (row?.interests || []).join(', ') }));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  async function submit(e) { e.preventDefault(); setBusy(true); setErr(''); const r = await onSave({ ...f, id: row?.id }); setBusy(false); if (!r.ok) setErr(r.error); }
  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <F id="a-name" label="Name *"><input id="a-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus /></F>
        <F id="a-type" label="Author type *"><select id="a-type" className="select" value={f.type} onChange={(e) => set('type', e.target.value)}>{AUTHOR_TYPES.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></F>
        <F id="a-desig" label="Designation"><input id="a-desig" className="input" value={f.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. Associate Professor" /></F>
        <F id="a-inst" label="Institution"><input id="a-inst" className="input" value={f.institution} onChange={(e) => set('institution', e.target.value)} /></F>
        <F id="a-dept" label="Department"><input id="a-dept" className="input" value={f.department} onChange={(e) => set('department', e.target.value)} /></F>
        <F id="a-slug" label="URL slug" hint="Blank = generated from the name."><input id="a-slug" className="input" value={f.slug} onChange={(e) => set('slug', e.target.value)} /></F>
        <F id="a-int" label="Research interests" hint="Comma separated." full><input id="a-int" className="input" value={f.interests} onChange={(e) => set('interests', e.target.value)} /></F>
        <F id="a-photo" label="Photo URL (optional)" hint="Leave blank to show initials." full><input id="a-photo" className="input" type="url" value={f.photo_url || ''} onChange={(e) => set('photo_url', e.target.value)} placeholder="https://" /></F>
        <F id="a-bio" label="Biography" full><textarea id="a-bio" className="input" rows={4} value={f.bio} onChange={(e) => set('bio', e.target.value)} /></F>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save author' : 'Create author'} />
    </form>
  );
}

function PaperForm({ row, data, onSave, onClose }) {
  const n = data.papers.length;
  const [f, setF] = useState(() => ({
    title: '', slug: '', abstract: '', category_slug: data.categories[0]?.slug || '', category2_slug: '', authorIds: [], published_on: today(), keywords: '',
    views: 0, content_type: 'Original Research', format: 'emp', institution: '', featured: false, doi: '', peer_reviewed: false, is_demo: false,
    paper_url: '', cover_url: '', art_style: (n * 5 + 1) % 8, art_theme: (n * 7 + 2) % 6, art_seed: n + 1, full_text: '', refs_text: '',
    ...(row ? { ...row, category2_slug: row.category2_slug || '', doi: row.doi || '', paper_url: row.paper_url || '', cover_url: row.cover_url || '', institution: row.institution || '', published_on: String(row.published_on).slice(0, 10), keywords: (row.keywords || []).join(', '), full_text: row.full_text || '', refs_text: (row.refs || []).join('\n') } : {}),
  }));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const pick = (id) => setF((s) => ({ ...s, authorIds: s.authorIds.includes(id) ? s.authorIds.filter((x) => x !== id) : [...s.authorIds, id] }));
  async function submit(e) { e.preventDefault(); setBusy(true); setErr(''); const r = await onSave({ ...f, id: row?.id }); setBusy(false); if (!r.ok) setErr(r.error); }
  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <F id="p-title" label="Title *" full><input id="p-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} autoFocus /></F>
        <F id="p-abs" label="Abstract *" full><textarea id="p-abs" className="input" rows={5} value={f.abstract} onChange={(e) => set('abstract', e.target.value)} /></F>
        <F id="p-cat" label="Category *"><select id="p-cat" className="select" value={f.category_slug} onChange={(e) => set('category_slug', e.target.value)}>{data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></F>
        <F id="p-cat2" label="Second category (optional)"><select id="p-cat2" className="select" value={f.category2_slug} onChange={(e) => set('category2_slug', e.target.value)}><option value="">None</option>{data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></F>
        <F id="p-auth" label="Authors * (the order you tick them is the order shown)" full>
          <div className="pickbox" id="p-auth">
            {data.authors.map((a) => { const i = f.authorIds.indexOf(a.id); return (
              <label key={a.id}><input type="checkbox" checked={i >= 0} onChange={() => pick(a.id)} /> {a.name} <small className="muted">· {a.institution || '—'}</small>{i >= 0 ? <span className="ord">{i + 1}</span> : null}</label>
            ); })}
            {!data.authors.length ? <span className="muted">No authors yet — add one in the Authors tab first.</span> : null}
          </div>
        </F>
        <F id="p-date" label="Publication date *"><input id="p-date" className="input" type="date" value={f.published_on} onChange={(e) => set('published_on', e.target.value)} /></F>
        <F id="p-inst" label="Institution" hint="Blank = first author’s institution."><input id="p-inst" className="input" value={f.institution} onChange={(e) => set('institution', e.target.value)} /></F>
        <F id="p-type" label="Content type"><select id="p-type" className="select" value={f.content_type} onChange={(e) => set('content_type', e.target.value)}>{CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F id="p-format" label="Page layout" hint="Decides the section outline of demo text."><select id="p-format" className="select" value={f.format} onChange={(e) => set('format', e.target.value)}>{FORMATS.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></F>
        <F id="p-kw" label="Keywords" hint="Comma separated." full><input id="p-kw" className="input" value={f.keywords} onChange={(e) => set('keywords', e.target.value)} /></F>
        <F id="p-link" label="Paper link" hint="Public link to the manuscript (Drive, arXiv, …). Shown as “Open Paper Link”." full><input id="p-link" className="input" type="url" value={f.paper_url} onChange={(e) => set('paper_url', e.target.value)} placeholder="https://" /></F>
        <div className="full"><CoverUpload id="p-cover" label="Cover image (auto-compressed to under 10 KB)" value={f.cover_url} onChange={(u) => set('cover_url', u)} /></div>
        <F id="p-style" label="Generated art style" hint="Used when no cover image is uploaded."><select id="p-style" className="select" value={f.art_style} onChange={(e) => set('art_style', +e.target.value)}>{STYLES.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></F>
        <F id="p-theme" label="Cover colour"><select id="p-theme" className="select" value={f.art_theme} onChange={(e) => set('art_theme', +e.target.value)}>{THEMES.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></F>
        <F id="p-views" label="Views"><input id="p-views" className="input" type="number" min="0" value={f.views} onChange={(e) => set('views', e.target.value)} /></F>
        <F id="p-doi" label="DOI (only if verified)"><input id="p-doi" className="input" value={f.doi} onChange={(e) => set('doi', e.target.value)} placeholder="10.xxxx/xxxxx" /></F>
        <F id="p-text" label="Full text (optional)" hint="Separate paragraphs with a blank line. Leave empty to show only the abstract and link." full><textarea id="p-text" className="input" rows={6} value={f.full_text} onChange={(e) => set('full_text', e.target.value)} /></F>
        <F id="p-refs" label="References (optional)" hint="One reference per line." full><textarea id="p-refs" className="input" rows={3} value={f.refs_text} onChange={(e) => set('refs_text', e.target.value)} /></F>
        <div className="full">
          <div className="field check"><label><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured on the home page hero (only one paper can be featured)</label></div>
          <div className="field check"><label><input type="checkbox" checked={f.peer_reviewed} onChange={(e) => set('peer_reviewed', e.target.checked)} /> Peer review verified</label></div>
          <div className="field check"><label><input type="checkbox" checked={f.is_demo} onChange={(e) => set('is_demo', e.target.checked)} /> Demonstration / sample record (shows “demonstration” notices and placeholder text)</label></div>
        </div>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save paper' : 'Publish paper'} />
    </form>
  );
}

function NewsForm({ row, data, onSave, onClose }) {
  const [f, setF] = useState(() => ({
    title: '', slug: '', summary: '', category: data.news[0]?.category || 'Science Culture', published_on: today(), body_text: '', related_paper_slug: '', byline: 'ShodhSutra Editorial Desk',
    art_style: (data.news.length * 3 + 2) % 8, art_theme: data.news.length % 6, art_seed: 100 + data.news.length, cover_url: '', is_demo: false,
    ...(row ? { ...row, related_paper_slug: row.related_paper_slug || '', cover_url: row.cover_url || '', byline: row.byline || '', published_on: String(row.published_on).slice(0, 10), body_text: (row.body || []).join('\n\n') } : {}),
  }));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const cats = [...new Set(data.news.map((n) => n.category))];
  async function submit(e) { e.preventDefault(); setBusy(true); setErr(''); const r = await onSave({ ...f, id: row?.id }); setBusy(false); if (!r.ok) setErr(r.error); }
  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <F id="n-title" label="Headline *" full><input id="n-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} autoFocus /></F>
        <F id="n-sum" label="Summary *" full><textarea id="n-sum" className="input" rows={2} value={f.summary} onChange={(e) => set('summary', e.target.value)} /></F>
        <F id="n-cat" label="News category *"><input id="n-cat" className="input" list="n-cats" value={f.category} onChange={(e) => set('category', e.target.value)} /><datalist id="n-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></F>
        <F id="n-date" label="Date *"><input id="n-date" className="input" type="date" value={f.published_on} onChange={(e) => set('published_on', e.target.value)} /></F>
        <F id="n-by" label="Byline"><input id="n-by" className="input" value={f.byline} onChange={(e) => set('byline', e.target.value)} /></F>
        <F id="n-rel" label="Related paper (optional)"><select id="n-rel" className="select" value={f.related_paper_slug} onChange={(e) => set('related_paper_slug', e.target.value)}><option value="">None</option>{data.papers.map((p) => <option key={p.id} value={p.slug}>{p.title.slice(0, 70)}</option>)}</select></F>
        <F id="n-body" label="Article text" hint="Separate paragraphs with a blank line." full><textarea id="n-body" className="input" rows={7} value={f.body_text} onChange={(e) => set('body_text', e.target.value)} /></F>
        <div className="full"><CoverUpload id="n-cover" label="Thumbnail image (auto-compressed to under 10 KB)" value={f.cover_url} onChange={(u) => set('cover_url', u)} /></div>
        <F id="n-style" label="Generated art style"><select id="n-style" className="select" value={f.art_style} onChange={(e) => set('art_style', +e.target.value)}>{STYLES.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></F>
        <F id="n-theme" label="Colour"><select id="n-theme" className="select" value={f.art_theme} onChange={(e) => set('art_theme', +e.target.value)}>{THEMES.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></F>
        <div className="full field check"><label><input type="checkbox" checked={f.is_demo} onChange={(e) => set('is_demo', e.target.checked)} /> Sample article (shows a “sample” notice)</label></div>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save article' : 'Publish article'} />
    </form>
  );
}

/* ---------- main ---------- */
export default function AdminApp({ data }) {
  const router = useRouter();
  const [tab, setTab] = useState('papers');
  const [modal, setModal] = useState(null);          // { kind, row }
  const [flash, setFlash] = useState(null);
  const [q, setQ] = useState('');
  const catName = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.slug, c.name])), [data.categories]);
  const authorName = useMemo(() => Object.fromEntries(data.authors.map((a) => [a.id, a.name])), [data.authors]);
  const pending = data.submissions.filter((x) => x.status === 'received').length;

  useEffect(() => { if (!flash) return undefined; const t = setTimeout(() => setFlash(null), 5000); return () => clearTimeout(t); }, [flash]);
  useEffect(() => { setQ(''); }, [tab]);

  async function save(fn, payload, msg) {
    const r = await fn(payload);
    if (r.ok) { setModal(null); setFlash({ ok: msg }); router.refresh(); }
    return r;
  }
  async function remove(fn, id, what) {
    if (!window.confirm(`Delete this ${what}? This cannot be undone.`)) return;
    const r = await fn(id);
    if (r.ok) { setFlash({ ok: `${what[0].toUpperCase()}${what.slice(1)} deleted.` }); router.refresh(); } else setFlash({ err: r.error });
  }
  async function simple(fn, ...args) {
    const r = await fn(...args);
    if (r.ok) { setFlash({ ok: 'Done.' }); router.refresh(); } else setFlash({ err: r.error });
  }
  async function logout() { await adminLogout(); router.refresh(); }

  const match = (text) => !q.trim() || text.toLowerCase().includes(q.trim().toLowerCase());
  const tabs = [['papers', 'Papers', data.papers.length], ['categories', 'Categories', data.categories.length], ['authors', 'Authors', data.authors.length], ['news', 'News', data.news.length], ['submissions', 'Submissions', pending || data.submissions.length], ['messages', 'Messages', data.messages.length]];

  const searchBox = <div className="search-box small"><Icon name="search" size={18} /><label className="sr" htmlFor="adm-q">Filter</label><input id="adm-q" type="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} /></div>;

  return (
    <div className="container admin-wrap">
      <div className="admin-top">
        <div><p className="eyebrow">Admin</p><h1>Dashboard</h1></div>
        <div className="row" style={{ margin: 0 }}><a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener noreferrer">View site</a><button className="btn btn-ghost btn-sm" onClick={logout}><Icon name="logout" size={16} /> Log out</button></div>
      </div>
      <div className="admin-stats">
        {[['Papers', data.papers.length], ['Categories', data.categories.length], ['Authors', data.authors.length], ['News', data.news.length], ['New submissions', pending]].map(([l, v]) => <div className="admin-stat" key={l}><strong>{v}</strong><span>{l}</span></div>)}
      </div>
      {flash?.ok ? <p className="msg-ok" role="status">{flash.ok}</p> : null}
      {flash?.err ? <p className="msg-err" role="alert">{flash.err}</p> : null}

      <div className="tabs" role="tablist">
        {tabs.map(([k, l, c]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l} <em>{c}</em></button>)}
      </div>

      {tab === 'papers' && (
        <section>
          <div className="panel-head"><h2>Papers</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'paper', row: null })}><Icon name="plus" size={16} /> New paper</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Cover</th><th>Title</th><th>Category</th><th>Authors</th><th>Date</th><th>Views</th><th>Flags</th><th /></tr></thead><tbody>
            {data.papers.filter((p) => match(p.title + ' ' + p.slug)).sort((a, b) => (a.published_on < b.published_on ? 1 : -1)).map((p) => (
              <tr key={p.id}>
                <td><Thumb url={p.cover_url} /></td>
                <td className="ttl">{p.title}<span className="sub">/journals/{p.slug}</span></td>
                <td>{catName[p.category_slug] || p.category_slug}</td>
                <td>{p.authorIds.map((i) => authorName[i]).filter(Boolean).join(', ')}</td>
                <td>{fmt(p.published_on)}</td><td>{p.views}</td>
                <td>{p.featured ? <span className="pill">Featured</span> : null} {p.is_demo ? <span className="pill warn">Demo</span> : <span className="pill ok">Live</span>}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'paper', row: p })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deletePaper, p.id, 'paper')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'categories' && (
        <section>
          <div className="panel-head"><h2>Categories</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'category', row: null })}><Icon name="plus" size={16} /> New category</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Icon</th><th>Name</th><th>Slug</th><th>Papers</th><th>Order</th><th /></tr></thead><tbody>
            {data.categories.filter((c) => match(c.name + ' ' + c.slug)).map((c) => (
              <tr key={c.id}>
                <td><Icon name={c.icon} size={22} /></td>
                <td className="ttl">{c.name}<span className="sub">{c.description}</span></td><td>{c.slug}</td>
                <td>{data.papers.filter((p) => p.category_slug === c.slug || p.category2_slug === c.slug).length}</td><td>{c.sort_order}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'category', row: c })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deleteCategory, c.id, 'category')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'authors' && (
        <section>
          <div className="panel-head"><h2>Authors</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'author', row: null })}><Icon name="plus" size={16} /> New author</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Name</th><th>Type</th><th>Institution</th><th>Papers</th><th /></tr></thead><tbody>
            {data.authors.filter((a) => match(a.name + ' ' + (a.institution || ''))).map((a) => (
              <tr key={a.id}>
                <td className="ttl">{a.name}<span className="sub">{a.designation}</span></td><td>{a.type}</td><td>{a.institution}</td>
                <td>{data.papers.filter((p) => p.authorIds.includes(a.id)).length}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'author', row: a })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deleteAuthor, a.id, 'author')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'news' && (
        <section>
          <div className="panel-head"><h2>News</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'news', row: null })}><Icon name="plus" size={16} /> New article</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Thumb</th><th>Headline</th><th>Category</th><th>Date</th><th /></tr></thead><tbody>
            {data.news.filter((n) => match(n.title)).sort((a, b) => (a.published_on < b.published_on ? 1 : -1)).map((n) => (
              <tr key={n.id}>
                <td><Thumb url={n.cover_url} /></td><td className="ttl">{n.title}<span className="sub">/news/{n.slug}</span></td><td>{n.category}</td><td>{fmt(n.published_on)}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'news', row: n })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deleteNews, n.id, 'article')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'submissions' && (
        <section>
          <div className="panel-head"><h2>Submissions</h2></div>
          <p className="muted">Papers sent through the public Submit page. “Approve & publish” creates the author(s) and a live paper using the submitted link and cover; you can edit it afterwards.</p>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Cover</th><th>Paper</th><th>Author</th><th>Category</th><th>Status</th><th>Received</th><th /></tr></thead><tbody>
            {data.submissions.map((s) => (
              <tr key={s.id}>
                <td><Thumb url={s.cover_url} /></td>
                <td className="ttl">{s.title}<span className="sub"><a href={s.paper_url} target="_blank" rel="noopener noreferrer">Open paper link ↗</a></span></td>
                <td>{s.author_name}<span className="sub">{s.author_email}</span></td><td>{catName[s.category_slug] || s.category_slug}</td>
                <td><span className={`pill ${s.status === 'published' ? 'ok' : s.status === 'rejected' ? '' : 'warn'}`}>{s.status}</span></td><td>{fmt(String(s.created_at).slice(0, 10))}</td>
                <td><div className="acts">
                  {s.status !== 'published' ? <button className="btn btn-primary btn-sm" onClick={() => simple(publishSubmission, s.id)}><Icon name="check" size={15} /> Approve &amp; publish</button> : null}
                  {s.status === 'received' ? <button className="btn btn-ghost btn-sm" onClick={() => simple(setSubmissionStatus, s.id, 'rejected')}>Reject</button> : null}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(deleteSubmission, s.id, 'submission')}><Icon name="trash" size={15} /></button>
                </div></td>
              </tr>
            ))}
            {!data.submissions.length ? <tr><td colSpan={7} className="muted">No submissions yet.</td></tr> : null}
          </tbody></table></div>
        </section>
      )}

      {tab === 'messages' && (
        <section>
          <div className="panel-head"><h2>Contact messages</h2></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>From</th><th>Message</th><th>Received</th><th /></tr></thead><tbody>
            {data.messages.map((m) => (
              <tr key={m.id}><td className="ttl">{m.name}<span className="sub"><a href={`mailto:${m.email}`}>{m.email}</a></span></td><td style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}>{m.message}</td><td>{fmt(String(m.created_at).slice(0, 10))}</td>
                <td><div className="acts"><button className="btn btn-danger btn-sm" onClick={() => remove(deleteMessage, m.id, 'message')}><Icon name="trash" size={15} /></button></div></td></tr>
            ))}
            {!data.messages.length ? <tr><td colSpan={4} className="muted">No messages yet.</td></tr> : null}
          </tbody></table></div>
        </section>
      )}

      {modal?.kind === 'category' && <Modal title={modal.row ? 'Edit category' : 'New category'} onClose={() => setModal(null)}><CategoryForm row={modal.row} onClose={() => setModal(null)} onSave={(p) => save(saveCategory, p, modal.row ? 'Category saved.' : 'Category created.')} /></Modal>}
      {modal?.kind === 'author' && <Modal title={modal.row ? 'Edit author' : 'New author'} onClose={() => setModal(null)}><AuthorForm row={modal.row} onClose={() => setModal(null)} onSave={(p) => save(saveAuthor, p, modal.row ? 'Author saved.' : 'Author created.')} /></Modal>}
      {modal?.kind === 'paper' && <Modal title={modal.row ? 'Edit paper' : 'New paper'} onClose={() => setModal(null)}><PaperForm row={modal.row} data={data} onClose={() => setModal(null)} onSave={(p) => save(savePaper, p, modal.row ? 'Paper saved.' : 'Paper published.')} /></Modal>}
      {modal?.kind === 'news' && <Modal title={modal.row ? 'Edit article' : 'New article'} onClose={() => setModal(null)}><NewsForm row={modal.row} data={data} onClose={() => setModal(null)} onSave={(p) => save(saveNews, p, modal.row ? 'Article saved.' : 'Article published.')} /></Modal>}
    </div>
  );
}
