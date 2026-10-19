function rng(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inner SVG markup for generated cover artwork (deterministic for a given style + seed). */
export function artInner(style, seed) {
  const r = rng(seed * 9301 + 49297); let s = '';
  switch (style) {
    case 0: { const cx = 170 + r() * 80, cy = 120 + r() * 70; for (let i = 1; i <= 9; i++) s += `<circle cx="${cx}" cy="${cy}" r="${i * 26}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="${(0.75 - i * 0.06).toFixed(2)}"/>`; s += `<circle cx="${cx}" cy="${cy}" r="34" fill="currentColor" opacity=".9"/>`; break; }
    case 1: for (let i = 0; i < 11; i++) { const y = 80 + i * 16; s += `<path d="M-10 ${y} Q40 ${(y - 26 - r() * 14).toFixed(0)} 150 ${y} T310 ${y}" fill="none" stroke="currentColor" stroke-width="1.5" opacity="${(0.95 - i * 0.07).toFixed(2)}"/>`; } break;
    case 2: for (let x = 0; x < 11; x++) for (let y = 0; y < 8; y++) { const d = Math.hypot(x - 5, y - 3.5); s += `<circle cx="${20 + x * 26}" cy="${30 + y * 26}" r="${Math.max(1.2, 9 - d * 1.5).toFixed(1)}" fill="currentColor" opacity=".85"/>`; } break;
    case 3: for (let i = -4; i < 24; i++) s += `<line x1="${i * 16}" y1="0" x2="${i * 16 + 160}" y2="240" stroke="currentColor" stroke-width="1.2" opacity=".5"/>`; s += '<circle cx="300" cy="0" r="150" fill="currentColor" opacity=".85"/>'; break;
    case 4: for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) { const x = col * 40 + (row % 2 ? 20 : 0) - 10, y = row * 38 + 10; s += `<path d="M${x} ${y + 38} L${x + 20} ${y} L${x + 40} ${y + 38}z" fill="currentColor" opacity="${(0.12 + r() * 0.78).toFixed(2)}"/>`; } break;
    case 5: { for (let i = 0; i < 36; i++) { const a = (i * Math.PI) / 18, r2 = i % 2 ? 105 : 150; s += `<line x1="${(150 + Math.cos(a) * 26).toFixed(1)}" y1="${(150 + Math.sin(a) * 26).toFixed(1)}" x2="${(150 + Math.cos(a) * r2).toFixed(1)}" y2="${(150 + Math.sin(a) * r2).toFixed(1)}" stroke="currentColor" stroke-width="2" opacity=".7"/>`; } s += '<circle cx="150" cy="150" r="18" fill="currentColor"/>'; break; }
    case 6: for (let i = 0; i < 10; i++) { const h = 40 + r() * 150; s += `<rect x="${14 + i * 28}" y="${240 - h}" width="20" height="${h.toFixed(0)}" fill="currentColor" opacity="${(0.3 + r() * 0.65).toFixed(2)}"/>`; } break;
    default: for (let i = 0; i < 5; i++) s += `<ellipse cx="150" cy="130" rx="130" ry="${30 + i * 10}" transform="rotate(${i * 36} 150 130)" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"/>`; s += '<circle cx="150" cy="130" r="16" fill="currentColor"/>'; for (let i = 0; i < 4; i++) s += `<circle cx="${(60 + r() * 180).toFixed(0)}" cy="${(40 + r() * 180).toFixed(0)}" r="${(4 + r() * 5).toFixed(1)}" fill="currentColor"/>`;
  }
  return s;
}
