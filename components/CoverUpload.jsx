'use client';
import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { compressCover, kb, prettySize } from '@/lib/compress';

/** Picks an image, compresses it in the browser to ≤ 10 KB, uploads it and reports the public URL via onChange. */
export default function CoverUpload({ value, onChange, label = 'Cover image', id = 'cover-file' }) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState('');
  const input = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setInfo(''); setBusy(true);
    try {
      const r = await compressCover(file);
      const url = URL.createObjectURL(r.blob);
      setPreview((old) => { if (old) URL.revokeObjectURL(old); return url; });
      const ext = r.type === 'image/webp' ? 'webp' : 'jpg';
      const fd = new FormData();
      fd.append('file', new File([r.blob], `cover.${ext}`, { type: r.type }));
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Upload failed.');
      onChange(json.url);
      setInfo(`Compressed ${prettySize(r.originalBytes)} → ${kb(r.bytes)} (${r.width}×${r.height} ${ext.toUpperCase()}) and uploaded.`);
    } catch (ex) {
      setErr(ex.message || 'Could not process that image.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const clear = () => { onChange(''); setPreview(''); setInfo(''); setErr(''); };
  const shown = preview || value;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="upload">
        <div className="upload-prev">
          {shown ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={shown} alt="Cover preview" /> : <Icon name="image" size={30} />}
        </div>
        <div className="upload-info">
          <input ref={input} id={id} className="input" type="file" accept="image/*" onChange={pick} disabled={busy} aria-describedby={`${id}-hint`} />
          <small className="hint" id={`${id}-hint`}>Any JPG, PNG or WebP. It is automatically resized to a 3:4 cover and compressed to under 10 KB before upload.</small>
          {busy ? <><span>Compressing and uploading…</span><div className="upload-bar"><i /></div></> : null}
          {info ? <span><strong>{info}</strong></span> : null}
          {value && !busy ? <div className="row"><button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Remove cover</button></div> : null}
          {err ? <p className="err" role="alert">{err}</p> : null}
        </div>
      </div>
    </div>
  );
}
