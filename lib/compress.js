/* Browser-side cover compression: resizes to a 3:4 cover and searches for the highest quality that stays
   within 10 KB (WebP, or JPEG where WebP encoding is unavailable). */

export const COVER_MAX_KB = 10;
export const COVER_MIN_KB = 5;

const SIZES = [[480, 640], [420, 560], [360, 480], [300, 400], [240, 320], [200, 267], [150, 200], [120, 160], [90, 120]];

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

let webpOk;
function supportsWebp() {
  if (webpOk === undefined) {
    try { const c = document.createElement('canvas'); c.width = c.height = 1; webpOk = c.toDataURL('image/webp').startsWith('data:image/webp'); } catch { webpOk = false; }
  }
  return webpOk;
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('This image could not be read.')); im.src = url; });
  } finally { URL.revokeObjectURL(url); }
}

function draw(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  const sw = img.width, sh = img.height, target = w / h;
  let cw = sw, ch = sh;
  if (sw / sh > target) cw = sh * target; else ch = sw / target; // centre-crop to 3:4
  ctx.drawImage(img, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
  return c;
}

/** @returns {Promise<{blob: Blob, width: number, height: number, type: string, bytes: number, originalBytes: number}>} */
export async function compressCover(file, { maxKB = COVER_MAX_KB } = {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  if (file.size > 30 * 1024 * 1024) throw new Error('That image is over 30 MB. Please pick a smaller one.');
  const img = await loadBitmap(file);
  const max = maxKB * 1024;
  const type = supportsWebp() ? 'image/webp' : 'image/jpeg';
  const pack = (blob, w, h) => ({ blob, width: w, height: h, type: blob.type || type, bytes: blob.size, originalBytes: file.size });

  for (const [w, h] of SIZES) {
    const canvas = draw(img, w, h);
    const best = await toBlob(canvas, type, 0.92);
    if (best && best.size <= max) return pack(best, w, h);           // already small: keep the best quality
    const floor = await toBlob(canvas, type, 0.5);
    if (!floor || floor.size > max) continue;                        // even q=0.5 is too big: try a smaller canvas
    let lo = 0.5, hi = 0.92, keep = floor;                           // binary-search the highest quality under the limit
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2; const b = await toBlob(canvas, type, mid);
      if (b && b.size <= max) { keep = b; lo = mid; } else hi = mid;
    }
    return pack(keep, w, h);
  }
  const [w, h] = SIZES[SIZES.length - 1];
  const last = await toBlob(draw(img, w, h), type, 0.3);
  if (!last || last.size > max) throw new Error('Could not compress this image under 10 KB. Try a simpler image.');
  return pack(last, w, h);
}

export const kb = (b) => (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
export const prettySize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : kb(b));
