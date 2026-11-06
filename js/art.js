/* Shared SVG helpers + generated album covers + the cat. */
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
    switch (spec.motif) {
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
    if (withLabel && spec.label)
      s += `<text x="7" y="13" font-family="'Archivo Black', 'Arial Black', sans-serif" font-size="8.5" letter-spacing=".5" fill="${p.ink}">${esc(spec.label)}</text>`;
    // printed-card finish: sheen + edge
    s += `<rect width="100" height="100" fill="${lin([[0, "#fff", 0.22], [0.4, "#fff", 0], [0.75, "#000", 0], [1, "#000", 0.22]], 0, 0, 1, 1)}"/>`;
    s += `<rect x=".5" y=".5" width="99" height="99" fill="none" stroke="#000" stroke-opacity=".25"/>`;
    return s;
  }

  /* -------- the cat (seal-point, blue eyes) --------
     Each pose is drawn around (0,0) = ground under the cat, facing right. */
  const C = {
    cream: "#f5ebdd", creamD: "#e3cfb4", tan: "#c6a47e", point: "#3a261d", pointM: "#6e4c3a"
  };
  let catGrads = null;
  function catDefs() {
    if (catGrads) return catGrads;
    catGrads = {
      body: lin([[0, "#cfb08a"], [0.45, C.cream], [1, "#ead8c0"]], 0, 0, 1, 0),
      bodyV: lin([[0, "#fff6ea"], [0.6, C.cream], [1, "#c9a882"]]),
      leg: lin([[0, C.creamD], [0.35, "#a58065"], [0.7, C.point], [1, "#24160f"]]),
      legFar: lin([[0, "#c8ad8c"], [0.35, "#7a5a46"], [0.7, "#2a1a12"], [1, "#1a0e09"]]),
      tail: lin([[0, C.pointM], [1, "#22140e"]], 0, 0, 1, 1),
      mask: rad([[0, "#1c100b"], [0.5, "#2e1d15", 0.97], [0.78, "#5e4232", 0.55], [1, "#c6a47e", 0]], 0.5, 0.6, 0.55),
      ear: lin([[0, "#22140e"], [1, "#5a3e30"]]),
      eye: rad([[0, "#d6efff"], [0.45, "#7db8e8"], [1, "#2b5d8f"]], 0.45, 0.4, 0.6),
      ruff: rad([[0, "#fffaf2"], [1, "#f1e4d2", 0]], 0.5, 0.4, 0.6)
    };
    return catGrads;
  }
  function eye(x, y, rot, look = 0) {
    const g = catDefs();
    return `<g class="eye" transform="translate(${x} ${y}) rotate(${rot})">
      <ellipse rx="7.2" ry="5.2" fill="#1a0f0a"/>
      <ellipse rx="6.2" ry="4.4" fill="${g.eye}"/>
      <ellipse cx="${look}" rx="2.2" ry="4" fill="#0b0b10"/>
      <circle cx="${look - 2}" cy="-1.6" r="1.4" fill="#fff"/>
    </g>`;
  }
  function head(closed = false, side = false) {
    const g = catDefs();
    const eyes = closed
      ? `<path d="M-20 4 q7 5 13 0" stroke="#14090500" fill="none"/><path d="M-20 3 q7 5 13 0" stroke="#100805" stroke-width="2" fill="none" stroke-linecap="round"/>
         <path d="M7 3 q7 5 13 0" stroke="#100805" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : side ? eye(-6, 1, -6, 1.5) + eye(16, 1, 6, 1.5) : eye(-14, 1, -8) + eye(14, 1, 8);
    const nx = side ? 6 : 0;
    return `
      <g filter="url(#fur)">
        <path d="M-40 -36 L-34 -86 L-4 -50 Z" fill="${g.ear}"/>
        <path d="M40 -36 L34 -86 L4 -50 Z" fill="${g.ear}"/>
        <path d="M-46 2 C-50 -28 -30 -50 0 -52 C30 -50 50 -28 46 2 C44 26 24 40 0 42 C-24 40 -44 26 -46 2 Z" fill="${g.bodyV}"/>
        <ellipse cx="${nx}" cy="4" rx="38" ry="38" fill="${g.mask}"/>
      </g>
      <path d="M-30 -48 L-28 -68 L-14 -52 Z" fill="#8a6452" opacity=".55"/>
      <path d="M30 -48 L28 -68 L14 -52 Z" fill="#8a6452" opacity=".55"/>
      <g class="${closed ? "" : "blink"}">${eyes}</g>
      <path d="M${nx - 4.5} 15 L${nx + 4.5} 15 L${nx} 20.5 Z" fill="#120a07"/>
      <path d="M${nx} 20.5 q-4 4 -8 2 M${nx} 20.5 q4 4 8 2" stroke="#120a07" stroke-width="1.2" fill="none"/>
      <g stroke="#fff" stroke-opacity=".55" stroke-width=".8" fill="none">
        <path d="M${nx - 10} 20 q-18 -3 -34 -1"/><path d="M${nx - 10} 23 q-18 1 -32 6"/>
        <path d="M${nx + 10} 20 q18 -3 34 -1"/><path d="M${nx + 10} 23 q18 1 32 6"/>
      </g>`;
  }
  function catPose(pose) {
    const g = catDefs();
    if (pose === "sit" || pose === "paw") {
      const rightLeg = pose === "paw"
        ? `<g class="paw-swat"><rect x="14" y="-66" width="19" height="52" rx="9" fill="${g.leg}" transform="rotate(-62 23 -66)"/></g>`
        : `<rect x="12" y="-66" width="19" height="66" rx="9" fill="${g.leg}"/><ellipse cx="22" cy="-3" rx="13" ry="6.5" fill="#1f130d"/>`;
      return `
        <ellipse cx="0" cy="0" rx="78" ry="9" fill="#000" opacity=".28" filter="url(#blur6)"/>
        <g filter="url(#fur)">
          <path d="M-34 -10 C-80 -2 -112 -14 -106 -42 C-102 -60 -86 -60 -84 -46 C-82 -30 -62 -24 -34 -28 Z" fill="${g.tail}"/>
          <path d="M-60 0 C-76 -48 -66 -104 -32 -126 C-8 -138 30 -136 50 -114 C68 -90 68 -40 58 0 Z" fill="${g.body}"/>
          <ellipse cx="-32" cy="-42" rx="34" ry="40" fill="${g.bodyV}" opacity=".55"/>
          <path d="M-22 -124 C-34 -96 -26 -70 -6 -60 C12 -54 30 -62 36 -82 C42 -104 30 -126 8 -132 Z" fill="${g.ruff}"/>
          <rect x="-14" y="-66" width="19" height="66" rx="9" fill="${g.leg}"/>
          ${rightLeg}
          <ellipse cx="-5" cy="-3" rx="13" ry="6.5" fill="#1f130d"/>
        </g>
        <g class="cat-head" transform="translate(8 -156)">${head(false, false)}</g>`;
    }
    if (pose === "walk" || pose === "crouch") {
      const crouch = pose === "crouch";
      const by = crouch ? -50 : -78, lh = crouch ? 48 : 74;
      const hx = crouch ? 70 : 74, hy = crouch ? -44 : -112;
      const tail = crouch ? "M-62 -56 C-96 -50 -112 -26 -102 -10" : "M-64 -92 C-98 -104 -108 -136 -92 -160";
      const leg = (x, cls, fill) => `<g class="${cls}"><rect x="${x}" y="${by + 10}" width="17" height="${lh - 6}" rx="8" fill="${fill}"/><ellipse cx="${x + 9}" cy="-3" rx="11" ry="5" fill="#1a0f0a"/></g>`;
      return `
        <ellipse cx="0" cy="0" rx="92" ry="9" fill="#000" opacity=".28" filter="url(#blur6)"/>
        <g filter="url(#fur)">
          <path d="${tail}" stroke="${g.tail}" stroke-width="17" stroke-linecap="round" fill="none"/>
          ${leg(-52, "leg-b", g.legFar)}${leg(32, "leg-a", g.legFar)}
          <ellipse cx="-4" cy="${by}" rx="70" ry="${crouch ? 30 : 33}" fill="${g.bodyV}"/>
          <ellipse cx="-46" cy="${by + 6}" rx="30" ry="${crouch ? 28 : 32}" fill="${g.body}" opacity=".7"/>
          <ellipse cx="44" cy="${by + 6}" rx="26" ry="24" fill="${g.ruff}"/>
          ${leg(-40, "leg-a", g.leg)}${leg(44, "leg-b", g.leg)}
        </g>
        <g class="${crouch ? "cat-head bob" : "cat-head"}" transform="translate(${hx} ${hy}) scale(.82) rotate(${crouch ? 16 : 0})">${head(false, true)}</g>`;
    }
    if (pose === "sleep") {
      return `
        <ellipse cx="0" cy="0" rx="96" ry="10" fill="#000" opacity=".28" filter="url(#blur6)"/>
        <g class="breathe">
          <g filter="url(#fur)">
            <ellipse cx="8" cy="-36" rx="82" ry="36" fill="${g.bodyV}"/>
            <ellipse cx="30" cy="-40" rx="50" ry="30" fill="${g.body}" opacity=".6"/>
            <path d="M80 -24 C78 0 20 8 -46 -4" stroke="${g.tail}" stroke-width="19" stroke-linecap="round" fill="none"/>
            <ellipse cx="-34" cy="-8" rx="20" ry="8" fill="#26170f"/>
          </g>
          <g transform="translate(-58 -42) scale(.86) rotate(-12)">${head(true, false)}</g>
        </g>`;
    }
    return "";
  }

  function defsMarkup() { return DEFS.join(""); }
  function resetDefs() { DEFS.length = 0; }

  return { lin, rad, clip, rng, hash, esc, cover, catPose, catDefs, defsMarkup, resetDefs, nid };
})();
