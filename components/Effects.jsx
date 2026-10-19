'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

function revealNow() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  if (!window.__ssIO) {
    window.__ssIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); window.__ssIO.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  els.forEach((e) => window.__ssIO.observe(e));
}

/** Scroll-reveal for every `.reveal` element, including ones added later by client-side filtering/navigation. */
export default function Effects() {
  const pathname = usePathname();
  useEffect(() => {
    revealNow();
    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(revealNow); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => { revealNow(); }, [pathname]);
  return null;
}

export function Counter({ end }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const run = () => {
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1400); setV(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { setV(end); return undefined; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [end]);
  return <strong ref={ref}>{v.toLocaleString('en-US')}</strong>;
}
