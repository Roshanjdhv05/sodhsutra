'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import PdfUpload from './PdfUpload';
import { submitManuscript } from '@/app/actions';
import { MANUSCRIPT_CATEGORIES } from '@/lib/data';

const empty = { title: '', abstract: '', authorName: '', authorEmail: '', institution: '', category: '', newCategory: '', manuscriptCategory: 'Original Research Articles', keywords: '', pdfUrl: '', declaration: false, consent: false, website: '' };
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <small className="hint" id={`hint-${id}`}>{hint}</small> : null}
      <p className="err" id={`err-${id}`} role="alert">{error || ''}</p>
    </div>
  );
}

export default function SubmitForm({ categories }) {
  const [f, setF] = useState(empty);
  const [co, setCo] = useState([]);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [serverErr, setServerErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('ss_user')); if (u) setF((s) => ({ ...s, authorName: s.authorName || u.name, authorEmail: s.authorEmail || u.email })); } catch { /* ignore */ }
  }, []);

  const wc = words(f.abstract);

  function validate() {
    const e = {};
    if (f.title.trim().length < 10) e.title = 'Enter a title of at least 10 characters.';
    if (wc < 50) e.abstract = `Abstract is too short (${wc} words; minimum 50).`; else if (wc > 300) e.abstract = `Abstract is too long (${wc} words; maximum 300).`;
    if (f.authorName.trim().length < 2) e.authorName = 'Enter the author\u2019s name.';
    if (!/^\S+@\S+\.\S+$/.test(f.authorEmail.trim())) e.authorEmail = 'Enter a valid email address.';
    if (!f.institution.trim()) e.institution = 'Enter an institution (or \u201cIndependent\u201d).';
    if (!f.category) e.category = 'Choose a research theme.';
    if (f.category === '__new__' && !(f.newCategory || '').trim()) e.newCategory = 'Enter the name for the new theme.';
    const kw = f.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (kw.length < 3 || kw.length > 8) e.keywords = 'Enter 3 to 8 comma-separated keywords.';
    if (!f.pdfUrl) e.pdfUrl = 'Please upload your manuscript PDF before submitting.';
    if (!f.declaration) e.declaration = 'Please confirm the declaration of originality.';
    if (!f.consent) e.consent = 'Please consent to the policies to continue.';
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault(); setServerErr('');
    const e = validate(); setErrs(e);
    const first = Object.keys(e)[0];
    if (first) { document.getElementById(first === 'declaration' ? 'orig' : first === 'consent' ? 'consent' : `f-${first}`)?.focus(); return; }
    setBusy(true);
    const res = await submitManuscript({
      ...f, keywords: f.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      coauthors: co.filter((c) => c.name.trim()),
    });
    setBusy(false);
    if (!res.ok) { setServerErr(res.error); return; }
    setDone({ ref: res.ref, title: f.title });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (done) {
    return (
      <div className="done">
        <span className="done-ic"><Icon name="check" size={34} /></span>
        <h2>Manuscript received</h2>
        <p>Reference <strong>{done.ref}</strong>. &ldquo;{done.title}&rdquo; has been sent to the editorial team.</p>
        <p className="muted">Receipt does not imply review, acceptance or publication. An editor will look at your uploaded PDF and contact you at the email you provided.</p>
        <div className="row"><Link className="btn btn-primary" href="/">Back to home</Link><button className="btn btn-ghost" onClick={() => { setDone(null); setF(empty); setCo([]); }}>Submit another</button></div>
      </div>
    );
  }

  return (
    <>
      <div className="demo-banner"><Icon name="info" size={16} /> <span><strong>How submission works.</strong> Your details and manuscript PDF are saved for editorial review. Submitting does not mean acceptance or publication, and nothing appears on the site until an editor approves it.</span></div>
      <form onSubmit={onSubmit} noValidate className="form-grid">
        <div className="honey" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
        <Field id="f-title" label="Paper title *" error={errs.title}><input className="input" id="f-title" maxLength={200} value={f.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errs.title} /></Field>
        <Field id="f-abstract" label={<>Abstract * <span className={`hint-inline ${wc > 300 ? 'bad' : ''}`}>{wc} / 300 words</span></>} hint="Between 50 and 300 words." error={errs.abstract}>
          <textarea className="input" id="f-abstract" rows={7} value={f.abstract} onChange={(e) => set('abstract', e.target.value)} aria-invalid={!!errs.abstract} />
        </Field>
        <div className="two">
          <Field id="f-authorName" label="Corresponding author name *" error={errs.authorName}><input className="input" id="f-authorName" autoComplete="name" value={f.authorName} onChange={(e) => set('authorName', e.target.value)} aria-invalid={!!errs.authorName} /></Field>
          <Field id="f-authorEmail" label="Author email *" error={errs.authorEmail}><input className="input" id="f-authorEmail" type="email" autoComplete="email" value={f.authorEmail} onChange={(e) => set('authorEmail', e.target.value)} aria-invalid={!!errs.authorEmail} /></Field>
        </div>
        <fieldset className="field">
          <legend>Additional authors</legend>
          {co.map((c, i) => (
            <div className="coauthor" key={i}>
              <label className="sr" htmlFor={`co-n${i}`}>Co-author {i + 1} name</label><input className="input" id={`co-n${i}`} placeholder="Co-author name" value={c.name} onChange={(e) => setCo((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <label className="sr" htmlFor={`co-e${i}`}>Co-author {i + 1} email</label><input className="input" id={`co-e${i}`} type="email" placeholder="Email (optional)" value={c.email} onChange={(e) => setCo((l) => l.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Remove author" onClick={() => setCo((l) => l.filter((_, j) => j !== i))}><Icon name="x" size={18} /></button>
            </div>
          ))}
          {co.length < 8 ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCo((l) => [...l, { name: '', email: '' }])}>+ Add author</button> : null}
        </fieldset>
        <Field id="f-manuscript-cat" label="Manuscript Category *">
          <select
            className="select"
            id="f-manuscript-cat"
            value={f.manuscriptCategory}
            onChange={(e) => set('manuscriptCategory', e.target.value)}
          >
            {MANUSCRIPT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </Field>
        <div className="two">
          <Field id="f-institution" label="Institution *" error={errs.institution}><input className="input" id="f-institution" autoComplete="organization" value={f.institution} onChange={(e) => set('institution', e.target.value)} aria-invalid={!!errs.institution} /></Field>
          <Field id="f-category" label="Research theme *" error={errs.category}>
            <select className="select" id="f-category" value={f.category} onChange={(e) => set('category', e.target.value)} aria-invalid={!!errs.category}>
              <option value="">Select a theme</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              <option value="__new__">+ Add new theme...</option>
            </select>
          </Field>
        </div>
        {f.category === '__new__' && (
          <Field id="f-new-category" label="New Theme Name *" error={errs.newCategory} hint="Your suggested theme will be added to the journal.">
            <input
              className="input"
              id="f-new-category"
              placeholder="e.g. Artificial Intelligence, Renewable Energy"
              value={f.newCategory}
              onChange={(e) => set('newCategory', e.target.value)}
              autoFocus
              aria-invalid={!!errs.newCategory}
            />
          </Field>
        )}
        <Field id="f-keywords" label="Keywords *" hint="Separate with commas — 3 to 8 keywords." error={errs.keywords}><input className="input" id="f-keywords" placeholder="e.g. language models, evaluation, efficiency" value={f.keywords} onChange={(e) => set('keywords', e.target.value)} aria-invalid={!!errs.keywords} /></Field>

        {/* PDF Upload — replaces the old "Paper link" text field */}
        <div className="field" id="f-pdfUrl">
          <PdfUpload
            id="f-pdfUrl-input"
            label="Manuscript PDF *"
            value={f.pdfUrl}
            onChange={(u) => { set('pdfUrl', u); if (u) setErrs((ex) => ({ ...ex, pdfUrl: undefined })); }}
          />
          {errs.pdfUrl ? <p className="err" role="alert">{errs.pdfUrl}</p> : null}
        </div>

        <div className="field check"><label><input type="checkbox" id="orig" checked={f.declaration} onChange={(e) => set('declaration', e.target.checked)} /> I declare this work is original, has not been published elsewhere, and all sources are credited. *</label><p className="err" role="alert">{errs.declaration || ''}</p></div>
        <div className="field check"><label><input type="checkbox" id="consent" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} /> I consent to the <Link href="/editorial-policy" target="_blank">publication and review policies</Link>. *</label><p className="err" role="alert">{errs.consent || ''}</p></div>
        {serverErr ? <p className="msg-err" role="alert">{serverErr}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Submitting\u2026' : 'Submit Manuscript'}</button>
      </form>
    </>
  );
}
