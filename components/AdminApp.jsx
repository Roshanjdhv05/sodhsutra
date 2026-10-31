'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, ICON_NAMES } from './Icon';
import CoverUpload from './CoverUpload';
import PdfUpload from './PdfUpload';
import {
  adminLogin, adminLogout, saveCategory, deleteCategory, saveAuthor, deleteAuthor, savePaper, deletePaper,
  setSubmissionStatus, deleteSubmission, publishSubmission,
  saveVolume, deleteVolume,
} from '@/app/admin/actions';
import { fmt, slugify } from '@/lib/helpers';
import { MANUSCRIPT_CATEGORIES } from '@/lib/data';
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
        <F id="c-name" label="Theme name *"><input id="c-name" className="input" value={f.name} onChange={(e) => { set('name', e.target.value); if (!row && !f._slugEdited) set('slug', slugify(e.target.value)); }} autoFocus /></F>
        <F id="c-short" label="Short name" hint="Used on cards and chips. Defaults to the full name."><input id="c-short" className="input" value={f.short_name} onChange={(e) => set('short_name', e.target.value)} /></F>
        <F id="c-slug" label="URL slug" hint="/categories/your-slug — leave as is unless you need a custom one."><input id="c-slug" className="input" value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: slugify(e.target.value), _slugEdited: true }))} /></F>
        <F id="c-order" label="Sort order" hint="Lower numbers appear first."><input id="c-order" className="input" type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></F>
        <F id="c-icon" label="Icon" full>
          <div className="iconpick" role="group" aria-label="Icon">
            {ICON_NAMES.map((n) => <button type="button" key={n} className={f.icon === n ? 'on' : ''} onClick={() => set('icon', n)} aria-label={n} aria-pressed={f.icon === n}><Icon name={n} size={20} /></button>)}
          </div>
        </F>
        <F id="c-desc" label="Description" full><textarea id="c-desc" className="input" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe this academic research theme..." /></F>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save theme' : 'Create theme'} />
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

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function PaperForm({ row, data, onSave, onClose }) {
  const n = data.papers.length;

  const initAuthors = () => {
    if (row?.authorIds?.length) {
      return row.authorIds.map((id) => {
        const a = data.authors.find((au) => au.id === id);
        return {
          name: a?.name || '',
          institution: a?.institution || row?.institution || '',
          designation: a?.designation || '',
        };
      });
    }
    return [{ name: '', institution: '', designation: '' }];
  };

  const [authors, setAuthors] = useState(initAuthors);
  const addAuthor = () => setAuthors((prev) => [...prev, { name: '', institution: '', designation: '' }]);
  const removeAuthor = (idx) => setAuthors((prev) => prev.filter((_, i) => i !== idx));
  const setAuthor = (idx, field, val) =>
    setAuthors((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));

  const [f, setF] = useState(() => ({
    title: '', slug: '', abstract: '', category_slug: data.categories[0]?.slug || '', category2_slug: '',
    authorIds: [], published_on: today(), keywords: '', views: 0,
    content_type: row?.content_type || 'Original Research Articles',
    format: 'rev', institution: '', featured: false, doi: '', peer_reviewed: false, is_demo: false,
    paper_url: '', cover_url: '', art_style: (n * 5 + 1) % 8, art_theme: (n * 7 + 2) % 6, art_seed: n + 1,
    new_category_name: '',
    ...(row ? {
      ...row,
      category2_slug: row.category2_slug || '',
      doi: row.doi || '',
      paper_url: row.paper_url || '',
      cover_url: row.cover_url || '',
      institution: row.institution || '',
      published_on: String(row.published_on).slice(0, 10),
      keywords: (row.keywords || []).join(', '),
      new_category_name: '',
      content_type: row.content_type || 'Original Research Articles',
    } : {}),
  }));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const handlePdfDetected = ({ title, context }) => {
    setF((prev) => ({
      ...prev,
      title: prev.title?.trim() ? prev.title : (title || ''),
      abstract: prev.abstract?.trim() ? prev.abstract : (context || ''),
    }));
  };

  const handlePdfExtracted = (extracted) => {
    if (!extracted) return;
    setF((prev) => ({
      ...prev,
      title: prev.title?.trim() ? prev.title : (extracted.title || prev.title || ''),
      abstract: prev.abstract?.trim() ? prev.abstract : (extracted.abstract || prev.abstract || ''),
      keywords: prev.keywords?.trim() ? prev.keywords : (Array.isArray(extracted.keywords) ? extracted.keywords.join(', ') : (extracted.keywords || prev.keywords || '')),
      _extracted_full_text: extracted.full_text || '',
      _extracted_refs: extracted.refs || [],
    }));
    // Auto-populate authors from extraction if form currently has only blank row
    if (Array.isArray(extracted.authors) && extracted.authors.length > 0) {
      setAuthors((prev) => {
        const hasRealAuthor = prev.some((a) => a.name.trim());
        if (hasRealAuthor) return prev;
        return extracted.authors.map((a) => ({
          name: typeof a === 'string' ? a : (a.name || ''),
          institution: typeof a === 'object' ? (a.institution || '') : '',
          designation: typeof a === 'object' ? (a.designation || '') : '',
        }));
      });
    }
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    const cleanAuthors = authors.filter((a) => a.name.trim());
    if (cleanAuthors.length === 0) {
      setBusy(false);
      setErr('Please enter at least one author name.');
      return;
    }

    const authors_text = cleanAuthors.map((a) => a.name.trim()).join(', ');
    const institution = cleanAuthors[0]?.institution || f.institution || '';
    const r = await onSave({
      ...f,
      authors_data: cleanAuthors,
      authors_text,
      institution,
      id: row?.id,
      full_text: f._extracted_full_text || '',
      refs_text: Array.isArray(f._extracted_refs) ? f._extracted_refs.join('\n') : (f._extracted_refs || ''),
    });
    setBusy(false);
    if (!r.ok) setErr(r.error);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <F id="p-title" label="Title *" full>
          <input
            id="p-title"
            className="input"
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Paper title (auto-detected when uploading PDF)"
            autoFocus
          />
        </F>

        <F id="p-abs" label="Abstract / Context *" hint="Appears under #abstract in contents (auto-detected from PDF)." full>
          <textarea
            id="p-abs"
            className="input"
            rows={5}
            value={f.abstract}
            onChange={(e) => set('abstract', e.target.value)}
            placeholder="Context or abstract of the paper (auto-detected when uploading PDF)..."
          />
        </F>

        <F id="p-type" label="Manuscript Category *">
          <select id="p-type" className="select" value={f.content_type} onChange={(e) => set('content_type', e.target.value)}>
            {MANUSCRIPT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </F>

        <F id="p-cat" label="Theme *">
          <select id="p-cat" className="select" value={f.category_slug} onChange={(e) => set('category_slug', e.target.value)}>
            <option value="">Select a theme</option>
            {data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            <option value="__new__">+ Add new theme...</option>
          </select>
        </F>
        {f.category_slug === '__new__' ? (
          <F id="p-cat-new" label="New Theme Name *" hint="Will automatically create and link this theme." full>
            <input
              id="p-cat-new"
              className="input"
              placeholder="e.g. Artificial Intelligence, Renewable Energy"
              value={f.new_category_name}
              onChange={(e) => set('new_category_name', e.target.value)}
              autoFocus
              required
            />
          </F>
        ) : (
          <F id="p-cat2" label="Second theme (optional)">
            <select id="p-cat2" className="select" value={f.category2_slug} onChange={(e) => set('category2_slug', e.target.value)}>
              <option value="">None</option>
              {data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </F>
        )}

        {/* Multi-author rows with 1st ] Authors, Institution, Designation */}
        <div className="full" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink, #111)' }}>Authors *</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addAuthor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="plus" size={14} /> Add more author
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {authors.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1.2fr 1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'var(--surface2, #f5f5f7)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  border: '1px solid var(--border, #e5e5e7)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink-muted, #555)' }}>
                  {getOrdinal(i + 1)} ]
                </div>
                <div>
                  <input
                    className="input"
                    placeholder="Authors"
                    value={a.name}
                    onChange={(e) => setAuthor(i, 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    className="input"
                    placeholder="Institution"
                    value={a.institution}
                    onChange={(e) => setAuthor(i, 'institution', e.target.value)}
                  />
                </div>
                <div>
                  <input
                    className="input"
                    placeholder="Designation"
                    value={a.designation}
                    onChange={(e) => setAuthor(i, 'designation', e.target.value)}
                  />
                </div>
                <div>
                  {authors.length > 1 ? (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeAuthor(i)}
                      title="Remove author"
                      style={{ color: '#e11d48' }}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  ) : (
                    <span style={{ width: '28px', display: 'inline-block' }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addAuthor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Icon name="plus" size={14} /> Add more author
            </button>
          </div>
        </div>

        <F id="p-date" label="Publication date *">
          <input id="p-date" className="input" type="date" value={f.published_on} onChange={(e) => set('published_on', e.target.value)} />
        </F>
        <F id="p-kw" label="Keywords" hint="Comma separated." full>
          <input id="p-kw" className="input" value={f.keywords} onChange={(e) => set('keywords', e.target.value)} />
        </F>
        <div className="full">
          <PdfUpload
            id="p-pdf"
            label="Upload manuscript (PDF) *"
            value={f.paper_url}
            onChange={(u) => set('paper_url', u)}
            onExtracted={handlePdfExtracted}
            onDetected={handlePdfDetected}
          />
        </div>
        <F id="p-doi" label="DOI (only if verified)">
          <input id="p-doi" className="input" value={f.doi} onChange={(e) => set('doi', e.target.value)} placeholder="10.xxxx/xxxxx" />
        </F>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save paper' : 'Publish paper'} />
    </form>
  );
}

function VolumeForm({ row, data, onSave, onClose }) {
  const [f, setF] = useState(() => ({
    name: 'Volume 1 - Issue 1',
    year_label: '2026- 2027',
    period_label: 'July- September 2026',
    volume_no: 1,
    issue_no: 1,
    description: '',
    cover_url: '',
    art_style: 0,
    art_theme: 0,
    art_seed: 101,
    paperIds: [],
    published: true,
    ...(row || {}),
  }));
  const [paperSearch, setPaperSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const togglePaper = (id) => {
    setF((s) => ({
      ...s,
      paperIds: s.paperIds.includes(id)
        ? s.paperIds.filter((x) => x !== id)
        : [...s.paperIds, id],
    }));
  };

  const filteredPapers = useMemo(() => {
    const q = paperSearch.trim().toLowerCase();
    if (!q) return data.papers;
    return data.papers.filter((p) => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchCat = (p.category_slug || '').toLowerCase().includes(q);
      const matchInst = (p.institution || '').toLowerCase().includes(q);
      return matchTitle || matchCat || matchInst;
    });
  }, [data.papers, paperSearch]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await onSave({ ...f, id: row?.id });
    setBusy(false);
    if (!r.ok) setErr(r.error);
  }

  const applyPreset = (vNo, iNo, name, period) => {
    setF((s) => ({ ...s, volume_no: vNo, issue_no: iNo, name, period_label: period }));
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="formgrid c2">
        <div className="full" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mut)', alignSelf: 'center' }}>Quick Presets:</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset(1, 1, 'Volume 1 - Issue 1', 'July- September 2026')}>Vol 1 · Issue 1 (Jul-Sep)</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset(1, 2, 'Volume 1 - Issue 2', 'October - December 2026')}>Vol 1 · Issue 2 (Oct-Dec)</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset(1, 3, 'Volume 1 - Issue 3', 'January - March 2027')}>Vol 1 · Issue 3 (Jan-Mar)</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset(1, 4, 'Volume 1 - Issue 4', 'April - June 2027')}>Vol 1 · Issue 4 (Apr-Jun)</button>
        </div>

        <F id="v-name" label="Volume Name *" hint="e.g. Volume 1 - Issue 1">
          <input id="v-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus required />
        </F>
        <F id="v-year" label="Academic Year *" hint="e.g. 2026- 2027">
          <input id="v-year" className="input" value={f.year_label} onChange={(e) => set('year_label', e.target.value)} required />
        </F>
        <F id="v-period" label="Period / Quarter" hint="e.g. July- September 2026">
          <input id="v-period" className="input" value={f.period_label} onChange={(e) => set('period_label', e.target.value)} />
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <F id="v-vol" label="Volume No">
            <input id="v-vol" className="input" type="number" min="1" value={f.volume_no} onChange={(e) => set('volume_no', e.target.value)} />
          </F>
          <F id="v-iss" label="Issue No">
            <input id="v-iss" className="input" type="number" min="1" value={f.issue_no} onChange={(e) => set('issue_no', e.target.value)} />
          </F>
        </div>
        <div className="full">
          <CoverUpload id="v-cover" label="Custom Cover Image (optional, auto-compressed)" value={f.cover_url} onChange={(u) => set('cover_url', u)} />
        </div>
        <F id="v-style" label="Procedural Art Style">
          <select id="v-style" className="select" value={f.art_style} onChange={(e) => set('art_style', +e.target.value)}>
            {STYLES.map((s, i) => <option key={s} value={i}>{s}</option>)}
          </select>
        </F>
        <F id="v-theme" label="Cover Theme Colour">
          <select id="v-theme" className="select" value={f.art_theme} onChange={(e) => set('art_theme', +e.target.value)}>
            {THEMES.map((s, i) => <option key={s} value={i}>{s}</option>)}
          </select>
        </F>
        <F id="v-desc" label="Description / Editorial Note" full>
          <textarea id="v-desc" className="input" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Summary of this issue's focus and theme..." />
        </F>

        {/* Paper Selection with Live Search */}
        <div className="full field" style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0, fontWeight: 700 }}>
              Select Papers in which it should be shown ({f.paperIds.length} selected)
            </label>
            {f.paperIds.length > 0 ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('paperIds', [])} style={{ padding: '3px 8px', fontSize: '0.78rem' }}>
                Clear Selected
              </button>
            ) : null}
          </div>
          <p className="hint" style={{ marginBottom: '10px' }}>
            Search and select the papers that will appear inside this volume book.
          </p>

          <div className="search-box small" style={{ marginBottom: '12px' }}>
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search papers by title, category, institution..."
              value={paperSearch}
              onChange={(e) => setPaperSearch(e.target.value)}
            />
            {paperSearch ? (
              <button type="button" className="icon-btn" onClick={() => setPaperSearch('')} style={{ width: 24, height: 24 }}>
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </div>

          <div className="pickbox scroll" style={{ maxHeight: '240px', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '8px', overflowY: 'auto' }}>
            {filteredPapers.map((p) => {
              const pos = f.paperIds.indexOf(p.id);
              const isChecked = pos >= 0;
              return (
                <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 4px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isChecked} onChange={() => togglePaper(p.id)} style={{ marginTop: '4px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mut)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span className="chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>{p.category_slug}</span>
                      <span>{fmt(p.published_on)}</span>
                      {p.institution ? <span>· {p.institution}</span> : null}
                    </div>
                  </div>
                  {isChecked ? <span className="ord" style={{ alignSelf: 'center' }}>#{pos + 1}</span> : null}
                </label>
              );
            })}
            {!filteredPapers.length ? <div className="muted" style={{ padding: '12px', textAlign: 'center' }}>No papers found matching “{paperSearch}”.</div> : null}
          </div>
        </div>
      </div>
      <FormFoot busy={busy} err={err} onClose={onClose} label={row ? 'Save Volume' : 'Create Volume'} />
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
  const tabs = [
    ['papers', 'Articles', data.papers.length],
    ['volumes', 'Issues', (data.volumes || []).length],
    ['categories', 'Themes', data.categories.length],
    ['manuscripts', 'Manuscript Categories', MANUSCRIPT_CATEGORIES.length],
    ['submissions', 'Submissions', pending || data.submissions.length],
  ];

  const searchBox = <div className="search-box small"><Icon name="search" size={18} /><label className="sr" htmlFor="adm-q">Filter</label><input id="adm-q" type="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} /></div>;

  return (
    <div className="container admin-wrap">
      <div className="admin-top">
        <div><p className="eyebrow">Admin</p><h1>Dashboard</h1></div>
        <div className="row" style={{ margin: 0 }}><a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener noreferrer">View site</a><button className="btn btn-ghost btn-sm" onClick={logout}><Icon name="logout" size={16} /> Log out</button></div>
      </div>
      <div className="admin-stats">
        {[['Articles', data.papers.length], ['Issues', (data.volumes || []).length], ['Themes', data.categories.length], ['Manuscripts', MANUSCRIPT_CATEGORIES.length], ['New submissions', pending]].map(([l, v]) => <div className="admin-stat" key={l}><strong>{v}</strong><span>{l}</span></div>)}
      </div>
      {flash?.ok ? <p className="msg-ok" role="status">{flash.ok}</p> : null}
      {flash?.err ? <p className="msg-err" role="alert">{flash.err}</p> : null}

      <div className="tabs" role="tablist">
        {tabs.map(([k, l, c]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l} <em>{c}</em></button>)}
      </div>

      {tab === 'papers' && (
        <section>
          <div className="panel-head"><h2>Articles</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'paper', row: null })}><Icon name="plus" size={16} /> New article</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Cover</th><th>Title</th><th>Theme</th><th>Manuscript Category</th><th>Authors</th><th>Date</th><th>Views</th><th>Flags</th><th /></tr></thead><tbody>
            {data.papers.filter((p) => match(p.title + ' ' + p.slug)).sort((a, b) => (a.published_on < b.published_on ? 1 : -1)).map((p) => (
              <tr key={p.id}>
                <td><Thumb url={p.cover_url} /></td>
                <td className="ttl">{p.title}<span className="sub">/journals/{p.slug}</span></td>
                <td>{catName[p.category_slug] || p.category_slug}</td>
                <td><span className="pill ok" style={{ fontSize: '0.74rem' }}>{p.content_type || 'Original Research Articles'}</span></td>
                <td>{p.authorIds.map((i) => authorName[i]).filter(Boolean).join(', ')}</td>
                <td>{fmt(p.published_on)}</td><td>{p.views}</td>
                <td>{p.featured ? <span className="pill">Featured</span> : null} {p.is_demo ? <span className="pill warn">Demo</span> : <span className="pill ok">Live</span>}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'paper', row: p })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deletePaper, p.id, 'article')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'volumes' && (
        <section>
          <div className="panel-head">
            <div>
              <h2>Journal Volumes &amp; Issues</h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                Organize research papers into quarterly volumes by academic year (e.g. 2026- 2027).
              </p>
            </div>
            <div className="row" style={{ margin: 0 }}>
              {searchBox}
              <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'volume', row: null })}>
                <Icon name="plus" size={16} /> New Volume
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="atable">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Volume &amp; Issue</th>
                  <th>Academic Year</th>
                  <th>Period</th>
                  <th>Papers Included</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(data.volumes || [])
                  .filter((v) => match(v.name + ' ' + v.year_label + ' ' + (v.period_label || '')))
                  .map((v) => (
                    <tr key={v.id}>
                      <td><Thumb url={v.cover_url} /></td>
                      <td className="ttl">
                        {v.name}
                        {v.description ? <span className="sub">{v.description.slice(0, 70)}…</span> : null}
                      </td>
                      <td><strong>{v.year_label}</strong></td>
                      <td>{v.period_label || '—'}</td>
                      <td>
                        <span className="pill ok">{(v.paperIds || []).length} papers</span>
                      </td>
                      <td>
                        <span className={`pill ${v.published !== false ? 'ok' : 'warn'}`}>
                          {v.published !== false ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className="acts">
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'volume', row: v })}>
                            <Icon name="edit" size={15} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(deleteVolume, v.id, 'volume')}>
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!(data.volumes || []).length ? (
                  <tr>
                    <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                      No volumes saved in the database yet. Click <strong>“New Volume”</strong> above to create your first volume, or run the provided SQL in Supabase.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'categories' && (
        <section>
          <div className="panel-head"><h2>Themes</h2><div className="row" style={{ margin: 0 }}>{searchBox}<button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'category', row: null })}><Icon name="plus" size={16} /> New theme</button></div></div>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Icon</th><th>Theme</th><th>Slug</th><th>Articles</th><th>Order</th><th /></tr></thead><tbody>
            {data.categories.filter((c) => match(c.name + ' ' + c.slug)).map((c) => (
              <tr key={c.id}>
                <td><Icon name={c.icon} size={22} /></td>
                <td className="ttl">{c.name}<span className="sub">{c.description}</span></td><td>{c.slug}</td>
                <td>{data.papers.filter((p) => p.category_slug === c.slug || p.category2_slug === c.slug).length}</td><td>{c.sort_order}</td>
                <td><div className="acts"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'category', row: c })}><Icon name="edit" size={15} /> Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(deleteCategory, c.id, 'theme')}><Icon name="trash" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {tab === 'manuscripts' && (
        <section>
          <div className="panel-head">
            <h2>Manuscript Categories</h2>
            <div className="row" style={{ margin: 0 }}>
              <span className="muted">{MANUSCRIPT_CATEGORIES.length} official categories</span>
            </div>
          </div>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Official manuscript categories available across ShodhSutra articles and submissions.
          </p>
          <div className="table-wrap">
            <table className="atable">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Category Name</th>
                  <th>Published Articles</th>
                </tr>
              </thead>
              <tbody>
                {MANUSCRIPT_CATEGORIES.map((cat, i) => {
                  const count = data.papers.filter((p) => (p.content_type || 'Original Research Articles') === cat).length;
                  return (
                    <tr key={cat}>
                      <td><strong>{i + 1}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                      </td>
                      <td><span className="pill ok">{count} {count === 1 ? 'article' : 'articles'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'submissions' && (
        <section>
          <div className="panel-head"><h2>Submissions</h2></div>
          <p className="muted">Articles sent through the public Submit page. “Approve & publish” creates the author(s) and a live article using the submitted link and cover; you can edit it afterwards.</p>
          <div className="table-wrap"><table className="atable"><thead><tr><th>Cover</th><th>Article</th><th>Author</th><th>Theme</th><th>Status</th><th>Received</th><th /></tr></thead><tbody>
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

      {modal?.kind === 'category' && <Modal title={modal.row ? 'Edit theme' : 'New theme'} onClose={() => setModal(null)}><CategoryForm row={modal.row} onClose={() => setModal(null)} onSave={(p) => save(saveCategory, p, modal.row ? 'Theme saved.' : 'Theme created.')} /></Modal>}
      {modal?.kind === 'volume' && <Modal title={modal.row ? 'Edit Volume' : 'New Volume'} onClose={() => setModal(null)}><VolumeForm row={modal.row} data={data} onClose={() => setModal(null)} onSave={(p) => save(saveVolume, p, modal.row ? 'Volume saved.' : 'Volume created.')} /></Modal>}
      {modal?.kind === 'author' && <Modal title={modal.row ? 'Edit author' : 'New author'} onClose={() => setModal(null)}><AuthorForm row={modal.row} onClose={() => setModal(null)} onSave={(p) => save(saveAuthor, p, modal.row ? 'Author saved.' : 'Author created.')} /></Modal>}
      {modal?.kind === 'paper' && <Modal title={modal.row ? 'Edit article' : 'New article'} onClose={() => setModal(null)}><PaperForm row={modal.row} data={data} onClose={() => setModal(null)} onSave={(p) => save(savePaper, p, modal.row ? 'Article saved.' : 'Article published.')} /></Modal>}
    </div>
  );
}
