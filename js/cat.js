/* Mochi, a fluffy seal-point cat, drawn as layered SVG with generated fur.
   Two poses: sleeping (most of the time) and walking. Facing right; (0,0) is
   the ground under the cat. Fur strands are grown at runtime along each
   shape's edge and across its surface, coloured by region. */
window.CatArt = (() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  // light cream → seal brown
  const RAMP = ["#fcf6ec", "#f1e4d0", "#dfc8a6", "#c3a07a", "#8c6649", "#4a3022", "#22140d"];
  const shade = (t) => RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1))))];

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- shapes ---------- */
  const HEAD = {
    base: "M-34 4 C-38 -20 -22 -38 2 -38 C26 -38 40 -22 40 -2 C42 12 36 24 26 30 C14 38 -12 38 -24 30 C-32 24 -34 14 -34 4 Z",
    earNear: "M-26 -18 L-19 -66 L4 -35 Z",
    earFar: "M14 -36 L35 -63 L38 -16 Z",
    innerNear: "M-20 -24 L-17 -55 L-3 -35 Z",
    innerFar: "M19 -34 L32 -54 L33 -22 Z"
  };
  const WALK = {
    tail: "M-106 -98 C-150 -112 -178 -150 -164 -192 C-156 -214 -132 -216 -127 -198 C-122 -178 -142 -150 -118 -124 C-110 -114 -100 -106 -94 -98 Z",
    body: "M-112 -92 C-96 -110 -40 -108 0 -102 C30 -98 52 -108 72 -106 C90 -104 101 -96 105 -82 C110 -62 102 -40 86 -32 C60 -22 20 -30 -20 -30 C-60 -30 -96 -36 -116 -54 C-128 -66 -124 -86 -112 -92 Z",
    ruff: "M66 -98 C98 -94 112 -72 104 -46 C98 -32 84 -28 72 -32 C80 -52 78 -78 66 -98 Z",
    front: "M-11 0 C-12 30 -9 55 -9 70 C-9 78 -13 82 -12 86 C-11 90 7 91 13 88 C16 85 10 80 9 72 C9 55 12 30 11 0 Z",
    hind: "M-19 0 C-23 25 -12 45 -12 60 C-12 72 -14 80 -12 84 C-10 88 8 88 13 85 C14 80 6 74 7 60 C8 45 17 20 17 0 Z"
  };
  const SLEEP = {
    body: "M-112 -6 C-122 -56 -74 -96 -2 -96 C62 -96 104 -72 108 -44 C112 -20 98 -4 78 0 L-98 0 C-106 -1 -112 -3 -112 -6 Z",
    haunch: "M-100 -30 C-104 -66 -70 -90 -36 -86 C-8 -82 6 -60 -4 -36 C-14 -16 -50 -10 -80 -14 C-92 -16 -99 -22 -100 -30 Z",
    tail: "M-106 -14 C-98 6 -40 12 20 8 C50 6 70 0 76 -10 C62 -16 40 -12 20 -14 C-30 -16 -72 -18 -94 -28 Z"
  };

  function eye(x, y, rx, ry, rot, closed) {
    if (closed) return `<path d="M${x - rx} ${y} Q${x} ${y + ry * 1.2} ${x + rx} ${y - 1}" stroke="#120a06" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <ellipse rx="${rx + 1.6}" ry="${ry + 1.4}" fill="#120a06"/>
      <ellipse rx="${rx}" ry="${ry}" fill="url(#cat-eye)"/>
      <ellipse cx="${rx * 0.12}" rx="${rx * 0.28}" ry="${ry * 0.82}" fill="#06070c"/>
      <ellipse cx="${-rx * 0.35}" cy="${-ry * 0.4}" rx="${rx * 0.22}" ry="${ry * 0.2}" fill="#fff" opacity=".95"/>
      <ellipse rx="${rx}" ry="${ry}" fill="url(#cat-eyeshade)"/>
    </g>`;
  }
  function head(closed) {
    return `
      <path class="ear-far" d="${HEAD.earFar}" fill="url(#cat-dark)" data-fur="ear" data-edge="3,6" data-n="40"/>
      <path d="${HEAD.innerFar}" fill="#7a5444" opacity=".7"/>
      <path d="${HEAD.base}" fill="url(#cat-head)" data-fur="head" data-edge="3,7" data-n="260" data-flow="-1,-0.3" data-mask="20,8,30"/>
      <ellipse cx="20" cy="8" rx="31" ry="30" fill="url(#cat-mask)"/>
      <path class="ear-near" d="${HEAD.earNear}" fill="url(#cat-dark)" data-fur="ear" data-edge="3,6" data-n="40"/>
      <path d="${HEAD.innerNear}" fill="#8a6050" opacity=".75"/>
      ${eye(10, -1, 7.5, 5, -10, closed)}${eye(30, -2, 5, 4.4, -6, closed)}
      <path d="M36 8 L45 6.5 L41.5 13 Z" fill="#0e0705"/>
      <path d="M41.5 13 q-1 5 -6 6 M41.5 13 q2 5 5 5" stroke="#0e0705" stroke-width="1.2" fill="none"/>
      <g stroke="#fff" stroke-opacity=".6" stroke-width=".8" fill="none" stroke-linecap="round">
        <path d="M34 14 q22 -6 44 -2"/><path d="M34 17 q22 0 42 7"/><path d="M33 19 q18 5 34 14"/>
        <path d="M30 14 q-20 -4 -40 0" stroke-opacity=".35"/>
      </g>`;
  }

  function walkMarkup() {
    const leg = (cls, x, y, d, far) => `<g class="${cls}" transform="translate(${x} ${y - 24}) scale(1 1.27)"><g class="leg-swing">
      <path d="${d}" fill="url(#cat-leg)" data-fur="leg" data-edge="2.5,5" data-n="70" data-flow="0,1" data-len="88"/>
      ${far ? `<path d="${d}" fill="#000" opacity=".28"/>` : ""}</g></g>`;
    return `<g class="pose pose-walk">
      <ellipse cx="0" cy="-2" rx="140" ry="11" fill="#000" opacity=".5" filter="url(#blur10)"/>
      <g class="walk-bob"><g transform="translate(0 -24)">
        <g class="tail" transform-origin="-106 -96"><path d="${WALK.tail}" fill="url(#cat-tail)" data-fur="tail" data-edge="4,8" data-n="160" data-flow="-0.3,-1"/></g>
        ${leg("leg-hf", -84, -86, WALK.hind, true)}${leg("leg-ff", 56, -86, WALK.front, true)}
        <path d="${WALK.body}" fill="url(#cat-body)" data-fur="body" data-edge="3,7" data-n="560" data-flow="-1,0.15"/>
        <path d="${WALK.body}" fill="url(#cat-volume)"/>
        <path d="${WALK.ruff}" fill="#fbf3e6" data-fur="ruff" data-edge="5,10" data-n="80" data-flow="0.2,1"/>
        <path d="M-108 -96 C-80 -110 -20 -106 20 -100 C40 -98 56 -106 72 -106" stroke="#ffc98e" stroke-width="3" fill="none" opacity=".45" filter="url(#blur2)"/>
        ${leg("leg-hn", -96, -82, WALK.hind, false)}${leg("leg-fn", 72, -84, WALK.front, false)}
        <g class="head" transform="translate(112 -124)"><g class="head-bob">${head(false)}</g></g>
      </g></g>
    </g>`;
  }
  function sleepMarkup() {
    return `<g class="pose pose-sleep">
      <ellipse cx="0" cy="-2" rx="128" ry="13" fill="#000" opacity=".55" filter="url(#blur10)"/>
      <g class="breathe">
        <path d="${SLEEP.body}" fill="url(#cat-body)" data-fur="body" data-edge="3,7" data-n="560" data-flow="-1,0.25"/>
        <path d="${SLEEP.body}" fill="url(#cat-volume)"/>
        <path d="${SLEEP.haunch}" fill="#efe1cb" opacity=".6" data-fur="body" data-edge="0,0" data-n="120" data-flow="-0.6,0.8"/>
        <path d="M-108 -30 C-104 -70 -60 -98 0 -96 C50 -95 90 -78 104 -52" stroke="#ffc98e" stroke-width="3" fill="none" opacity=".45" filter="url(#blur2)"/>
      </g>
      <ellipse cx="52" cy="-9" rx="17" ry="9" fill="url(#cat-dark)" data-fur="ear" data-edge="2,4" data-n="30"/>
      <ellipse cx="76" cy="-7" rx="15" ry="8" fill="url(#cat-dark)" data-fur="ear" data-edge="2,4" data-n="30"/>
      <g class="tail-sleep"><path d="${SLEEP.tail}" fill="url(#cat-tail)" data-fur="tail" data-edge="3,7" data-n="170" data-flow="1,0.05"/></g>
      <g class="head" transform="translate(70 -46) rotate(16) scale(.94)">${head(true)}</g>
    </g>`;
  }

  function defs() {
    return `
      <linearGradient id="cat-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d6ba"/><stop offset=".45" stop-color="#f3e7d4"/><stop offset="1" stop-color="#c9a985"/></linearGradient>
      <radialGradient id="cat-volume" cx=".55" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a2216" stop-opacity=".45"/></radialGradient>
      <linearGradient id="cat-leg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcc4a2"/><stop offset=".35" stop-color="#9c7556"/><stop offset=".7" stop-color="#3e281c"/><stop offset="1" stop-color="#1e120c"/></linearGradient>
      <linearGradient id="cat-tail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e4030"/><stop offset="1" stop-color="#1c110b"/></linearGradient>
      <linearGradient id="cat-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a12"/><stop offset="1" stop-color="#4a3226"/></linearGradient>
      <linearGradient id="cat-head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d0b0"/><stop offset="1" stop-color="#f2e5d2"/></linearGradient>
      <radialGradient id="cat-mask" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#1a0f0a"/><stop offset=".5" stop-color="#2c1c14" stop-opacity=".95"/><stop offset=".8" stop-color="#6a4a38" stop-opacity=".5"/><stop offset="1" stop-color="#c9a882" stop-opacity="0"/></radialGradient>
      <radialGradient id="cat-eye" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#d4ecff"/><stop offset=".5" stop-color="#7ab3e3"/><stop offset="1" stop-color="#2a5b8c"/></radialGradient>
      <linearGradient id="cat-eyeshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".4" stop-color="#000" stop-opacity="0"/></linearGradient>`;
  }

  /* ---------- fur ---------- */
  function grow(root, seed = 7) {
    const r = rng(seed);
    root.querySelectorAll("[data-fur]").forEach((el) => {
      const zone = el.dataset.fur;
      const [emin, emax] = (el.dataset.edge || "4,8").split(",").map(Number);
      const n = +(el.dataset.n || 100);
      const [fx, fy] = (el.dataset.flow || "-1,0").split(",").map(Number);
      const mask = el.dataset.mask ? el.dataset.mask.split(",").map(Number) : null;
      const legLen = +(el.dataset.len || 0);
      const bb = el.getBBox();
      const tone = (x, y) => {
        let t;
        if (zone === "body") t = 0.12 + 0.22 * ((y - bb.y) / bb.height) + r() * 0.16;
        else if (zone === "ruff") t = 0.02 + r() * 0.14;
        else if (zone === "leg") t = 0.22 + 0.78 * Math.max(0, Math.min(1, (y / legLen - 0.2) / 0.55)) + (r() - 0.5) * 0.12;
        else if (zone === "tail") t = 0.7 + r() * 0.3;
        else if (zone === "ear") t = 0.85 + r() * 0.15;
        else if (zone === "head") {
          const d = Math.hypot(x - mask[0], y - mask[1]) / mask[2];
          t = d < 0.6 ? 0.88 + r() * 0.12 : d < 1 ? 0.88 - (d - 0.6) * 1.6 + r() * 0.1 : 0.14 + r() * 0.16;
        }
        return Math.max(0, Math.min(1, t));
      };
      const buckets = {};
      const add = (t, d) => { const c = shade(t); (buckets[c] = buckets[c] || []).push(d); };
      const pt = (x, y) => { const p = (window.DOMPoint ? new DOMPoint(x, y) : { x, y }); return el.isPointInFill ? el.isPointInFill(p) : true; };
      // edge tufts
      if (emax > 0 && el.getTotalLength) {
        const L = el.getTotalLength();
        for (let s = 0; s < L; s += 1.6 + r() * 1.4) {
          const a = el.getPointAtLength(s), b = el.getPointAtLength(Math.min(L, s + 1));
          let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          let nx = ty, ny = -tx;
          if (pt(a.x + nx * 2, a.y + ny * 2)) { nx = -nx; ny = -ny; }
          const len = emin + r() * (emax - emin);
          // tufts lean with the fur instead of sticking straight out
          const ex = a.x + nx * len * 0.55 + fx * len * 0.8, ey = a.y + ny * len * 0.55 + fy * len * 0.8;
          add(tone(a.x, a.y) + (r() - 0.6) * 0.15,
            `M${(a.x - nx * 3).toFixed(1)} ${(a.y - ny * 3).toFixed(1)}Q${(a.x + nx * len * 0.5).toFixed(1)} ${(a.y + ny * len * 0.5).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
        }
      }
      // surface strands following the fur's flow
      let placed = 0, tries = 0;
      while (placed < n && tries < n * 6) {
        tries++;
        const x = bb.x + r() * bb.width, y = bb.y + r() * bb.height;
        if (!pt(x, y)) continue;
        placed++;
        const len = 4 + r() * 6, ang = Math.atan2(fy, fx) + (r() - 0.5) * 0.7;
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
        add(tone(x, y) + (r() < 0.5 ? -0.14 : 0.1), `M${x.toFixed(1)} ${y.toFixed(1)}Q${((x + ex) / 2 + (r() - 0.5) * 2).toFixed(1)} ${((y + ey) / 2 + (r() - 0.5) * 2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
      }
      const frag = document.createDocumentFragment();
      Object.entries(buckets).forEach(([col, ds]) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", ds.join(""));
        p.setAttribute("stroke", col);
        p.setAttribute("stroke-width", zone === "ear" ? "1" : "1.25");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("fill", "none");
        p.setAttribute("opacity", ".8");
        frag.appendChild(p);
      });
      el.after(frag);
    });
  }

  return { defs, markup: () => sleepMarkup() + walkMarkup(), grow };
})();
