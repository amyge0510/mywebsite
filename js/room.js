/* The room, as one layered SVG illustration.
   Coordinates: 1600x900 "stage". The wall is the plane at depth 0; furniture
   is projected toward a vanishing point so tops and sides read as 3D. */
(function () {
  "use strict";
  const SITE = window.SITE, AE = window.AudioEngine, Notes = window.NotesStore, A = window.Art;
  const { lin, rad, rng, hash, esc } = A;

  const W = 1600, H = 900, FLOOR = 770;
  const VP = { x: 800, y: 200 };
  const P = (x, y, k) => [x + (VP.x - x) * k, y + (VP.y - y) * k];
  const pt = (a) => `${a[0].toFixed(1)},${a[1].toFixed(1)}`;
  const poly = (pts, fill, extra = "") => `<polygon points="${pts.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;

  /* ---------------- layout ---------------- */
  const COVER = 150, GAP = 46;
  const COLS = [0, 1, 2, 3].map((i) => 531 + i * (COVER + GAP));
  const ROWS = [40, 250];
  const CAB = { x0: 540, x1: 1260, top: 640, k: 0.1 };
  CAB.bot = (FLOOR - VP.y * CAB.k) / (1 - CAB.k);
  const CNT = { x0: 30, x1: 430, top: 600, k: 0.14 };
  CNT.bot = (FLOOR - VP.y * CNT.k) / (1 - CNT.k);
  const CUBL = { x0: 560, x1: 890, y0: 668, y1: 800 };
  const CUBR = { x0: 908, x1: 1240, y0: 668, y1: 800 };
  const SLEEVE = 76;
  const sleeveX = (i) => CUBL.x0 + 8 + i * (SLEEVE + 6);
  const SLEEVE_BOT = CUBL.y1 - 6;
  const PLAT = { x: 700, y: 586, rx: 96, ry: 16 };
  const MACH = { x0: 80, x1: 250, y0: 450, y1: 590 };
  const LAMP = { x: 1130, base: 620 };
  const BOARD = { x: 50, y: 60, w: 360, h: 350 };
  const CUP_SLOTS = [290, 330, 370];
  const CAT_GROUND = 866, CAT_SCALE = 0.7;
  const SPOTS = { sleep: { x: 1330, dir: 1 }, drink: { x: 1392, dir: 1 }, eat: { x: 1472, dir: 1 }, play: { x: 1222, dir: 1 } };

  const projects = SITE.projects;
  const music = SITE.music;

  /* ---------------- pieces ---------------- */
  function wall() {
    let s = `<rect x="-1400" y="-900" width="4400" height="${FLOOR + 900}" fill="${lin([[0, "#7a4628"], [0.45, "#c98656"], [0.8, "#dca06c"], [1, "#c88a5a"]], 0, -900, 0, FLOOR, true)}"/>`;
    // crown shadow & ceiling hint
    s += `<rect x="-1400" y="-900" width="4400" height="905" fill="#6a4128" opacity=".55"/>`;
    s += `<rect x="-1400" y="0" width="4400" height="10" fill="#f3d2ab"/><rect x="-1400" y="10" width="4400" height="30" fill="${lin([[0, "#5a3520", 0.35], [1, "#5a3520", 0]])}"/>`;
    // baseboard
    s += `<rect x="-1400" y="${FLOOR - 24}" width="4400" height="24" fill="${lin([[0, "#fbe6cc"], [0.2, "#f0d6b6"], [1, "#d9b894"]])}"/>`;
    s += `<rect x="-1400" y="${FLOOR - 26}" width="4400" height="3" fill="#fff1dc"/>`;
    return s;
  }

  function sunlight() {
    // light through an off-screen window on the left, skewed across the wall
    const sk = (x, y) => [x + (y - 40) * 0.55, y];
    const panes = [];
    const X = [300, 470, 484, 654], Y = [40, 250, 264, 500];
    for (const [xa, xb] of [[X[0], X[1]], [X[2], X[3]]]) for (const [ya, yb] of [[Y[0], Y[1]], [Y[2], Y[3]]])
      panes.push(poly([sk(xa, ya), sk(xb, ya), sk(xb, yb), sk(xa, yb)], "#ffd99a"));
    return `<g class="sun" filter="url(#blur14)" style="mix-blend-mode:screen">${panes.join("")}</g>`;
  }

  function floor() {
    let s = `<rect x="-1400" y="${FLOOR}" width="4400" height="900" fill="#8d5a38"/>`;
    const r = rng(5);
    const at = (xb, y) => VP.x + (xb - VP.x) * ((y - VP.y) / (1500 - VP.y));
    const step = 120;
    for (let xb = -6000, i = 0; xb < 7600; xb += step, i++) {
      const a = [at(xb, FLOOR), FLOOR], b = [at(xb + step, FLOOR), FLOOR], c = [xb + step, 1500], d = [xb, 1500];
      const tone = ["#93603c", "#8a5734", "#9a6741", "#855232"][i % 4];
      s += poly([a, b, c, d], tone);
      s += `<line x1="${a[0]}" y1="${FLOOR}" x2="${xb}" y2="1500" stroke="#4e2e1a" stroke-width="1.6" opacity=".7"/>`;
      for (let j = 0; j < 3; j++) { // end joints
        const y = FLOOR + 10 + r() * 600;
        s += `<line x1="${at(xb, y)}" y1="${y}" x2="${at(xb + step, y)}" y2="${y}" stroke="#4e2e1a" stroke-width="1.2" opacity=".55"/>`;
      }
    }
    // wood sheen + depth falloff
    s += `<rect x="-1400" y="${FLOOR}" width="4400" height="900" fill="${lin([[0, "#2a160a", 0.55], [0.18, "#2a160a", 0.1], [1, "#2a160a", 0.45]], 0, FLOOR, 0, 1300, true)}"/>`;
    s += `<rect x="-1400" y="${FLOOR}" width="4400" height="24" fill="${lin([[0, "#1a0c05", 0.6], [1, "#1a0c05", 0]])}"/>`;
    return s;
  }

  function rug() {
    const cx = 900, cy = 882, rx = 610, ry = 64;
    let s = `<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx + 6}" ry="${ry + 4}" fill="#000" opacity=".3" filter="url(#blur6)"/>`;
    const rings = ["#8e3b2a", "#c7643f", "#e8a46a", "#b4502f", "#d98552", "#a3442c", "#e9b27a"];
    rings.forEach((c, i) => { const f = 1 - i * 0.12; s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * f}" ry="${ry * f}" fill="${c}"/>`; });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 24) {
      const f = 0.82;
      s += `<circle cx="${cx + Math.cos(a) * rx * f}" cy="${cy + Math.sin(a) * ry * f}" r="3.5" fill="#f6d39c" opacity=".8"/>`;
    }
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${rad([[0, "#fff", 0.08], [1, "#000", 0.25]])}"/>`;
    return s;
  }

  function ledge(x, y) {
    return `<rect x="${x - 14}" y="${y + COVER + 8}" width="${COVER + 28}" height="22" fill="#3b2416" opacity=".45" filter="url(#blur6)"/>
      <rect x="${x - 12}" y="${y + COVER - 2}" width="${COVER + 24}" height="14" rx="2" fill="${lin([[0, "#7a5034"], [0.25, "#5a3822"], [1, "#2e1b10"]])}"/>
      <rect x="${x - 12}" y="${y + COVER - 2}" width="${COVER + 24}" height="2" fill="#a2734e"/>`;
  }

  function vinylMarkup(m, spinId) {
    const p = m.cover.palette;
    let grooves = "";
    for (let r = 46; r > 20; r -= 3.2) grooves += `<circle r="${r}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".7"/>`;
    return `<circle r="50" fill="${m.vinyl}"/>
      <circle r="50" fill="${rad([[0, "#000", 0], [0.85, "#000", 0.15], [1, "#000", 0.45]])}"/>
      ${grooves}
      <g ${spinId ? `id="${spinId}"` : ""}>
        <circle r="17" fill="${p.c}"/><circle r="17" fill="${rad([[0, "#fff", 0.2], [1, "#000", 0.2]])}"/>
        <rect x="-10" y="-6" width="20" height="3" rx="1.5" fill="${p.bg}" opacity=".8"/>
        <circle cx="0" cy="9" r="2.5" fill="${p.a}"/>
        <path d="M-46 -6 A46 46 0 0 1 -30 -35" stroke="#fff" stroke-opacity=".12" stroke-width="5" fill="none"/>
      </g>
      <circle r="2.2" fill="#e8e2d8"/>
      <path d="M-40 -26 A48 48 0 0 1 26 -42" stroke="#fff" stroke-opacity=".28" stroke-width="3" fill="none"/>
      <path d="M40 26 A48 48 0 0 1 -26 42" stroke="#fff" stroke-opacity=".16" stroke-width="3" fill="none"/>`;
  }

  function record(i) {
    const x = COLS[i % 4], y = ROWS[Math.floor(i / 4)];
    const p = projects[i];
    if (!p) {
      return `<g class="hot" data-hot="empty" data-i="${i}">${ledge(x, y)}
        <rect x="${x + 2}" y="${y + 2}" width="${COVER - 4}" height="${COVER - 4}" rx="4" fill="#fff" fill-opacity=".08" stroke="#8a5a3a" stroke-opacity=".6" stroke-width="2" stroke-dasharray="7 7"/>
        <text x="${x + COVER / 2}" y="${y + COVER / 2 + 2}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="19" fill="#8a5a3a" opacity=".8">coming soon</text></g>`;
    }
    const vinyl = { vinyl: "#141011", cover: p.cover };
    return `<g class="hot" data-hot="project" data-i="${i}">${ledge(x, y)}
      <g class="lift">
        <rect x="${x + 10}" y="${y + 14}" width="${COVER}" height="${COVER}" fill="#2a160a" opacity=".45" filter="url(#blur8)"/>
        <g transform="translate(${x + COVER / 2 + 26} ${y + COVER / 2 + 2}) scale(${(COVER * 0.47) / 50})">${vinylMarkup(vinyl)}</g>
        <g transform="translate(${x} ${y}) scale(${COVER / 100})">${A.cover(p.cover)}</g>
      </g></g>`;
  }

  function board() {
    const b = BOARD, r = rng(3);
    let speck = "";
    for (let i = 0; i < 420; i++) speck += `<circle cx="${b.x + 14 + r() * (b.w - 28)}" cy="${b.y + 14 + r() * (b.h - 28)}" r="${0.6 + r() * 1.4}" fill="${r() < 0.5 ? "#9c6b3f" : "#e2b47e"}" opacity=".7"/>`;
    const frame = lin([[0, "#9a6a44"], [0.5, "#7a4e2e"], [1, "#5a3520"]], 0, 0, 1, 1);
    // decorations (notes cover them as the board fills up)
    const deco = `
      <g transform="translate(${b.x + 236} ${b.y + 232}) rotate(6)">
        <rect x="3" y="5" width="92" height="104" fill="#2a160a" opacity=".35" filter="url(#blur4)"/>
        <rect width="92" height="104" fill="#fbf7ef"/><rect x="7" y="7" width="78" height="72" fill="${lin([[0, "#f6c9a6"], [1, "#d68e66"]])}"/>
        <g transform="translate(46 76) scale(.27)">${A.catPose("sit")}</g>
        <text x="46" y="96" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#5a4a40">${esc(SITE.catName)} ♡</text>
        <circle cx="46" cy="4" r="5" fill="#3a7bd5"/><circle cx="44.5" cy="2.5" r="1.6" fill="#fff" opacity=".7"/>
      </g>
      <g transform="translate(${b.x + 120} ${b.y + 290}) rotate(-8)">
        <rect x="2" y="4" width="96" height="40" fill="#2a160a" opacity=".3" filter="url(#blur4)"/>
        <rect width="96" height="40" fill="#e9784f"/><line x1="26" y1="0" x2="26" y2="40" stroke="#fbe3c8" stroke-dasharray="3 3"/>
        <text x="62" y="18" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="11" fill="#fbe3c8">ADMIT</text>
        <text x="62" y="31" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="11" fill="#fbe3c8">ONE</text>
      </g>`;
    return `<g class="hot" data-hot="board">
      <rect x="${b.x + 8}" y="${b.y + 14}" width="${b.w}" height="${b.h}" rx="8" fill="#3a2010" opacity=".45" filter="url(#blur10)"/>
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="7" fill="${frame}"/>
      <rect x="${b.x + 2}" y="${b.y + 2}" width="${b.w - 4}" height="3" rx="1.5" fill="#c08a5c" opacity=".7"/>
      <rect x="${b.x + 14}" y="${b.y + 14}" width="${b.w - 28}" height="${b.h - 28}" fill="${lin([[0, "#cf9a62"], [1, "#b57d48"]], 0, 0, 1, 1)}"/>
      ${speck}
      <rect x="${b.x + 14}" y="${b.y + 14}" width="${b.w - 28}" height="${b.h - 28}" fill="none" stroke="#3a2010" stroke-opacity=".5" stroke-width="6" filter="url(#blur4)"/>
      ${deco}
      <g transform="translate(${b.x + b.w / 2} ${b.y + 40}) rotate(-2)">
        <rect x="-88" y="-20" width="176" height="40" fill="#2a160a" opacity=".3" filter="url(#blur4)"/>
        <rect x="-90" y="-22" width="180" height="40" fill="#fbf3e4"/>
        <text y="7" text-anchor="middle" font-family="Caveat, cursive" font-size="27" font-weight="700" fill="#8a4a2e">leave a note!</text>
        <circle cx="-78" cy="-12" r="4.5" fill="#d9473b"/><circle cx="78" cy="-12" r="4.5" fill="#e0a43b"/>
      </g>
      <g id="notes"></g>
    </g>`;
  }

  function stringLights() {
    const pts = [[30, 44], [140, 70], [230, 46], [330, 70], [430, 46]];
    let d = `M${pts[0]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      d += ` Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 12} ${x1} ${y1}`;
    }
    let bulbs = "";
    const cols = ["#ffd27a", "#ffb27a", "#fff0c0", "#ffc7a0"];
    for (let i = 0; i < 14; i++) {
      const t = i / 13, x = 30 + t * 400;
      const seg = Math.min(3, Math.floor(t * 4)), lt = t * 4 - seg;
      const [x0, y0] = pts[seg], [x1, y1] = pts[seg + 1];
      const cy = Math.max(y0, y1) + 12;
      const y = (1 - lt) ** 2 * y0 + 2 * (1 - lt) * lt * cy + lt * lt * y1;
      bulbs += `<g class="bulb" style="animation-delay:${-i * 0.37}s"><circle cx="${x}" cy="${y + 8}" r="16" fill="${cols[i % 4]}" opacity=".35" filter="url(#blur6)"/>
        <ellipse cx="${x}" cy="${y + 8}" rx="4.5" ry="6" fill="${cols[i % 4]}"/><ellipse cx="${x - 1.2}" cy="${y + 6}" rx="1.6" ry="2.4" fill="#fff"/></g>`;
    }
    return { wire: `<path d="${d}" stroke="#2e1d12" stroke-width="1.6" fill="none"/>`, bulbs };
  }

  function counter() {
    const c = CNT, k = c.k;
    const fl = c.x0, fr = c.x1, ft = c.top, fb = c.bot;
    const bl = P(fl - 8, ft, k), br = P(fr + 8, ft, k);
    let s = "";
    // floor shadow
    s += `<ellipse cx="${(fl + fr) / 2 + 20}" cy="${fb + 4}" rx="${(fr - fl) / 2 + 40}" ry="18" fill="#000" opacity=".45" filter="url(#blur10)"/>`;
    // right side
    s += poly([[fr, ft], P(fr, ft, k), P(fr, fb, k), [fr, fb]], lin([[0, "#7d8f6b"], [1, "#56664a"]], 0, 0, 1, 0));
    // body
    s += `<rect x="${fl}" y="${ft + 14}" width="${fr - fl}" height="${fb - ft - 26}" fill="${lin([[0, "#b6c5a3"], [1, "#8fa07c"]])}"/>`;
    [[fl + 14, (fl + fr) / 2 - 6], [(fl + fr) / 2 + 6, fr - 14]].forEach(([a, b], j) => {
      s += `<rect x="${a}" y="${ft + 30}" width="${b - a}" height="${fb - ft - 60}" rx="3" fill="${lin([[0, "#bccaa9"], [1, "#98a986"]])}" stroke="#6f805e" stroke-opacity=".6"/>`;
      s += `<rect x="${a + 12}" y="${ft + 44}" width="${b - a - 24}" height="${fb - ft - 88}" rx="2" fill="none" stroke="#fff" stroke-opacity=".25"/>`;
      const kx = j ? a + 16 : b - 16;
      s += `<circle cx="${kx}" cy="${ft + 120}" r="6" fill="${rad([[0, "#ffe7a8"], [1, "#a8782e"]], 0.35, 0.35, 0.7)}"/>`;
    });
    s += `<rect x="${fl}" y="${fb - 12}" width="${fr - fl}" height="12" fill="#3e4a33"/>`;
    // top surface + edge (butcher block)
    s += poly([[fl - 8, ft], [fr + 8, ft], br, bl], lin([[0, "#b58153"], [1, "#d9a873"]]));
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      s += `<line x1="${fl - 8 + (fr - fl + 16) * t}" y1="${ft}" x2="${bl[0] + (br[0] - bl[0]) * t}" y2="${bl[1]}" stroke="#8e5f37" stroke-opacity=".35"/>`;
    }
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="16" fill="${lin([[0, "#e2b07a"], [1, "#a8743f"]])}"/>`;
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="2" fill="#f6cf9a"/>`;
    return s;
  }

  function machine() {
    const m = MACH, k = 0.07;
    const side = [[m.x1, m.y0 + 8], P(m.x1, m.y0 + 8, k), P(m.x1, m.y1, k), [m.x1, m.y1]];
    const top = [[m.x0, m.y0 + 8], [m.x1, m.y0 + 8], P(m.x1, m.y0 + 8, k), P(m.x0, m.y0 + 8, k)];
    const chrome = lin([[0, "#f4f2ee"], [0.35, "#a9a49c"], [0.55, "#e9e6e0"], [1, "#6d6862"]]);
    const chromeH = lin([[0, "#7a756e"], [0.3, "#f2efe9"], [0.6, "#a29d95"], [1, "#e0ddd6"]], 0, 0, 1, 0);
    return `<g class="hot" data-hot="machine">
      <ellipse cx="${(m.x0 + m.x1) / 2 + 14}" cy="${m.y1 + 2}" rx="${(m.x1 - m.x0) / 2 + 16}" ry="7" fill="#000" opacity=".4" filter="url(#blur4)"/>
      ${poly(side, lin([[0, "#cbb898"], [1, "#a8977a"]], 0, 0, 1, 0))}
      ${poly(top, "#3a3330")}
      <path d="M${top[3][0] + 6} ${top[3][1] - 2} H${top[2][0] - 6}" stroke="#d9d5cf" stroke-width="3"/>
      <rect x="${m.x0}" y="${m.y0 + 8}" width="${m.x1 - m.x0}" height="${m.y1 - m.y0 - 8}" rx="10" fill="${lin([[0, "#fbf1de"], [0.6, "#eadbc0"], [1, "#d6c3a2"]])}"/>
      <rect x="${m.x0 + 4}" y="${m.y0 + 12}" width="${m.x1 - m.x0 - 8}" height="6" rx="3" fill="#fff" opacity=".5"/>
      <rect x="${m.x0}" y="${m.y0 + 40}" width="${m.x1 - m.x0}" height="9" fill="${lin([[0, "#e7774d"], [1, "#b8502e"]])}"/>
      <g transform="translate(${m.x0 + 34} ${m.y0 + 80})">
        <circle r="20" fill="${chrome}"/><circle r="15.5" fill="#fbf8f1"/>
        <path d="M-10 6 A12 12 0 1 1 10 6" stroke="#c9c2b6" stroke-width="1.5" fill="none"/>
        <line x1="0" y1="0" x2="7" y2="-9" stroke="#c0392b" stroke-width="2" stroke-linecap="round"/><circle r="2.5" fill="#333"/>
        <circle r="15.5" fill="${lin([[0, "#fff", 0.6], [0.5, "#fff", 0]], 0, 0, 1, 1)}"/>
      </g>
      <rect x="${m.x0 + 68}" y="${m.y0 + 60}" width="84" height="78" rx="8" fill="${lin([[0, "#1e1917"], [1, "#3a3330"]])}"/>
      <rect x="${m.x0 + 86}" y="${m.y0 + 62}" width="48" height="18" rx="4" fill="${chromeH}"/>
      <rect x="${m.x0 + 92}" y="${m.y0 + 80}" width="36" height="7" rx="2" fill="#2a2523"/>
      <path d="M${m.x0 + 126} ${m.y0 + 83} L${m.x0 + 168} ${m.y0 + 93}" stroke="#141010" stroke-width="9" stroke-linecap="round"/>
      <path d="M${m.x0 + 130} ${m.y0 + 82} L${m.x0 + 164} ${m.y0 + 90}" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>
      <rect x="${m.x0 + 64}" y="${m.y1 - 12}" width="92" height="10" rx="2" fill="${chrome}"/>
      <path d="M${m.x0 + 70} ${m.y1 - 8} H${m.x0 + 150}" stroke="#555" stroke-dasharray="2 3"/>
      <path d="M${m.x0 + 2} ${m.y0 + 66} q-14 4 -14 22 v34" stroke="${chromeH}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="${m.x1 - 22}" cy="${m.y0 + 72}" r="7" fill="${chrome}"/><circle cx="${m.x1 - 22}" cy="${m.y0 + 92}" r="7" fill="${chrome}"/>
      <g transform="translate(${top[3][0] + 18} ${top[3][1] - 2})">
        <path d="M0 0 h22 l-3 -14 h-16 z" fill="#f6efe4"/><path d="M28 0 h22 l-3 -14 h-16 z" fill="#e9a98a"/>
      </g>
      <g id="brew">
        <rect id="brew-stream" x="${m.x0 + 108}" y="${m.y0 + 87}" width="4" height="40" rx="2" fill="#4a2c18" opacity="0"/>
        <g id="brew-cup" opacity="0" transform="translate(${m.x0 + 110} ${m.y1 - 12})">${cupMarkup("coffee", "brewcup")}</g>
      </g>
    </g>`;
  }

  const DRINKS = {
    matcha: { name: "matcha latte", liquid: "#8db45a", top: "#bcd690", stream: "#9cc066" },
    cappuccino: { name: "cappuccino", liquid: "#a8714a", top: "#f2dfc4", stream: "#6a3e22", milk: true },
    coffee: { name: "coffee", liquid: "#3b2416", top: "#6a4026", stream: "#3e2414" }
  };
  const CUP_CACHE = {};
  function cupMarkup(kind, idp) {
    const key = kind + (idp || "");
    if (CUP_CACHE[key]) return CUP_CACHE[key];
    const d = DRINKS[kind];
    return (CUP_CACHE[key] = cupInner(d, idp));
  }
  function cupInner(d, idp) {
    return `<ellipse cx="0" cy="0" rx="22" ry="5" fill="#000" opacity=".3" filter="url(#blur2)"/>
      <ellipse cx="0" cy="-1" rx="20" ry="4.5" fill="${lin([[0, "#fff"], [1, "#d7cfc2"]])}"/>
      <path d="M12 -22 q12 0 12 9 q0 8 -12 7" stroke="#efe9e0" stroke-width="4" fill="none"/>
      <path d="M-15 -28 h30 l-3 24 q-12 5 -24 0 z" fill="${lin([[0, "#d9d1c4"], [0.35, "#ffffff"], [1, "#cfc6b8"]], 0, 0, 1, 0)}"/>
      <ellipse cx="0" cy="-28" rx="15" ry="3.6" fill="#f4efe8"/>
      <ellipse ${idp ? `id="${idp}-liq"` : ""} cx="0" cy="-27.5" rx="13" ry="2.8" fill="${d.top}"/>
      ${d.milk ? `<path d="M-3 -28 q3 -2 3 0 q0 -2 3 0 l-3 2 z" fill="#c89a70"/>` : ""}`;
  }

  function cabinet() {
    const c = CAB, k = c.k;
    const ft = c.top, fb = c.bot, fl = c.x0, fr = c.x1;
    const bl = P(fl - 8, ft, k), br = P(fr + 8, ft, k);
    const wood = lin([[0, "#4a3326"], [1, "#2e1f17"]]);
    let s = "";
    s += `<ellipse cx="${(fl + fr) / 2 + 30}" cy="${fb + 2}" rx="${(fr - fl) / 2 + 50}" ry="20" fill="#000" opacity=".5" filter="url(#blur10)"/>`;
    s += `<rect x="${fl + 14}" y="${fb - 14}" width="16" height="14" fill="#1e140e"/><rect x="${fr - 30}" y="${fb - 14}" width="16" height="14" fill="#1e140e"/>`;
    s += `<rect x="${fl}" y="${ft + 14}" width="${fr - fl}" height="${fb - ft - 28}" fill="${wood}"/>`;
    // cubbies with real depth
    [CUBL, CUBR].forEach((u) => {
      const kk = 0.09;
      const A0 = [u.x0, u.y0], A1 = [u.x1, u.y0], A2 = [u.x1, u.y1], A3 = [u.x0, u.y1];
      const B0 = P(...A0, kk), B1 = P(...A1, kk), B2 = P(...A2, kk), B3 = P(...A3, kk);
      s += poly([A0, A1, A2, A3], "#120b07");
      s += poly([B0, B1, B2, B3], lin([[0, "#1d130d"], [1, "#2a1c14"]]));
      s += poly([A3, A2, B2, B3], lin([[0, "#5a4030"], [1, "#3a281c"]], 0, 1, 0, 0));
      s += poly([A0, B0, B3, A3], "#20150e");
      s += poly([A1, B1, B2, A2], "#2c1e15");
      s += poly([A0, A1, B1, B0], "#0c0704");
      s += `<rect x="${u.x0}" y="${u.y0}" width="${u.x1 - u.x0}" height="${u.y1 - u.y0}" fill="none" stroke="#5c4232" stroke-width="2"/>`;
    });
    // right cubby contents: books
    const r = rng(19);
    const bc = ["#b9553e", "#e2b65e", "#4f6f99", "#e7ddcb", "#6f8f52", "#8f4a6a", "#d4874a", "#2f4a5a"];
    let x = CUBR.x0 + 18;
    while (x < CUBR.x1 - 120) {
      const w = 12 + Math.floor(r() * 10), h = 70 + Math.floor(r() * 36), col = bc[Math.floor(r() * bc.length)];
      const y1 = CUBR.y1 - 6;
      s += `<rect x="${x}" y="${y1 - h}" width="${w}" height="${h}" rx="1.5" fill="${col}"/>`;
      s += `<rect x="${x}" y="${y1 - h}" width="${w}" height="${h}" fill="${lin([[0, "#000", 0.3], [0.3, "#fff", 0.12], [1, "#000", 0.35]], 0, 0, 1, 0)}"/>`;
      if (r() < 0.6) s += `<rect x="${x + 2}" y="${y1 - h + 12}" width="${w - 4}" height="4" fill="#f4e6c8" opacity=".8"/>`;
      x += w + 1;
    }
    // leaning book + horizontal stack
    s += `<rect x="${x + 4}" y="${CUBR.y1 - 98}" width="14" height="92" fill="#c2603f" transform="rotate(14 ${x + 4} ${CUBR.y1 - 6})"/>`;
    let y = CUBR.y1 - 6;
    [["#e7ddcb", 74, 14], ["#4f6f99", 66, 12], ["#e2b65e", 70, 13]].forEach(([col, w, h]) => {
      y -= h;
      s += `<rect x="${CUBR.x1 - 96}" y="${y}" width="${w}" height="${h}" rx="2" fill="${col}"/><rect x="${CUBR.x1 - 96}" y="${y}" width="${w}" height="3" fill="#fff" opacity=".25"/>`;
    });
    // top slab
    s += poly([[fl - 8, ft], [fr + 8, ft], br, bl], lin([[0, "#6a4a36"], [1, "#4a3426"]], 0, 1, 0, 0));
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="14" fill="${lin([[0, "#8a6248"], [1, "#4a3426"]])}"/>`;
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="2" fill="#a77c5c"/>`;
    return s;
  }

  function books() {
    let s = "", y = 630;
    [["#3e5c94", 150, 18, 0], ["#efc65c", 138, 15, 8], ["#e9ddc8", 120, 12, 4]].forEach(([col, w, h, off]) => {
      const x0 = 890 + off, x1 = x0 + w, k = 0.055;
      const tl = P(x0, y - h, k), tr = P(x1, y - h, k);
      s += poly([[x0, y - h], [x1, y - h], tr, tl], col, `opacity=".95"`);
      s += poly([[x0, y - h], [x1, y - h], tr, tl], "#fff", `opacity=".2"`);
      s += `<rect x="${x0}" y="${y - h}" width="${w}" height="${h}" fill="${col}"/>`;
      s += `<rect x="${x0}" y="${y - h}" width="${w}" height="${h}" fill="${lin([[0, "#000", 0], [1, "#000", 0.25]])}"/>`;
      s += `<rect x="${x1 - 6}" y="${y - h + 2}" width="5" height="${h - 4}" fill="#f6efe2"/>`;
      y -= h;
    });
    // swirl pattern on the yellow book's spine
    s += `<path d="M905 607 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#e2557a" stroke-width="2.5" fill="none"/>`;
    // a small mug on top
    s += `<g transform="translate(960 ${y})">${cupMarkup("coffee")}</g>`;
    return s;
  }

  function plant() {
    const x = 1218, y = 626;
    let leaves = "";
    const r = rng(8);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.2, len = 30 + r() * 26;
      const ex = x + Math.cos(a) * len, ey = y - 46 + Math.sin(a) * len;
      leaves += `<path d="M${x} ${y - 44} Q${(x + ex) / 2 + 8} ${(y - 44 + ey) / 2 - 6} ${ex} ${ey}" stroke="#4a6e3a" stroke-width="2" fill="none"/>`;
      leaves += `<ellipse cx="${ex}" cy="${ey}" rx="13" ry="7" transform="rotate(${(a * 180) / Math.PI} ${ex} ${ey})" fill="${i % 2 ? "#5f8a48" : "#7aa65a"}"/>`;
    }
    // trailing vine over the edge
    leaves += `<path d="M${x + 14} ${y - 40} C${x + 40} ${y - 10} ${x + 36} ${y + 40} ${x + 30} ${y + 90}" stroke="#4a6e3a" stroke-width="2" fill="none"/>`;
    for (let i = 0; i < 7; i++) leaves += `<ellipse cx="${x + 32 + Math.sin(i) * 6}" cy="${y - 20 + i * 15}" rx="7" ry="5" fill="${i % 2 ? "#5f8a48" : "#7aa65a"}"/>`;
    return `<ellipse cx="${x + 4}" cy="${y + 2}" rx="30" ry="6" fill="#000" opacity=".4" filter="url(#blur4)"/>
      ${leaves}
      <path d="M${x - 24} ${y - 44} h48 l-6 44 h-36 z" fill="${lin([[0, "#d2774e"], [1, "#a4502e"]], 0, 0, 1, 0)}"/>
      <rect x="${x - 27}" y="${y - 50}" width="54" height="9" rx="2" fill="#dc8a5e"/>`;
  }

  function turntable() {
    const fl = 580, fr = 840, ft = 606, fb = 634, k = 0.1;
    const tl = P(fl, ft, k), tr = P(fr, ft, k);
    const sc = PLAT.ry / PLAT.rx;
    const lid = [P(fl + 4, ft, k), P(fr - 4, ft, k), [tr[0] - 6, tr[1] - 96], [tl[0] + 6, tl[1] - 96]];
    return `<g class="hot" data-hot="turntable">
      <ellipse cx="${(fl + fr) / 2 + 10}" cy="${fb + 2}" rx="${(fr - fl) / 2 + 12}" ry="6" fill="#000" opacity=".45" filter="url(#blur4)"/>
      ${poly(lid, lin([[0, "#fff", 0.1], [1, "#fff", 0.03]]), `stroke="#fff" stroke-opacity=".28" stroke-width="1.5"`)}
      <line x1="${lid[3][0] + 10}" y1="${lid[3][1] + 8}" x2="${lid[0][0] + 30}" y2="${lid[0][1] - 10}" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
      ${poly([[fl, ft], [fr, ft], tr, tl], lin([[0, "#262120"], [1, "#3c3532"]], 0, 1, 0, 0))}
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="${fb - ft}" rx="2" fill="${lin([[0, "#e9e5de"], [0.5, "#c9c3ba"], [1, "#9e978d"]])}"/>
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="1.5" fill="#fff"/>
      <circle cx="${fl + 18}" cy="${ft + 14}" r="4" fill="#5a5450"/><circle cx="${fl + 32}" cy="${ft + 14}" r="4" fill="#5a5450"/>
      <circle id="tt-led" cx="${fl + 46}" cy="${ft + 14}" r="2.4" fill="#5a2a2a"/>
      <text x="${fr - 14}" y="${ft + 18}" text-anchor="end" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="2" fill="#6d665e">AUDIO</text>
      <g transform="translate(${PLAT.x} ${PLAT.y})">
        <ellipse cx="0" cy="3" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="#8f8a83"/>
        <ellipse cx="0" cy="0" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="${lin([[0, "#e8e4de"], [1, "#a9a39b"]], 0, 0, 1, 0)}"/>
        <ellipse cx="0" cy="-.5" rx="${PLAT.rx - 4}" ry="${PLAT.ry - 1}" fill="#2a2524"/>
        <g id="platter-disc" transform="scale(${(PLAT.rx - 6) / 50} ${((PLAT.rx - 6) / 50) * sc})" opacity="0"></g>
        <ellipse cx="0" cy="-1" rx="3" ry="1" fill="#ddd"/>
        <g transform="scale(1 ${sc})">
          <g id="tonearm" transform="rotate(0 112 -70)">
            <line x1="112" y1="-70" x2="112" y2="50" stroke="#e6e1d9" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
            <rect x="104" y="44" width="16" height="22" rx="3" fill="#2e2a28"/>
          </g>
        </g>
      </g>
      <ellipse cx="${PLAT.x + 112}" cy="${PLAT.y - 70 * sc - 2}" rx="9" ry="4" fill="#8f8a83"/>
      <rect x="${PLAT.x + 107}" y="${PLAT.y - 70 * sc - 14}" width="10" height="12" rx="3" fill="${lin([[0, "#f4f1ec"], [1, "#8f8a83"]], 0, 0, 1, 0)}"/>
      <rect x="${PLAT.x + 120}" y="${PLAT.y + 48 * sc - 9}" width="4" height="9" fill="#8f8a83"/>
    </g>`;
  }

  function lampMarkup() {
    const x = LAMP.x, b = LAMP.base;
    return `<g class="hot" data-hot="lamp">
      <ellipse cx="${x + 8}" cy="${b + 3}" rx="54" ry="8" fill="#000" opacity=".45" filter="url(#blur4)"/>
      <ellipse cx="${x}" cy="${b - 3}" rx="44" ry="9" fill="${lin([[0, "#f6c9a0"], [1, "#d48c62"]])}"/>
      <ellipse cx="${x}" cy="${b - 6}" rx="40" ry="6" fill="#f8d4b0"/>
      <rect x="${x - 5}" y="500" width="10" height="${b - 504}" rx="4" fill="${lin([[0, "#8e2a1c"], [0.4, "#e0533c"], [1, "#9a2e1e"]], 0, 0, 1, 0)}"/>
      <path d="M${x - 58} 478 Q${x - 60} 500 ${x - 40} 504 L${x + 40} 504 Q${x + 60} 500 ${x + 58} 478 Z" class="lamp-band" fill="${lin([[0, "#f2e4cc"], [1, "#cdb898"]])}"/>
      <path d="M${x - 64} 480 C${x - 66} 444 ${x - 36} 430 ${x} 430 C${x + 36} 430 ${x + 66} 444 ${x + 64} 480 Z" fill="${lin([[0, "#c7643a"], [0.5, "#8e3c1e"], [1, "#5e2410"]], 0, 0, 1, 1)}"/>
      <path d="M${x - 46} 456 C${x - 40} 440 ${x - 16} 434 ${x} 436" stroke="#ffd2a8" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${x}" cy="480" rx="64" ry="5" fill="#4a1c0c"/>
    </g>`;
  }

  function lampEmissive() {
    const x = LAMP.x;
    return `<g class="lamp-emit">
      <ellipse cx="${x}" cy="492" rx="90" ry="34" fill="#ffd9a0" opacity=".55" filter="url(#blur14)"/>
      <path d="M${x - 58} 480 Q${x - 60} 500 ${x - 40} 504 L${x + 40} 504 Q${x + 60} 500 ${x + 58} 478 Z" fill="${lin([[0, "#fffdf4"], [1, "#ffe0a8"]])}"/>
      <ellipse cx="${x}" cy="481" rx="62" ry="4" fill="#4a1c0c"/>
    </g>`;
  }

  function door() {
    const x0 = 1400, x1 = 1590, y0 = 170;
    let slats = "";
    for (let y = y0 + 36; y < 420; y += 9) slats += `<rect x="${x0 + 34}" y="${y}" width="${x1 - x0 - 68}" height="6" fill="${lin([[0, "#f4ebdd"], [1, "#d3c4ad"]])}"/><rect x="${x0 + 34}" y="${y + 6}" width="${x1 - x0 - 68}" height="3" fill="#b8a68b"/>`;
    return `<rect x="${x0 - 18}" y="${y0 - 18}" width="${x1 - x0 + 36}" height="${FLOOR - y0 + 18}" fill="${lin([[0, "#f6ead7"], [1, "#d9c6a8"]], 0, 0, 1, 0)}"/>
      <rect x="${x0 - 2}" y="${y0 - 2}" width="${x1 - x0 + 4}" height="${FLOOR - y0 + 2}" fill="#a7927a"/>
      <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${FLOOR - y0}" fill="${lin([[0, "#f2e7d6"], [1, "#e0d0b8"]], 0, 0, 1, 0)}"/>
      <rect x="${x0 + 26}" y="${y0 + 26}" width="${x1 - x0 - 52}" height="${420 - y0 - 18}" fill="#c7b59b"/>
      ${slats}
      <rect x="${x0 + 26}" y="450" width="${x1 - x0 - 52}" height="${FLOOR - 480}" fill="${lin([[0, "#e9dcc8"], [1, "#d6c4a8"]], 0, 0, 1, 1)}" stroke="#b49f84" stroke-width="2"/>
      <rect x="${x0 + 34}" y="458" width="${x1 - x0 - 68}" height="${FLOOR - 496}" fill="none" stroke="#fff" stroke-opacity=".4"/>
      <circle cx="${x0 + 18}" cy="460" r="7" fill="${rad([[0, "#ffe4a0"], [1, "#9a6a2a"]], 0.35, 0.35, 0.7)}"/>`;
  }

  function donutLamp() {
    const cx = 1314, cy = 250;
    return {
      wall: `<path d="M${cx + 8} ${cy + 60} C${cx + 14} 400 ${cx + 2} 600 ${cx + 10} ${FLOOR - 24}" stroke="#4a2c1c" stroke-width="2" fill="none"/>`,
      emit: `<g class="donut"><circle cx="${cx}" cy="${cy}" r="120" fill="#ff8c3a" opacity=".35" filter="url(#blur30)"/>
        <circle cx="${cx}" cy="${cy}" r="62" fill="${rad([[0, "#ffd08a"], [0.35, "#ffb05a"], [0.8, "#ff8a36"], [1, "#f06a24"]])}"/>
        <circle cx="${cx}" cy="${cy}" r="11" fill="#b84a1a"/></g>`
    };
  }

  function catCorner() {
    const bx = 1330, by = 868;
    return `<ellipse cx="${bx}" cy="${by + 8}" rx="112" ry="22" fill="#000" opacity=".4" filter="url(#blur8)"/>
      <ellipse cx="${bx}" cy="${by}" rx="104" ry="26" fill="${lin([[0, "#9a6a8a"], [1, "#6a3e5e"]])}"/>
      <ellipse cx="${bx}" cy="${by - 6}" rx="84" ry="17" fill="${lin([[0, "#e9b9c6"], [1, "#d39aab"]])}"/>
      <ellipse cx="${bx}" cy="${by - 10}" rx="104" ry="18" fill="none" stroke="#b483a3" stroke-width="6"/>
      ${bowl(1450, 872, "#4f7fa6", "#9fd3f2")}
      ${bowl(1530, 876, "#b5453a", "#8a5a2e", true)}`;
  }
  function bowl(x, y, col, fill, kibble) {
    const r = rng(x);
    let k = "";
    if (kibble) for (let i = 0; i < 14; i++) k += `<circle cx="${x - 18 + r() * 36}" cy="${y - 15 + r() * 6}" r="2.6" fill="${["#8a5a2e", "#a8743a", "#6a4220"][i % 3]}"/>`;
    return `<ellipse cx="${x + 4}" cy="${y + 2}" rx="36" ry="7" fill="#000" opacity=".4" filter="url(#blur4)"/>
      <path d="M${x - 30} ${y - 14} L${x - 24} ${y} Q${x} ${y + 6} ${x + 24} ${y} L${x + 30} ${y - 14} Z" fill="${lin([[0, col], [0.5, "#fff"], [1, col]], 0, 0, 1, 0)}" opacity=".95"/>
      <path d="M${x - 30} ${y - 14} L${x - 24} ${y} Q${x} ${y + 6} ${x + 24} ${y} L${x + 30} ${y - 14} Z" fill="${col}" opacity=".7"/>
      <ellipse cx="${x}" cy="${y - 14}" rx="30" ry="7" fill="${lin([[0, "#f6f0e6"], [1, "#d8cfc2"]])}"/>
      <ellipse cx="${x}" cy="${y - 13.5}" rx="25" ry="5" fill="${fill}"/>${k}`;
  }

  function sleeves() {
    return music.map((m, i) => {
      const x = sleeveX(i), y = SLEEVE_BOT - SLEEVE;
      return `<g class="hot" data-hot="music" data-i="${i}"><g class="lift">
        <rect x="${x + 4}" y="${y + 4}" width="${SLEEVE}" height="${SLEEVE}" fill="#000" opacity=".5" filter="url(#blur4)"/>
        <g id="sleeve-disc-${i}" transform="translate(${x + SLEEVE / 2} ${y + SLEEVE / 2}) scale(${(SLEEVE * 0.46) / 50})">${vinylMarkup(m)}</g>
        <g class="sleeve-art" transform="translate(${x} ${y}) scale(${SLEEVE / 100})">${A.cover(m.cover, false)}</g>
      </g></g>`;
    }).join("");
  }

  /* ---------------- lighting ---------------- */
  function lighting() {
    const L = { x: LAMP.x, y: 490 };
    return `
      <g class="light-lamp" style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2400" fill="${rad([[0, "#ff8a30", 0.75], [0.3, "#e8641c", 0.38], [0.65, "#b84a14", 0.12], [1, "#b84a14", 0]], L.x, L.y, 1000, true)}"/>
        <ellipse cx="${L.x}" cy="${L.y - 20}" rx="300" ry="250" fill="${rad([[0, "#ffc27a", 0.6], [1, "#ff9a40", 0]])}"/>
        <ellipse cx="${L.x - 20}" cy="${CAB.top - 12}" rx="330" ry="30" fill="#ffcf8a" opacity=".45" filter="url(#blur14)"/>
        <ellipse cx="${L.x}" cy="${FLOOR + 90}" rx="260" ry="60" fill="#ffb877" opacity=".18" filter="url(#blur30)"/>
      </g>
      <g style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2400" fill="${rad([[0, "#ff8c3a", 0.32], [1, "#ff8c3a", 0]], 1314, 250, 420, true)}"/>
        <rect x="-1400" y="-900" width="4400" height="2400" fill="${rad([[0, "#ffc070", 0.22], [1, "#ffc070", 0]], 230, 80, 380, true)}"/>
      </g>
      <rect x="-1400" y="-900" width="4400" height="2400" style="mix-blend-mode:multiply" fill="#ffc890" opacity=".55"/>
      <rect x="-1400" y="-900" width="4400" height="2400" style="mix-blend-mode:multiply" fill="${rad([[0, "#ffffff", 0], [0.3, "#f2c49a", 0.25], [0.62, "#8a4420", 0.62], [1, "#1e0c04", 0.95]], 1020, 500, 1150, true)}"/>
      <rect class="night" x="-1400" y="-900" width="4400" height="2400" style="mix-blend-mode:multiply" fill="${rad([[0, "#6a5a8a"], [0.5, "#3e3458"], [1, "#1e1830"]], 300, 120, 1700, true)}"/>`;
  }

  /* ---------------- assemble ---------------- */
  A.resetDefs();
  const lights = stringLights();
  const donut = donutLamp();
  const body = `
    ${wall()}
    ${door()}
    ${donut.wall}
    ${sunlight()}
    ${board()}
    ${lights.wire}
    ${Array.from({ length: Math.min(SITE.wallSlots, 8) }, (_, i) => record(i)).join("")}
    ${floor()}
    ${rug()}
    ${counter()}
    ${machine()}
    <g id="served"></g>
    <g transform="translate(318 568) scale(.6)"><path d="M-14 0 h28 v-30 h-28 z" fill="${lin([[0, "#7a9a5a"], [1, "#4e6b3a"]], 0, 0, 1, 0)}"/><rect x="-14" y="-22" width="28" height="9" fill="#f2e8cf"/><rect x="-16" y="-34" width="32" height="6" rx="2" fill="#3e5a2e"/></g>
    <g transform="translate(402 572)"><path d="M-16 0 h32 l4 -26 h-40 z" fill="#c6673e"/><g fill="#6a9a4a"><ellipse cx="-8" cy="-34" rx="9" ry="14" transform="rotate(-25 -8 -34)"/><ellipse cx="8" cy="-36" rx="9" ry="15" transform="rotate(20 8 -36)"/><ellipse cx="0" cy="-44" rx="7" ry="14"/></g></g>
    ${cabinet()}
    ${sleeves()}
    ${books()}
    ${turntable()}
    ${plant()}
    ${lampMarkup()}
    ${catCorner()}
    <g id="cat" class="hot" data-hot="cat"></g>
    <g id="flydisc" opacity="0"></g>
    <g id="overlay" pointer-events="none">${lighting()}</g>
    <g id="emissive" pointer-events="none">
      ${lampEmissive()}
      ${lights.bulbs}
      ${donut.emit}
      <circle id="mach-led" cx="${MACH.x1 - 22}" cy="${MACH.y0 + 30}" r="3" fill="#ff7a4a"/>
      <g id="steam"></g>
      <g id="fx"></g>
    </g>`;

  const filters = `
    ${[2, 4, 6, 8, 10, 14, 30].map((d) => `<filter id="blur${d}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${d / 2}"/></filter>`).join("")}
    <filter id="fur" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;

  const svg = document.getElementById("room");
  // everything that creates gradients at runtime is generated up front
  Object.keys(DRINKS).forEach((k) => { cupMarkup(k); cupMarkup(k, "brewcup"); });
  const NOTE_SHEEN = lin([[0, "#fff", 0.35], [1, "#000", 0.08]], 0, 0, 1, 1);
  // cat poses must be generated before defs are serialized
  const poses = {};
  ["sit", "paw", "walk", "crouch", "sleep"].forEach((p) => (poses[p] = A.catPose(p)));
  const vinyls = music.map((m) => vinylMarkup(m, "spin"));
  svg.innerHTML = `<defs>${filters}${A.defsMarkup()}</defs>${body}`;

  const $ = (sel) => svg.querySelector(sel);
  const catEl = $("#cat");
  catEl.innerHTML = Object.entries(poses).map(([k, v]) => `<g class="pose" data-pose="${k}">${v}</g>`).join("");

  /* ---------------- state ---------------- */
  const S = { lamp: true, disc: null, queue: null, angle: 0, arm: 0, coffee: null, served: [], notes: [], hover: null, t: 0 };

  /* ---------------- records ---------------- */
  const flyEl = $("#flydisc"), platEl = $("#platter-disc"), armEl = $("#tonearm"), ledEl = $("#tt-led");
  const sleevePos = (i) => ({ x: sleeveX(i) + SLEEVE / 2, y: SLEEVE_BOT - SLEEVE / 2 });
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const platScale = (PLAT.rx - 6) / 50, platSy = platScale * (PLAT.ry / PLAT.rx);

  function pickRecord(i) {
    const d = S.disc;
    if (d) {
      if (d.id === i && (d.phase === "play" || d.phase === "arm")) return returnDisc();
      if (d.id === i) return;
      S.queue = i;
      if (d.phase === "play" || d.phase === "arm") returnDisc();
      return;
    }
    startDisc(i);
  }
  function startDisc(i) {
    S.disc = { id: i, phase: "out", t: 0 };
    flyEl.innerHTML = vinyls[i];
    platEl.innerHTML = vinyls[i];
    $(`#sleeve-disc-${i}`).style.opacity = 0;
    svg.querySelector(`[data-hot=music][data-i="${i}"]`).classList.add("empty");
  }
  function returnDisc() {
    if (!S.disc) return;
    AE.stop(); hud(null);
    S.disc.phase = "armUp";
  }
  function discAt(i, t) {
    const s = sleevePos(i), e = ease(t);
    const sc0 = (SLEEVE * 0.46) / 50;
    return {
      x: lerp(s.x, PLAT.x, e), y: lerp(s.y - 30, PLAT.y - 1, e) - Math.sin(Math.PI * t) * 90,
      sx: lerp(sc0, platScale, e), sy: lerp(sc0, platSy, e)
    };
  }
  function updateDisc(dt) {
    const d = S.disc;
    if (!d) return;
    if (d.phase === "arm" || d.phase === "play" || d.phase === "armUp") S.angle += dt * 200;
    const spin = platEl.querySelector("#spin");
    if (spin) spin.setAttribute("transform", `rotate(${S.angle})`);
    switch (d.phase) {
      case "out": {
        d.t = Math.min(1, d.t + dt / 0.35);
        const s = sleevePos(d.id), sc = (SLEEVE * 0.46) / 50;
        flyEl.setAttribute("opacity", 1);
        flyEl.setAttribute("transform", `translate(${s.x} ${s.y - ease(d.t) * 30}) scale(${sc})`);
        if (d.t >= 1) { d.phase = "fly"; d.t = 0; }
        break;
      }
      case "fly": case "back": {
        d.t = d.phase === "fly" ? Math.min(1, d.t + dt / 0.9) : Math.max(0, d.t - dt / 0.8);
        const p = discAt(d.id, d.t);
        flyEl.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${p.sx} ${p.sy})`);
        if (d.phase === "fly" && d.t >= 1) { d.phase = "arm"; flyEl.setAttribute("opacity", 0); platEl.setAttribute("opacity", 1); AE.sfx("thump"); }
        if (d.phase === "back" && d.t <= 0) { d.phase = "in"; d.t = 1; }
        break;
      }
      case "arm":
        S.arm = Math.min(1, S.arm + dt / 0.7);
        if (S.arm >= 1) { d.phase = "play"; AE.play(music[d.id]); hud(music[d.id]); ledEl.setAttribute("fill", "#7dff8a"); }
        break;
      case "armUp":
        ledEl.setAttribute("fill", "#5a2a2a");
        S.arm = Math.max(0, S.arm - dt / 0.45);
        if (S.arm <= 0) { d.phase = "back"; d.t = 1; platEl.setAttribute("opacity", 0); flyEl.setAttribute("opacity", 1); }
        break;
      case "in": {
        d.t = Math.max(0, d.t - dt / 0.35);
        const s = sleevePos(d.id), sc = (SLEEVE * 0.46) / 50;
        flyEl.setAttribute("transform", `translate(${s.x} ${s.y - ease(d.t) * 30}) scale(${sc})`);
        if (d.t <= 0) {
          flyEl.setAttribute("opacity", 0);
          $(`#sleeve-disc-${d.id}`).style.opacity = 1;
          svg.querySelector(`[data-hot=music][data-i="${d.id}"]`).classList.remove("empty");
          S.disc = null;
          if (S.queue !== null) { const q = S.queue; S.queue = null; startDisc(q); }
        }
        break;
      }
    }
    armEl.setAttribute("transform", `rotate(${ease(S.arm) * 32} 112 -70)`);
  }

  /* ---------------- cat ---------------- */
  const cat = { x: SPOTS.sleep.x, state: "sleep", timer: 14, dir: 1, target: 0, next: null, pet: 0 };
  function showPose(name) {
    catEl.querySelectorAll(".pose").forEach((g) => (g.style.display = g.dataset.pose === name ? "" : "none"));
    catEl.dataset.state = cat.state;
  }
  function catPoseName() {
    return { sleep: "sleep", walk: "walk", eat: "crouch", drink: "crouch", play: "paw", sit: "sit" }[cat.state] || "sit";
  }
  function catPick() {
    const opts = ["sleep", "drink", "eat", "play", "sit"].filter((s) => s !== cat.state);
    cat.next = opts[Math.floor(Math.random() * opts.length)];
    const spot = SPOTS[cat.next] || { x: 1180 + Math.random() * 120 };
    cat.target = spot.x;
    cat.state = "walk"; showPose("walk");
  }
  function updateCat(dt) {
    cat.pet = Math.max(0, cat.pet - dt);
    if (cat.state === "walk") {
      const d = cat.target - cat.x;
      cat.dir = d >= 0 ? 1 : -1;
      cat.x += Math.sign(d) * Math.min(Math.abs(d), dt * 70);
      if (Math.abs(d) < 0.5) {
        cat.state = cat.next;
        cat.dir = (SPOTS[cat.state] || { dir: cat.x > 1300 ? -1 : 1 }).dir;
        cat.timer = cat.state === "sleep" ? 20 + Math.random() * 15 : 9 + Math.random() * 6;
        showPose(catPoseName());
      }
    } else {
      if (cat.pet <= 0) cat.timer -= dt;
      if (cat.timer <= 0) catPick();
      if (cat.state === "sleep" && Math.random() < dt * 0.5) spawn("z", cat.x - 60, CAT_GROUND - 80);
    }
    const gy = cat.state === "sleep" ? CAT_GROUND - 4 : CAT_GROUND;
    const bob = cat.state === "walk" ? Math.abs(Math.sin(S.t * 9)) * -2 : 0;
    catEl.setAttribute("transform", `translate(${cat.x.toFixed(1)} ${gy + bob}) scale(${CAT_SCALE * cat.dir} ${CAT_SCALE})`);
  }
  function petCat() {
    cat.pet = 2.5;
    for (let i = 0; i < 4; i++) setTimeout(() => spawn("heart", cat.x - 20 + Math.random() * 40, CAT_GROUND - 120), i * 140);
    AE.sfx("purr");
    if (cat.state !== "sleep" && Math.random() < 0.5) setTimeout(() => AE.sfx("meow"), 700);
  }
  // a ball of yarn for play time
  const yarnEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
  yarnEl.innerHTML = `<ellipse cx="0" cy="2" rx="14" ry="3" fill="#000" opacity=".3"/><circle cx="0" cy="-10" r="12" fill="#e0607e"/>
    <path d="M-10 -14 q10 -6 20 2 M-11 -6 q11 -8 22 0 M-6 -20 q4 10 0 20" stroke="#b03a5a" stroke-width="1.6" fill="none"/>
    <path d="M10 -4 q20 10 40 4" stroke="#e0607e" stroke-width="1.6" fill="none"/>`;
  catEl.parentNode.insertBefore(yarnEl, catEl);

  /* ---------------- coffee ---------------- */
  const streamEl = $("#brew-stream"), brewCup = $("#brew-cup"), servedEl = $("#served"), steamEl = $("#steam"), machLed = $("#mach-led");
  function brew(kind) {
    if (S.coffee) return;
    S.coffee = { kind, t: 0 };
    brewCup.innerHTML = cupMarkup(kind, "brewcup");
    brewCup.setAttribute("opacity", 1);
    $("#brewcup-liq").setAttribute("opacity", 0);
    machLed.setAttribute("fill", "#7dff8a");
    AE.sfx("brew");
  }
  function updateCoffee(dt) {
    const co = S.coffee; if (!co) return;
    co.t += dt;
    const d = DRINKS[co.kind];
    const pouring = co.t > 0.6 && co.t < 2.7;
    streamEl.setAttribute("opacity", pouring ? 0.85 + Math.sin(co.t * 40) * 0.1 : 0);
    streamEl.setAttribute("fill", d.milk && co.t > 1.9 ? "#f2e8d8" : d.stream);
    $("#brewcup-liq").setAttribute("opacity", Math.max(0, Math.min(1, (co.t - 0.8) / 1.6)));
    if (co.t > 3.1) {
      S.served.push(co.kind);
      if (S.served.length > CUP_SLOTS.length) S.served.shift();
      S.coffee = null;
      brewCup.setAttribute("opacity", 0); machLed.setAttribute("fill", "#ff7a4a");
      renderServed();
      toast(`one ${d.name}, freshly made ♡`);
    }
  }
  function renderServed() {
    servedEl.innerHTML = S.served.map((k, i) =>
      `<g class="hot" data-hot="cup" data-i="${i}" transform="translate(${CUP_SLOTS[i]} 596)">${cupMarkup(k)}
        <g class="steam-wisps">${[0, 1, 2].map((j) => `<path class="wisp" style="animation-delay:${-j * 0.9}s" d="M${-6 + j * 6} -34 q-6 -10 0 -20 t0 -20" stroke="#fff8ee" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join("")}</g>
      </g>`).join("");
  }

  /* ---------------- notes ---------------- */
  const NOTE_COLS = ["#fff1a6", "#ffd0dc", "#cfeeff", "#d9f3c6", "#ffdcb0"];
  function wrap(text, n = 17, max = 4) {
    const words = text.split(/\s+/), lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > n) { lines.push(cur.trim()); cur = w; } else cur += " " + w;
      if (lines.length === max) break;
    }
    if (lines.length < max && cur.trim()) lines.push(cur.trim());
    if (lines.length === max && words.join(" ").length > lines.join(" ").length) lines[max - 1] = lines[max - 1].slice(0, n - 1) + "…";
    return lines;
  }
  function renderNotes() {
    const g = $("#notes");
    g.innerHTML = S.notes.slice(0, 9).map((n, i) => {
      const h = hash(n.id), col = NOTE_COLS[h % NOTE_COLS.length];
      const x = BOARD.x + 30 + (i % 3) * 102, y = BOARD.y + 82 + Math.floor(i / 3) * 86;
      const rot = ((h >> 4) % 9) - 4;
      const lines = wrap(n.message);
      return `<g class="hot note" data-hot="note" data-i="${i}" transform="translate(${x} ${y}) rotate(${rot} 46 40)">
        <g class="lift">
        <rect x="3" y="5" width="92" height="78" fill="#2a160a" opacity=".35" filter="url(#blur4)"/>
        <rect width="92" height="78" fill="${col}"/>
        <rect width="92" height="78" fill="${NOTE_SHEEN}"/>
        ${lines.map((l, j) => `<text x="9" y="${24 + j * 14}" font-family="Caveat, cursive" font-size="16" fill="#3a2a2a">${esc(l)}</text>`).join("")}
        <text x="84" y="72" text-anchor="end" font-family="Caveat, cursive" font-size="13" fill="#7a6058">— ${esc(String(n.name).slice(0, 14))}</text>
        <circle cx="46" cy="5" r="5" fill="${["#d9473b", "#e0a43b", "#3a7bd5", "#4aa36a"][h % 4]}"/><circle cx="44.5" cy="3.5" r="1.6" fill="#fff" opacity=".7"/>
        </g></g>`;
    }).join("");
  }

  /* ---------------- particles (hearts, z's) ---------------- */
  const fxEl = $("#fx");
  const parts = [];
  function spawn(kind, x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = kind === "heart"
      ? `<path d="M0 6 C-14 -4 -8 -16 0 -8 C8 -16 14 -4 0 6 Z" fill="#ff7096"/>`
      : `<text font-family="Fraunces, serif" font-style="italic" font-size="22" fill="#fff4e0">z</text>`;
    fxEl.appendChild(g);
    parts.push({ g, x, y, vx: kind === "heart" ? (Math.random() - 0.5) * 30 : -10, vy: kind === "heart" ? -60 : -22, life: kind === "heart" ? 1.4 : 2.6, max: kind === "heart" ? 1.4 : 2.6 });
  }
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) { p.g.remove(); parts.splice(i, 1); continue; }
      const a = Math.min(1, (p.life / p.max) * 2);
      p.g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${0.8 + (1 - p.life / p.max) * 0.5})`);
      p.g.setAttribute("opacity", a.toFixed(2));
    }
  }

  /* ---------------- loop ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.t += dt;
    updateDisc(dt); updateCat(dt); updateCoffee(dt); updateParts(dt);
    yarnEl.style.display = cat.state === "play" ? "" : "none";
    if (cat.state === "play") yarnEl.setAttribute("transform", `translate(${cat.x + 62 + Math.max(0, Math.sin(S.t * 2.4)) * 10} ${CAT_GROUND})`);
    if (S.hover) placeTip(S.hover.el);
    requestAnimationFrame(loop);
  }

  /* ---------------- DOM wiring ---------------- */
  const tipEl = document.getElementById("tooltip"), hudEl = document.getElementById("hud");
  const toastEl = document.getElementById("toast"), hintEl = document.getElementById("hint");
  const menu = document.getElementById("coffee-menu");

  function tipFor(kind, i) {
    switch (kind) {
      case "project": { const p = projects[i]; return `<b>${esc(p.title)}</b><span>${esc(p.subtitle || "")}${p.year ? " · " + esc(p.year) : ""}</span><em>click to open</em>`; }
      case "empty": return `<b>coming soon</b><span>a new record is on its way</span>`;
      case "music": { const m = music[i], on = S.disc && S.disc.id === i; return `<b>♪ ${esc(m.title)}</b><span>${esc(m.artist)}</span><em>${on ? "click to put it back" : "click to play"}</em>`; }
      case "turntable": return S.disc && S.disc.phase === "play" ? `<b>now spinning</b><span>${esc(music[S.disc.id].title)}</span><em>click to stop</em>` : `<b>record player</b><span>pick a record from the cabinet</span>`;
      case "lamp": return `<b>lamp</b><em>click to turn ${S.lamp ? "off" : "on"}</em>`;
      case "machine": return S.coffee ? `<b>brewing…</b>` : `<b>coffee station</b><em>click to make a drink</em>`;
      case "cup": return `<b>your ${DRINKS[S.served[i]].name}</b><em>click to sip</em>`;
      case "note": { const n = S.notes[i]; return `<span class="topic">${esc(n.topic)}</span><b>“${esc(n.message)}”</b><span>— ${esc(n.name)}</span>`; }
      case "board": return `<b>bulletin board</b><em>click to leave a note</em>`;
      case "cat": return `<b>${esc(SITE.catName)}</b><span>${{ sleep: "napping", drink: "having a drink", eat: "snack time", play: "playing with yarn", walk: "on the move", sit: "just sitting, judging a little" }[cat.state]}</span><em>click to pet</em>`;
    }
    return "";
  }
  function placeTip(el) {
    const r = el.getBoundingClientRect();
    tipEl.style.left = r.left + r.width / 2 + "px";
    tipEl.style.top = r.top + "px";
  }
  const hotFrom = (target) => (target.closest ? target.closest("[data-hot]") : null);
  svg.addEventListener("pointermove", (e) => {
    const el = hotFrom(e.target);
    if (!el) { if (S.hover) { S.hover = null; tipEl.classList.remove("show"); } return; }
    const kind = el.dataset.hot, i = +el.dataset.i;
    S.hover = { el, kind, i };
    tipEl.innerHTML = tipFor(kind, i);
    tipEl.classList.add("show");
    placeTip(el);
  });
  svg.addEventListener("pointerleave", () => { S.hover = null; tipEl.classList.remove("show"); });
  svg.addEventListener("click", (e) => {
    hintEl.classList.add("gone");
    const el = hotFrom(e.target);
    if (!el || el.dataset.hot !== "machine") menu.classList.remove("open");
    if (!el) return;
    const kind = el.dataset.hot, i = +el.dataset.i;
    act(kind, i, el);
    if (S.hover && S.hover.el === el) tipEl.innerHTML = tipFor(kind, i);
  });
  function act(kind, i, el) {
    switch (kind) {
      case "project": return openProject(projects[i]);
      case "music": return pickRecord(i);
      case "turntable": return S.disc && returnDisc();
      case "lamp": return toggleLamp();
      case "machine": return S.coffee ? null : openCoffeeMenu(el);
      case "cup": {
        AE.sfx("sip"); spawn("heart", CUP_SLOTS[i], 550);
        S.served.splice(i, 1); renderServed(); toast("ahh, perfect.");
        tipEl.classList.remove("show"); S.hover = null; return;
      }
      case "note": case "board": return openNotes();
      case "cat": return petCat();
    }
  }
  function toggleLamp() {
    S.lamp = !S.lamp;
    document.body.classList.toggle("lamp-off", !S.lamp);
    AE.sfx("click");
  }

  function hud(m) {
    if (!m) return hudEl.classList.remove("show");
    hudEl.querySelector(".title").textContent = `${m.title} — ${m.artist}`;
    hudEl.classList.add("show");
  }
  hudEl.querySelector("button").addEventListener("click", returnDisc);

  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function openModal(id) {
    const m = document.getElementById(id);
    m.classList.add("open"); m.setAttribute("aria-hidden", "false");
    tipEl.classList.remove("show");
    const f = m.querySelector("textarea, .x"); if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModals() {
    document.querySelectorAll(".modal.open").forEach((m) => { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); });
    menu.classList.remove("open");
  }
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModals));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

  function openProject(p) {
    document.getElementById("project-cover").innerHTML = `<svg viewBox="0 0 100 100" class="cover-big"><defs>${A.defsMarkup()}</defs>${A.cover(p.cover)}</svg>`;
    document.getElementById("project-title").textContent = p.title;
    document.getElementById("project-sub").textContent = [p.subtitle, p.year].filter(Boolean).join(" · ");
    document.getElementById("project-tags").innerHTML = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    document.getElementById("project-blurb").textContent = p.blurb || "";
    const link = document.getElementById("project-link");
    if (p.url) { link.href = p.url; link.classList.remove("disabled"); link.textContent = "open project →"; }
    else { link.removeAttribute("href"); link.classList.add("disabled"); link.textContent = "project page coming soon"; }
    openModal("project-modal");
  }

  function openCoffeeMenu(el) {
    const r = el.getBoundingClientRect();
    menu.style.left = r.left + r.width * 0.2 + "px";
    menu.style.top = r.top - 10 + "px";
    menu.classList.add("open");
  }
  menu.querySelectorAll("[data-drink]").forEach((b) => b.addEventListener("click", () => { menu.classList.remove("open"); brew(b.dataset.drink); }));
  document.addEventListener("pointerdown", (e) => { if (!menu.contains(e.target) && !svg.contains(e.target)) menu.classList.remove("open"); });

  // notes modal
  const form = document.getElementById("note-form"), listEl = document.getElementById("note-list");
  function renderNoteList() {
    listEl.innerHTML = S.notes.map((n) => `<li><span class="topic">${esc(n.topic)}</span><p>${esc(n.message)}</p><small>— ${esc(n.name)}</small></li>`).join("") || "<li><p>no notes yet — be the first!</p></li>";
  }
  function openNotes() {
    renderNoteList();
    document.getElementById("note-shared").textContent = Notes.isShared() ? "notes are public — everyone who visits can read them." : "notes are saved in this browser for now.";
    openModal("note-modal");
  }
  async function refreshNotes() { S.notes = await Notes.list(40); renderNotes(); renderNoteList(); }
  const msg = form.querySelector("textarea"), count = document.getElementById("note-count");
  msg.addEventListener("input", () => (count.textContent = `${msg.value.length}/140`));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form), btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await Notes.add({ name: data.get("name"), topic: data.get("topic"), message: data.get("message") });
      form.reset(); count.textContent = "0/140";
      await refreshNotes(); AE.sfx("pin"); toast("pinned to the board ♡"); closeModals();
    } catch (err) {
      toast(err.message === "empty note" ? "write something first :)" : "couldn't pin that — try again?");
    } finally { btn.disabled = false; }
  });

  // keyboard / screen-reader controls
  const nav = document.getElementById("a11y-nav");
  nav.innerHTML = "<h2>Projects</h2>" + projects.map((p, i) => `<button data-p="${i}">${esc(p.title)}</button>`).join("") +
    "<h2>Music</h2>" + music.map((m, i) => `<button data-m="${i}">Play ${esc(m.title)}</button>`).join("") +
    `<button data-a="lamp">Toggle lamp</button><button data-a="notes">Leave a note</button><button data-a="cat">Pet ${esc(SITE.catName)}</button><button data-a="coffee">Make coffee</button>`;
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.p) openProject(projects[+b.dataset.p]);
    else if (b.dataset.m) pickRecord(+b.dataset.m);
    else if (b.dataset.a === "lamp") toggleLamp();
    else if (b.dataset.a === "notes") openNotes();
    else if (b.dataset.a === "cat") petCat();
    else if (b.dataset.a === "coffee") brew("coffee");
  });

  // phones: start scrolled to the record wall
  const wrapEl = document.getElementById("stage-wrap");
  function centerScroll() { if (wrapEl.scrollWidth > wrapEl.clientWidth) wrapEl.scrollLeft = (wrapEl.scrollWidth - wrapEl.clientWidth) * 0.5; }
  window.addEventListener("resize", centerScroll);

  // film grain overlay
  (function grain() {
    const c = document.createElement("canvas"); c.width = c.height = 160;
    const g = c.getContext("2d"), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    document.getElementById("grain").style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------------- boot ---------------- */
  document.title = SITE.title;
  showPose("sleep");
  renderServed();
  refreshNotes();
  centerScroll();
  requestAnimationFrame(loop);
  window.__room = { S, cat, showPose, catPoseName };
})();
