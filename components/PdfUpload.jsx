'use client';
import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { compressPdf, prettySize } from '@/lib/compress';

const MAX_PDF_MB = 20;

/**
 * Picks a PDF, compresses it losslessly, uploads it to Supabase Storage,
 * and extracts structured research paper content (title, authors, abstract, keywords,
 * sections, tables, and references).
 *
 * Props:
 *   value       – current public URL string (or '')
 *   onChange    – called with the new public URL after a successful upload
 *   onExtracted – called with the full structured extracted paper data
 *   onDetected  – backward-compatible callback with { title, context }
 *   id          – base id for form-field association
 *   label       – visible label text
 */
export default function PdfUpload({
  value,
  onChange,
  onExtracted,
  onDetected,
  id = 'pdf-file',
  label = 'Upload manuscript (PDF) *',
}) {
  const inputRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | compressing | extracting | done | error
  const [info, setInfo] = useState(null);        // { originalBytes, bytes, pct, compressed }
  const [err, setErr] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  /* ---- helpers ---- */
  const reset = () => {
    setStatus('idle');
    setInfo(null);
    setErr('');
    setExtractedData(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setShowPreview(false);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ---- file pick ---- */
  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr('');
    setInfo(null);
    setShowPreview(false);
    setExtractedData(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    onChange('');

    // Basic client-side validation
    if (file.type !== 'application/pdf') {
      setErr('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setErr(`File exceeds ${MAX_PDF_MB} MB. Please upload a smaller PDF.`);
      return;
    }

    /* ---- Step 1: Lossless optimization / validation ---- */
    setStatus('compressing');
    let result;
    try {
      result = await compressPdf(file);
    } catch {
      // Graceful fallback to original file blob
      result = {
        blob: file,
        originalBytes: file.size,
        bytes: file.size,
        pct: 0,
        compressed: false,
      };
    }

    const blobUrl = URL.createObjectURL(result.blob);
    setPreviewUrl(blobUrl);
    setInfo({
      originalBytes: result.originalBytes,
      bytes: result.bytes,
      pct: result.pct,
      compressed: result.compressed,
    });

    /* ---- Step 2: Upload & Server Extraction ---- */
    setStatus('extracting');
    try {
      const fd = new FormData();
      fd.append('file', new File([result.blob], file.name || 'manuscript.pdf', { type: 'application/pdf' }));
      const res = await fetch('/api/upload-pdf', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || 'Upload failed.');

      onChange(json.url);

      if (json.extracted) {
        setExtractedData(json.extracted);
        if (onExtracted) onExtracted(json.extracted);
        if (onDetected) onDetected({ title: json.extracted.title, context: json.extracted.abstract });
      } else if (json.detected) {
        if (onDetected) onDetected(json.detected);
      }

      setStatus('done');
    } catch (ex) {
      setErr(ex.message || 'Upload failed. Please try again.');
      setStatus('error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const busy = status === 'compressing' || status === 'extracting';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pdf-upload">
        {/* File input */}
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
          PDF only · max {MAX_PDF_MB} MB · selectable text, headings, and tables are automatically extracted.
        </small>

        {/* Progress status */}
        {busy && (
          <div className="pdf-upload-status">
            <div className="upload-bar"><i /></div>
            <span className="muted" style={{ fontWeight: 600 }}>
              {status === 'compressing' ? 'Analyzing & validating PDF…' : 'Extracting text, sections & tables…'}
            </span>
          </div>
        )}

        {/* Scanned PDF warning notice */}
        {extractedData && extractedData.ocrRequired && (
          <div style={{
            background: 'rgba(234, 88, 12, 0.1)',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '10px',
            fontSize: '13px',
            color: '#c2410c',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5,
          }}>
            <Icon name="info" size={18} />
            <div>
              <strong>OCR Required:</strong> {extractedData.message}
            </div>
          </div>
        )}

        {/* Successful extraction notice */}
        {extractedData && !extractedData.ocrRequired && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '10px',
            fontSize: '13px',
            color: '#166534',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5,
          }}>
            <Icon name="check" size={18} />
            <div>
              <strong>Article Content Extracted & Organized:</strong>
              <div style={{ fontSize: '12px', marginTop: '2px', color: '#15803d' }}>
                Extracted Title, {extractedData.authors?.filter((a) => a.name)?.length || 0} Authors, Abstract, {extractedData.sections?.length || 0} Sections
                {extractedData.tablesCount > 0 ? ` (${extractedData.tablesCount} HTML ${extractedData.tablesCount === 1 ? 'Table' : 'Tables'})` : ''}
                {extractedData.refs?.length > 0 ? `, and ${extractedData.refs.length} References` : ''}.
              </div>
            </div>
          </div>
        )}

        {/* Compression / Size stats */}
        {info && !busy && (
          <div className="pdf-compress-info">
            <Icon name="check" size={15} />
            <span>
              {info.compressed
                ? <>Original: <strong>{prettySize(info.originalBytes)}</strong> → Optimized: <strong>{prettySize(info.bytes)}</strong> ({info.pct}% saved)</>
                : <>Size: <strong>{prettySize(info.bytes)}</strong> — preserved in original quality.</>
              }
            </span>
            {previewUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? 'Hide original PDF' : 'Preview original PDF'}
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
