'use client';
import { useState } from 'react';
import { Icon } from './Icon';
import { sendMessage } from '@/app/actions';

export default function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', message: '', website: '' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault(); setServerErr('');
    const er = {};
    if (!f.name.trim()) er.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'Enter a valid email.';
    if (f.message.trim().length < 10) er.message = 'Write at least 10 characters.';
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = await sendMessage(f);
    setBusy(false);
    if (res.ok) setDone(true); else setServerErr(res.error);
  }

  if (done) return <div className="done"><span className="done-ic"><Icon name="check" size={30} /></span><h3>Message sent</h3><p className="muted">Thank you — the editorial team will reply to the email you provided.</p></div>;

  return (
    <form onSubmit={onSubmit} noValidate className="form-grid">
      <div className="honey" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
      <div className="field"><label htmlFor="c-name">Name *</label><input className="input" id="c-name" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} /><p className="err" role="alert">{errs.name || ''}</p></div>
      <div className="field"><label htmlFor="c-email">Email *</label><input className="input" id="c-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} /><p className="err" role="alert">{errs.email || ''}</p></div>
      <div className="field"><label htmlFor="c-msg">Message *</label><textarea className="input" id="c-msg" rows={6} value={f.message} onChange={(e) => set('message', e.target.value)} /><p className="err" role="alert">{errs.message || ''}</p></div>
      {serverErr ? <p className="msg-err" role="alert">{serverErr}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
