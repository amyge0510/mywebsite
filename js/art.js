/* Shared SVG helpers + generated album covers for the project records. */
window.Art = (() => {
  "use strict";
  let uid = 0;
  const nid = (p) => `${p}${++uid}`;
  const DEFS = [];

  function stops(list) {
    return list.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join("");
  }
  function lin(list, x1 = 0, y1 = 0, x2 = 0, y2 = 1, user) {
    const id = nid("lg");
    DEFS.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${stops(list)}</linearGradient>`);
    return `url(#${id})`;
  }
  function rad(list, cx = 0.5, cy = 0.5, r = 0.5, user, fx, fy) {
    const id = nid("rg");
    const f = fx !== undefined ? ` fx="${fx}" fy="${fy}"` : "";
    DEFS.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${f}${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${stops(list)}</radialGradient>`);
    return `url(#${id})`;
  }
  function clip(shape) {
    const id = nid("cp");
    DEFS.push(`<clipPath id="${id}">${shape}</clipPath>`);
    return `url(#${id})`;
  }
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* -------- album covers: drawn in a 100x100 box -------- */
  function cover(spec, withLabel = true) {
    const p = spec.palette, r = rng(hash(spec.label || spec.motif));
    let s = `<rect width="100" height="100" fill="${p.bg}"/>`;
    if (spec.image) s += `<image href="${spec.image}" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>`;
    switch (spec.image ? null : spec.motif) {
      case "sunset": {
        s += `<rect width="100" height="58" fill="${lin([[0, p.bg], [0.55, p.b], [1, p.a]])}"/>`;
        s += `<circle cx="50" cy="58" r="22" fill="${p.c}"/><circle cx="50" cy="58" r="32" fill="${p.c}" opacity=".18"/>`;
        s += `<rect y="58" width="100" height="42" fill="${lin([[0, p.bg], [1, "#0d1424"]])}"/>`;
        for (let i = 0; i < 8; i++) {
          const w = 40 - i * 4.4;
          s += `<rect x="${50 - w / 2}" y="${61 + i * 4.6}" width="${w}" height="1.8" rx=".9" fill="${p.c}" opacity="${0.9 - i * 0.09}"/>`;
        }
        break;
      }
      case "face": {
        s += `<rect width="100" height="100" fill="${lin([[0, p.bg], [1, "#d8cdbd"]])}"/>`;
        s += `<path d="M18 100 C16 60 26 22 52 20 C78 22 86 60 82 100 Z" fill="${p.b}"/>`;
        s += `<ellipse cx="52" cy="58" rx="22" ry="28" fill="${lin([[0, p.c], [1, "#c99a7e"]], 0, 0, 1, 1)}"/>`;
        s += `<path d="M28 44 C34 26 70 22 78 46 C66 36 44 34 28 44 Z" fill="${p.b}"/>`;
        s += `<path d="M38 55 q6 -4 12 0" stroke="${p.b}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M56 55 q6 -4 12 0" stroke="${p.b}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M52 60 l-2 9 h4" stroke="#a87660" stroke-width="1.4" fill="none"/>`;
        s += `<path d="M44 75 q8 5 16 0 q-8 3 -16 0" fill="${p.a}" stroke="${p.a}" stroke-width="2"/>`;
        s += `<rect x="66" y="10" width="28" height="7" fill="${p.a}"/>`;
        break;
      }
      case "ghost": {
        s += `<rect width="100" height="62" fill="${lin([[0, p.a], [1, p.b]])}"/>`;
        s += `<rect y="60" width="100" height="40" fill="${lin([[0, p.bg], [1, "#3e4a2c"]])}"/>`;
        for (let i = 0; i < 70; i++) s += `<rect x="${r() * 100}" y="${62 + r() * 38}" width=".8" height="${2 + r() * 3}" fill="#9db27a" opacity=".6"/>`;
        s += `<ellipse cx="62" cy="86" rx="14" ry="3" fill="#000" opacity=".25"/>`;
        s += `<path d="M50 84 C50 70 50 44 62 40 C74 44 74 70 74 84 l-4 -3 -4 3 -4 -3 -4 3 -4 -3 Z" fill="${p.ink}"/>`;
        s += `<path d="M66 44 C72 50 73 70 73 82" stroke="#d9dce6" stroke-width="3" fill="none" opacity=".7"/>`;
        s += `<ellipse cx="58" cy="52" rx="1.6" ry="2.4" fill="#1a1a1a"/><ellipse cx="65" cy="52" rx="1.6" ry="2.4" fill="#1a1a1a"/>`;
        s += `<path d="M22 80 h16 v-6 l4 -4 h4 v6 l-2 2 v8 h-3 v-6 h-14 v6 h-3 Z" fill="${p.c}"/>`;
        break;
      }
      case "bauhaus": {
        s += `<circle cx="34" cy="36" r="24" fill="${p.a}"/>`;
        s += `<rect x="50" y="50" width="42" height="42" fill="${p.b}"/>`;
        s += `<path d="M10 92 L44 92 L10 58 Z" fill="${p.c}"/>`;
        for (let i = 0; i < 4; i++) s += `<rect x="62" y="${12 + i * 7}" width="30" height="3" fill="${p.ink}"/>`;
        s += `<circle cx="34" cy="36" r="24" fill="${rad([[0, "#fff", 0.25], [1, "#fff", 0]], 0.35, 0.3, 0.7)}"/>`;
        break;
      }
      case "waves": {
        const cols = [p.a, p.b, p.c, p.ink];
        for (let i = 0; i < 10; i++) {
          const y = 14 + i * 8.4;
          s += `<path d="M-5 ${y} Q 8 ${y - 6} 20 ${y} T 45 ${y} T 70 ${y} T 95 ${y} T 120 ${y}" stroke="${cols[i % 4]}" stroke-width="3.2" fill="none"/>`;
        }
        break;
      }
      case "planet": {
        for (let i = 0; i < 60; i++) s += `<circle cx="${r() * 100}" cy="${r() * 100}" r="${r() * 0.7 + 0.2}" fill="${r() < 0.3 ? p.c : p.ink}" opacity="${0.4 + r() * 0.6}"/>`;
        s += `<ellipse cx="50" cy="54" rx="42" ry="10" fill="none" stroke="${p.c}" stroke-width="2.5" opacity=".9" transform="rotate(-14 50 54)"/>`;
        s += `<circle cx="50" cy="54" r="24" fill="${rad([[0, p.a], [0.7, p.b], [1, "#5a2a1a"]], 0.35, 0.35, 0.75)}"/>`;
        s += `<path d="M8 64 A42 10 -14 0 0 92 44" fill="none" stroke="${p.c}" stroke-width="2.5" transform="rotate(0)" opacity=".95"/>`;
        break;
      }
      case "flower": {
        for (let y = 70; y < 100; y += 10) for (let x = 0; x < 100; x += 10)
          if (((x + y) / 10) % 2 < 1) s += `<rect x="${x}" y="${y}" width="10" height="10" fill="${p.c}"/>`;
        s += `<path d="M50 40 C48 56 52 66 50 82" stroke="${p.b}" stroke-width="4" fill="none"/>`;
        s += `<path d="M50 66 C40 58 30 62 28 68 C38 72 46 70 50 66Z" fill="${p.b}"/>`;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          s += `<ellipse cx="${50 + Math.cos(a) * 14}" cy="${36 + Math.sin(a) * 14}" rx="11" ry="9" transform="rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 14} ${36 + Math.sin(a) * 14})" fill="${p.a}"/>`;
        }
        s += `<circle cx="50" cy="36" r="9" fill="${p.c}"/><circle cx="48" cy="34" r="3" fill="#fff" opacity=".5"/>`;
        break;
      }
      case "dots": {
        for (let y = 5; y < 100; y += 9) for (let x = 5; x < 100; x += 9) {
          const d = Math.hypot(x - 68, y - 38);
          const rr = Math.max(0.6, 4.2 - d / 18);
          s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${p.a}"/>`;
        }
        s += `<circle cx="34" cy="64" r="18" fill="${p.b}"/>`;
        s += `<rect x="14" y="88" width="72" height="3" fill="${p.ink}"/>`;
        break;
      }
    }
    if (withLabel && spec.label && spec.image)
      s += `<rect x="4" y="4" width="${spec.label.length * 6.6 + 6}" height="12.5" rx="1.5" fill="#1a1012" opacity=".72"/>`;
    if (withLabel && spec.label)
      s += `<text x="7" y="13" font-family="'Archivo Black', 'Arial Black', sans-serif" font-size="8.5" letter-spacing=".5" fill="${p.ink}">${esc(spec.label)}</text>`;
    // printed-card finish: sheen + edge
    s += `<rect width="100" height="100" fill="${lin([[0, "#fff", 0.22], [0.4, "#fff", 0], [0.75, "#000", 0], [1, "#000", 0.22]], 0, 0, 1, 1)}"/>`;
    s += `<rect x=".5" y=".5" width="99" height="99" fill="none" stroke="#000" stroke-opacity=".25"/>`;
    return s;
  }

  function defsMarkup() { return DEFS.join(""); }
  function resetDefs() { DEFS.length = 0; }

  return { lin, rad, clip, rng, hash, esc, cover, defsMarkup, resetDefs, nid };
})();
