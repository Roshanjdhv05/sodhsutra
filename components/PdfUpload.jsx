'use client';
import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { compressPdf, prettySize } from '@/lib/compress';

const MAX_PDF_MB = 20;

/**
 * Picks a PDF, compresses it in the browser using pdf-lib, shows a preview
 * iframe and compression stats, then uploads the result to Supabase Storage.
 *
 * Props:
 *   value      – current public URL string (or '')
 *   onChange   – called with the new public URL after a successful upload
 *   id         – base id for form-field association
 *   label      – visible label text
 */
export default function PdfUpload({
  value,
  onChange,
  id = 'pdf-file',
  label = 'Upload manuscript (PDF) *',
}) {
  const inputRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | compressing | uploading | done | error
  const [info, setInfo] = useState(null);        // { originalBytes, bytes, pct, compressed }
  const [err, setErr] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  /* ---- helpers ---- */
  const reset = () => {
    setStatus('idle');
    setInfo(null);
    setErr('');
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }
    setShowPreview(false);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ---- file pick ---- */
  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(''); setInfo(null); setShowPreview(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    onChange('');

    // Basic client-side validation
    if (file.type !== 'application/pdf') {
      setErr('Only PDF files are accepted.'); return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setErr(`File exceeds ${MAX_PDF_MB} MB. Please upload a smaller PDF.`); return;
    }

    /* ---- Step 1: compress ---- */
    setStatus('compressing');
    let result;
    try {
      result = await compressPdf(file);
    } catch (ex) {
      setErr(ex.message || 'Could not process that PDF.');
      setStatus('error');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Create a local preview URL from the (possibly compressed) blob
    const blobUrl = URL.createObjectURL(result.blob);
    setPreviewUrl(blobUrl);
    setInfo({
      originalBytes: result.originalBytes,
      bytes: result.bytes,
      pct: result.pct,
      compressed: result.compressed,
    });

    /* ---- Step 2: upload ---- */
    setStatus('uploading');
    try {
      const fd = new FormData();
      fd.append('file', new File([result.blob], file.name || 'manuscript.pdf', { type: 'application/pdf' }));
      const res = await fetch('/api/upload-pdf', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Upload failed.');
      onChange(json.url);
      setStatus('done');
    } catch (ex) {
      setErr(ex.message || 'Upload failed. Please try again.');
      setStatus('error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const busy = status === 'compressing' || status === 'uploading';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pdf-upload">
        {/* File input (always rendered so the ref is stable) */}
        <div className="pdf-upload-input-row">
          <input
            ref={inputRef}
            id={id}
            className="input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={pick}
            disabled={busy}
            aria-describedby={`${id}-hint`}
          />
          {(status === 'done' || value) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={busy}>
              <Icon name="x" size={14} /> Remove
            </button>
          )}
        </div>

        <small className="hint" id={`${id}-hint`}>
          PDF only · max {MAX_PDF_MB} MB · selectable text and formatting are preserved.
        </small>

        {/* Progress / status */}
        {busy && (
          <div className="pdf-upload-status">
            <div className="upload-bar"><i /></div>
            <span className="muted">
              {status === 'compressing' ? 'Compressing PDF…' : 'Uploading…'}
            </span>
          </div>
        )}

        {/* Compression stats */}
        {info && !busy && (
          <div className="pdf-compress-info">
            <Icon name="check" size={15} />
            <span>
              {info.compressed
                ? <>Original: <strong>{prettySize(info.originalBytes)}</strong> → Compressed: <strong>{prettySize(info.bytes)}</strong> (<strong>{info.pct}% saved</strong>)</>
                : <>Size: <strong>{prettySize(info.bytes)}</strong> — already optimal, original retained.</>
              }
            </span>
            {previewUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? 'Hide preview' : 'Preview PDF'}
              </button>
            )}
          </div>
        )}

        {/* Inline PDF preview */}
        {showPreview && previewUrl && (
          <div className="pdf-preview-wrap">
            <iframe
              src={previewUrl}
              title="PDF preview"
              className="pdf-preview-frame"
              aria-label="Preview of uploaded PDF"
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm pdf-preview-close"
              onClick={() => setShowPreview(false)}
            >
              <Icon name="x" size={14} /> Close preview
            </button>
          </div>
        )}

        {/* Error */}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    </div>
  );
}

