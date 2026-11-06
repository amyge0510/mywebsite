/* The room, as one layered SVG illustration.
   Stage is 1600x1000. The wall is the plane at depth 0; furniture is projected
   toward a vanishing point so tops and sides read as 3D. */
(function () {
  "use strict";
  const SITE = window.SITE, AE = window.AudioEngine, Notes = window.NotesStore, A = window.Art;
  const { lin, rad, rng, hash, esc } = A;

  const FLOOR = 860;
  const VP = { x: 800, y: 250 };
  const P = (x, y, k) => [x + (VP.x - x) * k, y + (VP.y - y) * k];
  const pt = (a) => `${a[0].toFixed(1)},${a[1].toFixed(1)}`;
  const poly = (pts, fill, extra = "") => `<polygon points="${pts.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;
  const SVGNS = "http://www.w3.org/2000/svg";
  const clipShape = (shapes) => A.clip(shapes);

  /* ---------------- layout ---------------- */
  const COVER = 122, GAP = 62;                      // 10% smaller records, to make room for the lightbox
  const COLS = [0, 1, 2, 3].map((i) => 900 - (4 * COVER + 3 * GAP) / 2 + i * (COVER + GAP));
  const ROWS = [190, 378];
  const SIGN = { x0: 720, x1: 1080, y0: 82, y1: 142 };
  const CAB = { x0: 560, x1: 1240, top: 730, k: 0.1 };
  CAB.bot = (FLOOR - VP.y * CAB.k) / (1 - CAB.k);
  const CUBL = { x0: 580, x1: 896, y0: CAB.top + 28, y1: CAB.bot - 24 };
  const CUBR = { x0: 914, x1: 1220, y0: CAB.top + 28, y1: CAB.bot - 24 };
  const DY = CAB.top - 640;                          // cabinet-top objects are drawn for a top at y=640
  const PLAT = { x: 672, y: 574 + DY, rx: 78, ry: 12 };
  const TT = { cx: 690, cy: 634, s: 0.8 };            // the record player is drawn full size, then scaled about its base
  const PLAT_W = { x: TT.cx + (PLAT.x - TT.cx) * TT.s, y: DY + TT.cy + (PLAT.y - DY - TT.cy) * TT.s };
  const LAMP = { x: 1130, base: 620, drop: 44 };     // drop = how much shorter than before
  const LAMP_GLOW = { x: 1130, y: 490 + DY + LAMP.drop };
  const BOARD = { x: 36, y: 150, w: 360, h: 470 };
  const SLEEVE = 104;                                // record sleeve size in the rack

  const projects = SITE.projects;
  const music = SITE.music;

  /* ---------------- pieces ---------------- */
  function wall() {
    let s = `<rect x="-1400" y="-900" width="4400" height="${FLOOR + 900}" fill="${lin([[0, "#5e3520"], [0.5, "#b87648"], [0.82, "#d2935f"], [1, "#b97b4c"]], 0, -900, 0, FLOOR, true)}"/>`;
    s += `<rect x="-1400" y="-900" width="4400" height="905" fill="#3a2214" opacity=".6"/>`;
    s += `<rect x="-1400" y="0" width="4400" height="12" fill="${lin([[0, "#f0cfa6"], [1, "#c99a6e"]])}"/><rect x="-1400" y="12" width="4400" height="40" fill="${lin([[0, "#3a1e10", 0.45], [1, "#3a1e10", 0]])}"/>`;
    s += `<rect x="-1400" y="${FLOOR - 26}" width="4400" height="26" fill="${lin([[0, "#f6dcbc"], [0.2, "#e6c6a0"], [1, "#b99470"]])}"/>`;
    s += `<rect x="-1400" y="${FLOOR - 28}" width="4400" height="3" fill="#ffe9cc"/>`;
    return s;
  }

  function sunlight() {
    const sk = (x, y) => [x + (y - 60) * 0.55, y];
    const panes = [];
    const X = [230, 400, 414, 584], Y = [40, 270, 284, 540];
    for (const [xa, xb] of [[X[0], X[1]], [X[2], X[3]]]) for (const [ya, yb] of [[Y[0], Y[1]], [Y[2], Y[3]]])
      panes.push(poly([sk(xa, ya), sk(xb, ya), sk(xb, yb), sk(xa, yb)], "#ff9e5a"));
    return `<g class="sun" opacity=".8" filter="url(#blur14)" style="mix-blend-mode:screen">${panes.join("")}</g>`;
  }

  function floor() {
    let s = `<rect x="-1400" y="${FLOOR}" width="4400" height="900" fill="#80502f"/>`;
    const r = rng(5), far = 1700;
    const at = (xb, y) => VP.x + (xb - VP.x) * ((y - VP.y) / (far - VP.y));
    const step = 130;
    for (let xb = -6000, i = 0; xb < 7600; xb += step, i++) {
      const a = [at(xb, FLOOR), FLOOR], b = [at(xb + step, FLOOR), FLOOR], c = [xb + step, far], d = [xb, far];
      s += poly([a, b, c, d], ["#8a5634", "#7e4d2d", "#91603b", "#774829"][i % 4]);
      s += `<line x1="${a[0]}" y1="${FLOOR}" x2="${xb}" y2="${far}" stroke="#3e2212" stroke-width="1.8" opacity=".75"/>`;
      for (let j = 0; j < 3; j++) {
        const y = FLOOR + 10 + r() * 700;
        s += `<line x1="${at(xb, y)}" y1="${y}" x2="${at(xb + step, y)}" y2="${y}" stroke="#3e2212" stroke-width="1.3" opacity=".55"/>`;
      }
    }
    s += `<ellipse cx="${LAMP_GLOW.x}" cy="${FLOOR + 40}" rx="120" ry="26" fill="#ffb877" opacity=".25" filter="url(#blur14)"/>`;
    s += `<rect x="-1400" y="${FLOOR}" width="4400" height="900" fill="${lin([[0, "#1a0c04", 0.6], [0.15, "#1a0c04", 0.15], [1, "#1a0c04", 0.55]], 0, FLOOR, 0, 1400, true)}"/>`;
    s += `<rect x="-1400" y="${FLOOR}" width="4400" height="26" fill="${lin([[0, "#120803", 0.7], [1, "#120803", 0]])}"/>`;
    return s;
  }

  function rug() {
    const cx = 900, cy = 990, rx = 640, ry = 70;
    let s = `<ellipse cx="${cx + 10}" cy="${cy + 8}" rx="${rx + 10}" ry="${ry + 6}" fill="#000" opacity=".4" filter="url(#blur8)"/>`;
    ["#7e3122", "#b8583a", "#df9a62", "#a4462a", "#cf7b4c", "#93402a", "#e2a974"].forEach((c, i) => {
      const f = 1 - i * 0.12; s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * f}" ry="${ry * f}" fill="${c}"/>`;
    });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 26) s += `<circle cx="${cx + Math.cos(a) * rx * 0.82}" cy="${cy + Math.sin(a) * ry * 0.82}" r="3.5" fill="#f3cf98" opacity=".8"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${rad([[0, "#fff", 0.05], [0.7, "#000", 0.1], [1, "#000", 0.4]])}"/>`;
    return s;
  }

  function ledge(x, y) {
    return `<rect x="${x - 16}" y="${y + COVER + 10}" width="${COVER + 32}" height="26" fill="#2a1408" opacity=".55" filter="url(#blur8)"/>
      <rect x="${x - 12}" y="${y + COVER - 3}" width="${COVER + 24}" height="15" rx="2" fill="${lin([[0, "#7a5034"], [0.2, "#5a3822"], [1, "#24140a"]])}"/>
      <rect x="${x - 12}" y="${y + COVER - 3}" width="${COVER + 24}" height="2" fill="#b07f58"/>
      <rect x="${x - 12}" y="${y + COVER + 10}" width="${COVER + 24}" height="3" fill="#140a04" opacity=".8"/>`;
  }

  // vinyl, drawn at radius 50; label is the album art (music) or a palette dot (projects)
  function vinylMarkup(m, spinId) {
    let grooves = "";
    for (let r = 46; r > 20; r -= 3.2) grooves += `<circle r="${r}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".7"/>`;
    const label = m.cover && m.cover.palette
      ? `<circle r="17" fill="${m.cover.palette.c}"/><circle cx="0" cy="9" r="2.5" fill="${m.cover.palette.a}"/>`
      : `<image href="${m.cover}" x="-17" y="-17" width="34" height="34" clip-path="url(#labelclip)" preserveAspectRatio="xMidYMid slice"/>`;
    return `<circle r="50" fill="#151112"/>
      <circle r="50" fill="${rad([[0, "#000", 0], [0.85, "#000", 0.15], [1, "#000", 0.5]])}"/>
      ${grooves}
      <g ${spinId ? `class="${spinId}"` : ""}>${label}
        <circle r="17" fill="${rad([[0, "#fff", 0.12], [1, "#000", 0.3]])}"/>
        <path d="M-46 -6 A46 46 0 0 1 -30 -35" stroke="#fff" stroke-opacity=".1" stroke-width="5" fill="none"/>
      </g>
      <circle r="2.2" fill="#e8e2d8"/>
      <path d="M-40 -26 A48 48 0 0 1 26 -42" stroke="#fff" stroke-opacity=".26" stroke-width="3" fill="none"/>
      <path d="M40 26 A48 48 0 0 1 -26 42" stroke="#fff" stroke-opacity=".14" stroke-width="3" fill="none"/>`;
  }

  function record(i) {
    const x = COLS[i % 4], y = ROWS[Math.floor(i / 4)];
    const p = projects[i];
    if (!p) {
      return `<g class="hot" data-hot="empty" data-i="${i}">${ledge(x, y)}
        <rect x="${x + 2}" y="${y + 2}" width="${COVER - 4}" height="${COVER - 4}" rx="4" fill="#fff" fill-opacity=".05" stroke="#7a4a2a" stroke-opacity=".7" stroke-width="2" stroke-dasharray="7 7"/>
        <text x="${x + COVER / 2}" y="${y + COVER / 2 + 2}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="19" fill="#7a4a2a" opacity=".85">coming soon</text></g>`;
    }
    const cx = x + COVER / 2, cy = y + COVER / 2;
    const dx = cx - LAMP_GLOW.x, dy = cy - LAMP_GLOW.y, dist = Math.hypot(dx, dy);
    const sx = (dx / dist) * 20, sy = (dy / dist) * 20;
    return `<g class="hot" data-hot="project" data-i="${i}">${ledge(x, y)}
      <g class="lift">
        <rect x="${x + sx}" y="${y + sy}" width="${COVER + 10}" height="${COVER}" fill="#1e0e05" opacity=".55" filter="url(#blur14)"/>
        <rect x="${x + 4}" y="${y + 6}" width="${COVER}" height="${COVER}" fill="#1e0e05" opacity=".5" filter="url(#blur4)"/>
        <g transform="translate(${x + COVER / 2 + 26} ${y + COVER / 2 + 2}) scale(${(COVER * 0.47) / 50})">${vinylMarkup({ cover: p.cover })}</g>
        <g transform="translate(${x} ${y}) scale(${COVER / 100})">${A.cover(p.cover)}</g>
        <rect x="${x}" y="${y + COVER - 3}" width="${COVER}" height="3" fill="#000" opacity=".35"/>
      </g></g>`;
  }

  function board() {
    const b = BOARD, r = rng(3);
    let speck = "";
    for (let i = 0; i < 330; i++) speck += `<circle cx="${b.x + 12 + r() * (b.w - 24)}" cy="${b.y + 12 + r() * (b.h - 24)}" r="${0.6 + r() * 1.3}" fill="${r() < 0.5 ? "#8e5f36" : "#d8aa74"}" opacity=".7"/>`;
    const deco = `
      <g transform="translate(${b.x + b.w - 128} ${b.y + b.h - 120}) rotate(4) scale(.68)">
        <rect x="3" y="5" width="140" height="118" fill="#1e0e05" opacity=".45" filter="url(#blur4)"/>
        <rect width="140" height="118" fill="#fbf8f2"/>
        <image href="assets/img/us.jpg" x="8" y="8" width="124" height="93" preserveAspectRatio="xMidYMid slice"/>
        <rect x="8" y="8" width="124" height="93" fill="none" stroke="#000" stroke-opacity=".12"/>
        <circle cx="70" cy="4" r="5" fill="#3a7bd5"/><circle cx="68.5" cy="2.5" r="1.6" fill="#fff" opacity=".7"/>
      </g>
      <g transform="translate(${b.x + 34} ${b.y + b.h - 78}) rotate(-8) scale(.9)">
        <rect x="2" y="4" width="96" height="40" fill="#1e0e05" opacity=".3" filter="url(#blur4)"/>
        <rect width="96" height="40" fill="#e9784f"/><line x1="26" y1="0" x2="26" y2="40" stroke="#fbe3c8" stroke-dasharray="3 3"/>
        <text x="62" y="18" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="11" fill="#fbe3c8">ADMIT</text>
        <text x="62" y="31" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="11" fill="#fbe3c8">ONE</text>
      </g>`;
    return `<g class="hot" data-hot="board">
      <rect x="${b.x + 10}" y="${b.y + 16}" width="${b.w}" height="${b.h}" rx="8" fill="#1e0e05" opacity=".55" filter="url(#blur14)"/>
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="7" fill="${lin([[0, "#9a6a44"], [0.5, "#704628"], [1, "#4a2c18"]], 0, 0, 1, 1)}"/>
      <rect x="${b.x + 2}" y="${b.y + 2}" width="${b.w - 4}" height="3" rx="1.5" fill="#c08a5c" opacity=".7"/>
      <rect x="${b.x + 12}" y="${b.y + 12}" width="${b.w - 24}" height="${b.h - 24}" fill="${lin([[0, "#c8925a"], [1, "#a46c3c"]], 0, 0, 1, 1)}"/>
      ${speck}
      <rect x="${b.x + 12}" y="${b.y + 12}" width="${b.w - 24}" height="${b.h - 24}" fill="none" stroke="#2a1408" stroke-opacity=".6" stroke-width="7" filter="url(#blur4)"/>
      ${deco}
      <g transform="translate(${b.x + b.w / 2} ${b.y + 42}) rotate(-2)">
        <rect x="-88" y="-20" width="176" height="40" fill="#1e0e05" opacity=".35" filter="url(#blur4)"/>
        <rect x="-90" y="-22" width="180" height="40" fill="#fbf3e4"/>
        <text y="6" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif" font-size="17" letter-spacing="2" fill="#8a4a2e">LEAVE A NOTE!</text>
        <circle cx="-78" cy="-12" r="4.5" fill="#d9473b"/><circle cx="78" cy="-12" r="4.5" fill="#e0a43b"/>
      </g>
      <g id="notes"></g>
    </g>`;
  }

  /* an orange leather beanbag with a big "5", slumped on the floor */
  function beanbag() {
    const body = "M-196 -26 C-214 -110 -186 -214 -104 -262 C-46 -296 52 -300 120 -268 C188 -236 218 -150 206 -64 C200 -16 170 6 6 10 C-150 8 -190 -2 -196 -26 Z";
    const leather = rad([[0, "#f6924e"], [0.35, "#e0702e"], [0.75, "#bd5220"], [1, "#7e3010"]], 0.62, 0.3, 0.85);
    const crease = (d, o = 0.5) => `<path d="${d}" stroke="#5e1e06" stroke-width="5" fill="none" stroke-linecap="round" opacity="${o}" filter="url(#blur4)"/>
      <path d="${d}" stroke="#ffb27a" stroke-width="3" fill="none" stroke-linecap="round" opacity="${o * 0.5}" filter="url(#blur2)" transform="translate(-3 -4)"/>`;
    const seam = (d) => `<path d="${d}" stroke="#7a2a0c" stroke-width="2.2" fill="none" opacity=".75"/>
      <path d="${d}" stroke="#ffc08a" stroke-width="1" fill="none" opacity=".35" transform="translate(0 -2)"/>`;
    return `<g class="hot beanbag" data-hot="beanbag" transform="translate(250 912) scale(.9)"><g class="squish">
      <ellipse cx="18" cy="2" rx="230" ry="24" fill="#000" opacity=".6" filter="url(#blur14)"/>
      <path d="${body}" fill="${leather}"/>
      <path d="${body}" fill="${lin([[0, "#2a0a02", 0.35], [0.45, "#2a0a02", 0], [1, "#fff", 0.05]], 0, 0, 1, 0)}"/>
      <ellipse cx="-6" cy="-236" rx="96" ry="22" fill="#8e3410" opacity=".22" filter="url(#blur14)"/>
      ${crease("M-70 -226 C-30 -214 20 -214 58 -224", 0.22)}
      ${crease("M-176 -120 C-150 -100 -130 -70 -128 -30", 0.35)}
      ${crease("M150 -120 C160 -90 168 -60 160 -22", 0.3)}
      ${seam("M-58 -282 C-120 -230 -150 -150 -132 -40 C-128 -16 -116 0 -100 6")}
      ${seam("M-190 -48 C-120 -30 40 -26 200 -58")}
      <path d="M-80 -270 C-20 -290 70 -288 120 -262" stroke="#ffd0a0" stroke-width="10" fill="none" opacity=".25" stroke-linecap="round" filter="url(#blur8)"/>
      <path d="M150 -200 C176 -160 186 -110 180 -70" stroke="#ffc88e" stroke-width="12" fill="none" opacity=".25" stroke-linecap="round" filter="url(#blur8)"/>
      <g transform="translate(36 -142) rotate(-7)">
        <ellipse cx="4" cy="6" rx="94" ry="62" fill="#5e1e06" opacity=".35" filter="url(#blur6)"/>
        <ellipse rx="92" ry="60" fill="${rad([[0, "#fffaf0"], [0.7, "#f2e8d4"], [1, "#d6c6a8"]], 0.45, 0.4, 0.7)}"/>
        <text x="2" y="26" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-weight="700" font-size="84" fill="#141012">5</text>
        <path d="M-70 -30 C-40 -54 30 -58 64 -40" stroke="#fff" stroke-width="5" fill="none" opacity=".5" filter="url(#blur2)"/>
      </g>
    </g></g>`;
  }

  /* records standing in a wavy chrome rack (left cubby) */
  const RACK = (() => {
    const r = rng(77), out = [];
    const order = [0, "f", "f", 1, "f", 2, "f", "f", 3, "f", 4, "f"];
    const fillers = ["sunset", "bauhaus", "dots", "waves", "planet", "flower", "face"];
    const pals = [
      { bg: "#1d2a3a", a: "#e8a25a", b: "#c0563a", c: "#f6e3b0", ink: "#fff" },
      { bg: "#e9dcc4", a: "#2a2a2a", b: "#b8442c", c: "#d8a23a", ink: "#222" },
      { bg: "#2a2420", a: "#d9cbb2", b: "#6a8a6a", c: "#efe4cc", ink: "#fff" },
      { bg: "#7a2a2a", a: "#f2c46a", b: "#2a3a5a", c: "#f6efe0", ink: "#fff" },
      { bg: "#c7d3d6", a: "#3a4a6a", b: "#e07a5a", c: "#fff", ink: "#222" }
    ];
    let x = CUBL.x0 + 18;
    order.forEach((o, k) => {
      const album = o !== "f";
      if (k > 0) x += album ? 30 : 11 + r() * 4;   // albums get a wider gap so more of their cover shows
      out.push({
        k, x, i: album ? o : null,
        cover: album ? music[o].cover : { motif: fillers[k % fillers.length], palette: pals[k % pals.length] },
        vinyl: false, lean: -7 - r() * 6
      });
    });
    return out;
  })();
  const REC_BASE = CUBL.y1 - 8;
  const SQ = 0.6;                                     // foreshortening of covers turned toward the room
  function rackRecord(rc) {
    const depth = rc.k * 0.035;
    const art = rc.i === null
      ? `<g transform="translate(0 ${-SLEEVE}) scale(${SLEEVE / 100})">${A.cover(rc.cover, false)}</g>`
      : `<image href="${rc.cover}" x="0" y="${-SLEEVE}" width="${SLEEVE}" height="${SLEEVE}" preserveAspectRatio="xMidYMid slice"/>`;
    const inner = `<g transform="rotate(${rc.lean})"><g transform="matrix(${SQ} -0.05 0 1 0 0)">
        ${rc.vinyl ? `<path d="M8 ${-SLEEVE + 2} A46 46 0 0 1 96 ${-SLEEVE + 2}" fill="#141012"/><path d="M20 ${-SLEEVE + 2} A34 34 0 0 1 84 ${-SLEEVE + 2}" fill="none" stroke="#3a3438" stroke-width="1"/>` : ""}
        ${art}
        <rect x="0" y="${-SLEEVE}" width="${SLEEVE}" height="${SLEEVE}" fill="${REC_SHADE}"/>
        <rect x="${SLEEVE}" y="${-SLEEVE}" width="3.5" height="${SLEEVE}" fill="#120c0a"/>
        <rect x="0" y="${-SLEEVE}" width="${SLEEVE}" height="1.5" fill="#fff" opacity=".35"/>
        <rect x="0" y="${-SLEEVE}" width="${SLEEVE}" height="${SLEEVE}" fill="#000" opacity="${depth.toFixed(3)}"/>
      </g></g>`;
    const shadow = `<ellipse cx="${SLEEVE * SQ * 0.6}" cy="1" rx="${SLEEVE * SQ * 0.7}" ry="4" fill="#000" opacity=".55" filter="url(#blur4)"/>`;
    if (rc.i === null) return `<g transform="translate(${rc.x} ${REC_BASE})" pointer-events="none">${shadow}${inner}</g>`;
    const halo = `<g class="rec-halo" transform="rotate(${rc.lean})"><rect x="-10" y="${-SLEEVE - 12}" width="${SLEEVE * SQ + 20}" height="${SLEEVE + 18}" rx="14" fill="#ffc87a" filter="url(#blur14)"/></g>`;
    return `<g class="hot rec" data-hot="music" data-i="${rc.i}" transform="translate(${rc.x} ${REC_BASE})">${halo}${shadow}<g class="lift">${inner}</g></g>`;
  }
  function rackWire() {
    const x0 = CUBL.x0 + 10, x1 = CUBL.x1 - 14, base = REC_BASE - 2, top = CUBL.y0 + 6, w = (x1 - x0) / 5;
    let d = `M${x0} ${base}`;
    for (let k = 0; k < 5; k++) {
      const a = x0 + k * w;
      d += ` C${a} ${top - 6} ${a + w} ${top - 6} ${a + w} ${base}`;
    }
    return `<g pointer-events="none"><path d="${d}" stroke="#1a1410" stroke-width="5" fill="none" opacity=".45" filter="url(#blur2)" transform="translate(3 3)"/>
      <path d="${d}" stroke="#8a847c" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="#f4efe6" stroke-width="1" fill="none" opacity=".7" transform="translate(-.8 -.8)"/>
      <ellipse cx="${x0}" cy="${base + 2}" rx="11" ry="3" fill="#cfc9c0"/><ellipse cx="${x1}" cy="${base + 2}" rx="11" ry="3" fill="#cfc9c0"/></g>`;
  }
  let REC_SHADE = "";

  function cabinet() {
    const c = CAB, k = c.k, ft = c.top, fb = c.bot, fl = c.x0, fr = c.x1;
    const bl = P(fl - 8, ft, k), br = P(fr + 8, ft, k);
    let s = `<ellipse cx="${(fl + fr) / 2 + 30}" cy="${fb + 4}" rx="${(fr - fl) / 2 + 60}" ry="22" fill="#000" opacity=".6" filter="url(#blur10)"/>`;
    s += `<path d="M${fl + 10} ${bl[1]} L${fl + 40} ${bl[1] - 120} L${LAMP.x - 80} ${bl[1] - 70} L${LAMP.x - 60} ${bl[1]} Z" fill="#1e0e05" opacity=".35" filter="url(#blur30)"/>`;
    s += `<rect x="${fl + 14}" y="${fb - 14}" width="16" height="14" fill="#140c08"/><rect x="${fr - 30}" y="${fb - 14}" width="16" height="14" fill="#140c08"/>`;
    s += `<rect x="${fl}" y="${ft + 14}" width="${fr - fl}" height="${fb - ft - 28}" fill="${lin([[0, "#4a3326"], [1, "#22160f"]])}"/>`;
    s += `<rect x="${fl}" y="${ft + 14}" width="${fr - fl}" height="${fb - ft - 28}" fill="${lin([[0, "#000", 0.25], [0.5, "#000", 0], [1, "#000", 0.3]], 0, 0, 1, 0)}"/>`;
    [CUBL, CUBR].forEach((u) => {
      const kk = 0.1;
      const A0 = [u.x0, u.y0], A1 = [u.x1, u.y0], A2 = [u.x1, u.y1], A3 = [u.x0, u.y1];
      const B0 = P(...A0, kk), B1 = P(...A1, kk), B2 = P(...A2, kk), B3 = P(...A3, kk);
      s += poly([A0, A1, A2, A3], "#0e0805");
      s += poly([B0, B1, B2, B3], lin([[0, "#140c08"], [1, "#24170f"]]));
      s += poly([A3, A2, B2, B3], lin([[0, "#5a4030"], [1, "#2e2016"]], 0, 1, 0, 0));
      s += poly([A0, B0, B3, A3], lin([[0, "#22160e"], [1, "#130b07"]], 0, 0, 1, 0));
      s += poly([A1, B1, B2, A2], lin([[0, "#140b07"], [1, "#2c1e15"]], 0, 0, 1, 0));
      s += poly([A0, A1, B1, B0], "#080402");
      s += `<rect x="${u.x0}" y="${u.y0}" width="${u.x1 - u.x0}" height="${u.y1 - u.y0}" fill="none" stroke="#5c4232" stroke-width="2"/>`;
    });
    s += poly([[fl - 8, ft], [fr + 8, ft], br, bl], lin([[0, "#7a563e"], [1, "#4a3426"]], 0, 1, 0, 0));
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="14" fill="${lin([[0, "#9a7052"], [1, "#3e2a1e"]])}"/>`;
    s += `<rect x="${fl - 8}" y="${ft}" width="${fr - fl + 16}" height="2" fill="#c08f6a"/>`;
    return s;
  }
  // back-to-front, so each record overlaps the one behind it
  function rackRecords() {
    let s = "";
    for (let k = RACK.length - 1; k >= 0; k--) s += rackRecord(RACK[k]);
    return rackWire() + s;   // the wire sits behind the records, showing only between them
  }

  // right cubby: a small framed photo of the two of us, and the Harry Potter box set stacked flat
  function cubbyRight() {
    const fb = CUBR.y1 - 6, fx = CUBR.x0 + 30, w = 112;
    const frame = camera(fx + 4, fb, 0.74);
    // top to bottom, as in the box set
    const books = [
      ["Sorcerer's Stone", "#5a3b8e", 8], ["Chamber of Secrets", "#8e2c5c", 8], ["Prisoner of Azkaban", "#2f6a6c", 9],
      ["Goblet of Fire", "#6c2632", 12], ["Order of the Phoenix", "#3b5cab", 13], ["Half-Blood Prince", "#2f6f4a", 10], ["Deathly Hallows", "#c65c32", 11]
    ];
    const len = 112, x0 = fx + w + 26;
    let y = fb - books.reduce((a, b) => a + b[2], 0);
    let out = `<ellipse cx="${x0 + len / 2}" cy="${fb + 1}" rx="${len / 2 + 6}" ry="4" fill="#000" opacity=".6" filter="url(#blur4)"/>`;
    out += poly([[x0, y], [x0 + len, y], P(x0 + len, y, 0.03), P(x0, y, 0.03)], books[0][1]) + poly([[x0, y], [x0 + len, y], P(x0 + len, y, 0.03), P(x0, y, 0.03)], "#fff", `opacity=".18"`);
    books.forEach(([title, col, t], i) => {
      const x = x0 + (i % 2 ? 1 : -1);
      out += `<rect x="${x}" y="${y}" width="${len}" height="${t}" fill="${col}"/>
        <rect x="${x}" y="${y}" width="${len}" height="${t}" fill="url(#hp-diamonds)"/>
        <rect x="${x}" y="${y}" width="${len}" height="${t}" fill="${BOOK_SHEEN}"/>
        <rect x="${x}" y="${y + t - 0.8}" width="${len}" height=".8" fill="#000" opacity=".45"/>
        <rect x="${x + 5}" y="${y + t / 2 - 2.6}" width="5.2" height="5.2" fill="none" stroke="#e2c27a" stroke-width=".6"/>
        <text x="${x + 7.6}" y="${y + t / 2 + 1.5}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="4.4" fill="#e2c27a">${i + 1}</text>
        <text x="${x + len / 2 + 2}" y="${y + t / 2 + (t > 10 ? 0.4 : 1.6)}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="${t > 10 ? 4.6 : 4.2}" letter-spacing=".5" fill="#e8cc86">HARRY POTTER</text>
        ${t > 10 ? `<text x="${x + len / 2 + 2}" y="${y + t / 2 + 4.6}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="3" letter-spacing=".3" fill="#e8cc86">AND THE ${esc(title.toUpperCase())}</text>` : ""}
        <rect x="${x + len - 9}" y="${y + t / 2 - 1.8}" width="5" height="3.6" fill="#d8302a"/>`;
      y += t;
    });
    return frame + `<g class="hot" data-hot="books">${out}</g>`;
  }
  let BOOK_SHEEN = "";

  // a boxy vintage instant camera; click it to take a photo
  function camera(x, b, scale) {
    const k = 0.06;
    const tl = P(x, b - 44, k), tr = P(x + 118, b - 44, k);
    const black = lin([[0, "#3a3634"], [0.5, "#1e1b1a"], [1, "#0e0c0c"]]);
    return `<g class="hot" data-hot="camera" transform="translate(${x + 59} ${b}) scale(${scale}) translate(${-x - 59} ${-b})">
      <ellipse cx="${x + 54}" cy="${b + 2}" rx="70" ry="7" fill="#000" opacity=".55" filter="url(#blur4)"/>
      ${poly([[x, b - 44], [x + 118, b - 44], tr, tl], "#2c2826")}
      <rect x="${x}" y="${b - 44}" width="118" height="44" rx="6" fill="${black}"/>
      <rect x="${x + 6}" y="${b - 14}" width="106" height="5" rx="2" fill="#050404"/>
      <text x="${x + 10}" y="${b - 22}" font-family="DM Sans, sans-serif" font-weight="700" font-size="7" fill="#c9b07a">660</text>
      <text x="${x + 108}" y="${b - 22}" text-anchor="end" font-family="DM Sans, sans-serif" font-weight="700" font-size="6" letter-spacing=".6" fill="#c0392b">AUTOFOCUS</text>
      <rect x="${x + 12}" y="${b - 96}" width="96" height="54" rx="5" fill="${black}"/>
      <circle cx="${x + 34}" cy="${b - 69}" r="13" fill="${rad([[0, "#d8b46a"], [1, "#6a5020"]], 0.4, 0.35, 0.7)}"/>
      <circle cx="${x + 34}" cy="${b - 69}" r="13" fill="url(#cam-mesh)"/>
      <circle cx="${x + 70}" cy="${b - 69}" r="19" fill="#0c0a0a"/>
      <circle cx="${x + 70}" cy="${b - 69}" r="15" fill="${rad([[0, "#5a6e8a"], [0.5, "#1c2230"], [1, "#050608"]], 0.35, 0.3, 0.7)}"/>
      <ellipse cx="${x + 65}" cy="${b - 74}" rx="5" ry="3.4" fill="#fff" opacity=".55"/>
      <rect x="${x + 92}" y="${b - 88}" width="10" height="9" rx="1.5" fill="#3a4250"/>
      <rect x="${x + 6}" y="${b - 122}" width="106" height="26" rx="4" fill="${black}"/>
      <rect x="${x + 62}" y="${b - 118}" width="44" height="18" rx="2" fill="${lin([[0, "#f4f4f0"], [0.5, "#b8bcc0"], [1, "#e8eaec"]], 0, 0, 1, 1)}"/>
      ${["#e8443a", "#f2a23a", "#f6d84a", "#5cb85c", "#3a8fd8"].map((c, i) => `<rect x="${x + 12}" y="${b - 116 + i * 2.4}" width="12" height="2.4" fill="${c}"/>`).join("")}
      <rect x="${x + 6}" y="${b - 122}" width="106" height="2" rx="1" fill="#fff" opacity=".25"/>
      <rect x="${x + 112}" y="${b - 80}" width="6" height="20" rx="2" fill="#2a2624"/>
      <circle cx="${x + 100}" cy="${b - 47}" r="4" fill="#d8302a"/>
    </g>`;
  }

  // the suitcase lid: outer velvet, inner lining (shown as it opens) and the clasp
  const LID = { geo: null, t: 0, target: 0 };
  function lidShapes(velvet, chrome) {
    return `<polygon class="lid-out" fill="${velvet}"/>
      <polygon class="lid-out" fill="url(#velvet-nap)"/>
      <polygon class="lid-in" fill="${lin([[0, "#7a1a28"], [1, "#5a1020"]])}"/>
      <polygon class="lid-in" fill="url(#velvet-nap)"/>
      <polygon class="lid-edge" fill="#b8485a" opacity=".55"/>
      <rect class="lid-clasp" width="16" height="8" rx="1.5" fill="${chrome}"/>`;
  }

  // a burgundy velvet suitcase record player; it starts closed and flips open when clicked
  function turntable() {
    const fl = 588, fr = 832, ft = 590, fb = 634, k = 0.1;
    const tl = P(fl, ft, k), tr = P(fr, ft, k);
    const sc = PLAT.ry / PLAT.rx, py = PLAT.y - DY;
    const velvet = lin([[0, "#8e2230"], [0.5, "#6e1622"], [1, "#4a0c16"]]);
    const lidTop = 108;
    LID.geo = { fl, fr, ft, tl, tr, lidTop };
    const inset = (pts, d) => [P(pts[0][0] + d, pts[0][1] - 3, 0.02), P(pts[1][0] - d, pts[1][1] - 3, 0.02)];
    const deckIn = [[fl + 8, ft - 3], [fr - 8, ft - 3], [tr[0] - 6, tr[1] + 3], [tl[0] + 6, tl[1] + 3]];
    void inset;
    const chrome = lin([[0, "#f4f1ec"], [0.5, "#a9a39b"], [1, "#e2ded7"]]);
    const latch = (x) => `<rect x="${x - 9}" y="${ft + 12}" width="18" height="13" rx="2" fill="${chrome}"/><rect x="${x - 5}" y="${ft + 15}" width="10" height="7" rx="1" fill="#6a645e"/>`;
    const grille = (x) => `<rect x="${x}" y="${ft + 9}" width="44" height="26" rx="4" fill="#cfcac4"/><rect x="${x}" y="${ft + 9}" width="44" height="26" rx="4" fill="url(#grille)"/>
      <rect x="${x}" y="${ft + 9}" width="44" height="26" rx="4" fill="none" stroke="#000" stroke-opacity=".25"/>`;
    return `<g class="hot beckon" data-hot="turntable" transform="translate(${TT.cx} ${TT.cy}) scale(${TT.s}) translate(${-TT.cx} ${-TT.cy})">
      <ellipse cx="${(fl + fr) / 2 - 6}" cy="${fb + 2}" rx="${(fr - fl) / 2 + 20}" ry="7" fill="#000" opacity=".6" filter="url(#blur4)"/>
      <!-- lid when it's raised (behind the deck); points are animated -->
      <g id="lid-back">${lidShapes(velvet, chrome)}</g>
      <!-- deck -->
      ${poly([[fl, ft], [fr, ft], tr, tl], velvet)}
      ${poly(deckIn, lin([[0, "#121010"], [1, "#2a2626"]], 0, 1, 0, 0))}
      <!-- case front -->
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="${fb - ft}" rx="4" fill="${velvet}"/>
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="${fb - ft}" rx="4" fill="url(#velvet-nap)"/>
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="2" fill="#b8485a" opacity=".7"/>
      ${grille(fl + 12)}${grille(fr - 56)}
      ${latch((fl + fr) / 2 - 42)}${latch((fl + fr) / 2 + 42)}
      <rect x="${(fl + fr) / 2 - 7}" y="${ft + 3}" width="14" height="12" rx="2" fill="${chrome}"/>
      <rect x="${(fl + fr) / 2 - 24}" y="${fb - 12}" width="48" height="16" rx="7" fill="${lin([[0, "#7e1a28"], [1, "#3e0a12"]])}"/>
      <rect x="${fl - 1}" y="${fb - 9}" width="12" height="10" rx="3" fill="${chrome}"/><rect x="${fr - 11}" y="${fb - 9}" width="12" height="10" rx="3" fill="${chrome}"/>
      <circle id="tt-led" cx="${fr - 66}" cy="${ft + 30}" r="2.2" fill="#5a2a2a"/>
      <!-- platter + arm -->
      <g transform="translate(${PLAT.x} ${py})">
        <ellipse cx="0" cy="2" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="#050404"/>
        <ellipse cx="0" cy="0" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="${lin([[0, "#2e2a2a"], [1, "#141212"]], 0, 0, 1, 0)}"/>
        <ellipse cx="0" cy="-.5" rx="${PLAT.rx - 6}" ry="${PLAT.ry - 1}" fill="#1c1a1a" stroke="#333" stroke-width=".6"/>
        <g id="platter-disc" transform="scale(${(PLAT.rx - 4) / 50} ${((PLAT.rx - 4) / 50) * sc})" opacity="0"></g>
        <rect x="-1.2" y="-8" width="2.4" height="8" fill="#d8d2ca"/>
        <g transform="scale(1 ${sc})">
          <g id="tonearm" transform="rotate(0 112 -70)">
            <line x1="112" y1="-70" x2="112" y2="44" stroke="#1a1818" stroke-width="3.4" vector-effect="non-scaling-stroke"/>
            <line x1="112" y1="-70" x2="112" y2="44" stroke="#6a6460" stroke-width="1" vector-effect="non-scaling-stroke"/>
            <rect x="104" y="40" width="16" height="24" rx="3" fill="#121010"/><rect x="108" y="56" width="8" height="10" fill="#c0302a"/>
          </g>
        </g>
      </g>
      <rect x="${PLAT.x + 104}" y="${py - 70 * sc - 16}" width="16" height="14" rx="3" fill="#121010"/>
      <rect x="${PLAT.x + 108}" y="${py - 70 * sc - 22}" width="8" height="8" rx="2" fill="#2a2626"/>
      <circle cx="${PLAT.x + 136}" cy="${py + 6}" r="5" fill="#2a2626"/><circle cx="${PLAT.x + 136}" cy="${py + 5}" r="3" fill="#4a4442"/>
      <!-- lid when it's lowered (covers the deck) -->
      <g id="lid-front">${lidShapes(velvet, chrome)}</g>
    </g>`;
  }

  function lampMarkup() {
    const x = LAMP.x, b = LAMP.base, d = LAMP.drop;
    return `<g class="hot" data-hot="lamp" id="lamp">
      <ellipse cx="${x - 8}" cy="${b + 3}" rx="60" ry="9" fill="#000" opacity=".5" filter="url(#blur4)"/>
      <ellipse cx="${x}" cy="${b - 3}" rx="44" ry="9" fill="${lin([[0, "#f6c9a0"], [1, "#b8704a"]])}"/>
      <ellipse cx="${x}" cy="${b - 6}" rx="40" ry="6" fill="#f8d4b0"/>
      <rect x="${x - 5}" y="${500 + d}" width="10" height="${b - 504 - d}" rx="4" fill="${lin([[0, "#7e2214"], [0.4, "#e0533c"], [1, "#8a2616"]], 0, 0, 1, 0)}"/>
      <g transform="translate(0 ${d})">
        <path d="M${x - 58} 478 Q${x - 60} 500 ${x - 40} 504 L${x + 40} 504 Q${x + 60} 500 ${x + 58} 478 Z" fill="${lin([[0, "#f2e4cc"], [1, "#bfa884"]])}"/>
        <path d="M${x - 64} 480 C${x - 66} 444 ${x - 36} 430 ${x} 430 C${x + 36} 430 ${x + 66} 444 ${x + 64} 480 Z" fill="${lin([[0, "#c7643a"], [0.5, "#843618"], [1, "#4a1a08"]], 0, 0, 1, 1)}"/>
        <path d="M${x - 46} 456 C${x - 40} 440 ${x - 16} 434 ${x} 436" stroke="#ffd2a8" stroke-opacity=".75" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="${x}" cy="480" rx="64" ry="5" fill="#3e1606"/>
      </g>
    </g>`;
  }
  function lampEmissive() {
    const x = LAMP.x;
    return `<g class="lamp-emit" transform="translate(0 ${DY + LAMP.drop})">
      <path d="M${x - 58} 480 Q${x - 60} 500 ${x - 40} 504 L${x + 40} 504 Q${x + 60} 500 ${x + 58} 478 Z" fill="${lin([[0, "#fffdf4"], [1, "#ffd896"]])}"/>
      <ellipse cx="${x}" cy="481" rx="62" ry="4" fill="#3e1606"/>
    </g>`;
  }

  function donutLamp() {
    const cx = 1530, cy = 300;
    return {
      wall: `<path d="M${cx + 8} ${cy + 60} C${cx + 16} 500 ${cx} 700 ${cx + 12} ${FLOOR - 26}" stroke="#3a2214" stroke-width="2" fill="none"/>
        <circle cx="${cx + 10}" cy="${cy + 14}" r="64" fill="#1e0e05" opacity=".4" filter="url(#blur14)"/>`,
      emit: `<g class="donut"><circle cx="${cx}" cy="${cy}" r="130" fill="#ff8434" opacity=".32" filter="url(#blur30)"/>
        <circle cx="${cx}" cy="${cy}" r="62" fill="${rad([[0, "#ffd08a"], [0.35, "#ffaa52"], [0.8, "#f9802e"], [1, "#d85a1c"]])}"/>
        <circle cx="${cx}" cy="${cy}" r="11" fill="#9a3a12"/></g>`
    };
  }

  // a red iPod-shaped floor mirror leaning against the wall
  function ipodMirror() {
    const w = 132, h = 262, x = 1398, b = CAB.bot - 2, k = 1.5;   // back against the wall, base in line with the cabinet
    const red = lin([[0, "#e2333a"], [0.5, "#c41c26"], [1, "#8e0e18"]], 0, 0, 1, 0);
    const sx = 12, sy = 14, sw = w - 24, sh = 122;
    return `<g class="ipod" transform="translate(${x} ${b}) scale(${k})">
      <ellipse cx="${w / 2 + 8}" cy="0" rx="${w * 0.62}" ry="9" fill="#000" opacity=".6" filter="url(#blur6)"/>
      <rect x="${-6}" y="${-h + 14}" width="${w}" height="${h - 8}" rx="12" fill="#1e0e05" opacity=".5" filter="url(#blur10)"/>
      <g transform="translate(0 ${-h})">
        <rect width="${w}" height="${h}" rx="11" fill="${red}"/>
        <rect x="${w - 8}" y="6" width="6" height="${h - 12}" rx="3" fill="#6e0a12" opacity=".55"/>
        <rect x="3" y="3" width="${w - 6}" height="3" rx="1.5" fill="#ff8a8a" opacity=".45"/>
        <rect x="${sx - 2}" y="${sy - 2}" width="${sw + 4}" height="${sh + 4}" rx="3" fill="#2a0a0c"/>
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${lin([[0, "#8c6a58"], [0.45, "#4e3428"], [1, "#2a1a14"]])}"/>
        <!-- what the mirror catches: warm window light and the lamp glow -->
        <path d="M${sx + 10} ${sy} L${sx + 34} ${sy} L${sx + 4} ${sy + sh} L${sx - 20} ${sy + sh} Z" fill="#ffd2a0" opacity=".35" filter="url(#blur4)"/>
        <ellipse cx="${sx + sw * 0.25}" cy="${sy + sh * 0.7}" rx="26" ry="18" fill="#ff9a50" opacity=".35" filter="url(#blur8)"/>
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${lin([[0, "#fff", 0.22], [0.4, "#fff", 0], [0.8, "#fff", 0.06], [1, "#fff", 0]], 0, 0, 1, 1)}"/>
        <text x="${sx + sw / 2}" y="${sy + 10}" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="6.4" fill="#f4efe8">Now Living</text>
        <path d="M${sx + sw - 22} ${sy + 5} l4 2.6 l-4 2.6 Z" fill="#f4efe8"/>
        <rect x="${sx + sw - 14}" y="${sy + 5}" width="9" height="5" rx="1" fill="none" stroke="#f4efe8" stroke-width=".7"/><rect x="${sx + sw - 13}" y="${sy + 6}" width="5" height="3" fill="#f4efe8"/>
        <text x="${sx + sw / 2}" y="${sy + sh - 22}" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-weight="700" font-size="8" fill="#f4efe8">Find</text>
        <text x="${sx + sw / 2}" y="${sy + sh - 13}" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="6.2" fill="#f4efe8">Yourself</text>
        <rect x="${sx + 12}" y="${sy + sh - 8}" width="${sw - 24}" height="3.4" rx="1" fill="none" stroke="#f4efe8" stroke-width=".7"/>
        <rect x="${sx + 12.5}" y="${sy + sh - 7.5}" width="${(sw - 25) * 0.36}" height="2.4" fill="#f4efe8"/>
        <!-- click wheel -->
        <g transform="translate(${w / 2} ${sy + sh + 66})">
          <circle r="47" fill="${rad([[0, "#ffffff"], [0.8, "#f1ede6"], [1, "#d6d0c6"]], 0.4, 0.35, 0.7)}"/>
          <circle r="20" fill="${red}"/>
          <circle r="20" fill="none" stroke="#8e0e18" stroke-opacity=".35" stroke-width="1.5"/>
          <text y="-31" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-weight="700" font-size="7.4" fill="#5a5450">MENU</text>
          <path d="M-36 -3 v6 M-35 0 l5 -3 v6 Z M-30 0 l5 -3 v6 Z" fill="#3a3634" stroke="#3a3634" stroke-width=".8"/>
          <path d="M36 -3 v6 M35 0 l-5 -3 v6 Z M30 0 l-5 -3 v6 Z" fill="#3a3634" stroke="#3a3634" stroke-width=".8"/>
          <path d="M-6 30 l6 3.6 l-6 3.6 Z" fill="#3a3634"/><rect x="2" y="30" width="1.8" height="7.2" fill="#3a3634"/><rect x="5" y="30" width="1.8" height="7.2" fill="#3a3634"/>
        </g>
      </g>
    </g>`;
  }

  // a slim bar sconce above the bulletin board, washing light down over it
  function barSconce() {
    const cx = BOARD.x + BOARD.w / 2, y = BOARD.y - 26, half = 78;
    const bronze = lin([[0, "#5a4636"], [0.5, "#2e241c"], [1, "#1a140e"]]);
    return {
      fixture: `<g class="sconce">
        <rect x="${cx - 13}" y="${y - 17}" width="26" height="11" rx="1.5" fill="${bronze}"/>
        <rect x="${cx - 3}" y="${y - 7}" width="6" height="8" fill="#241c16"/>
        <rect x="${cx - half + 6}" y="${y + 5}" width="${half * 2}" height="9" fill="#000" opacity=".35" filter="url(#blur4)"/>
        <rect x="${cx - half}" y="${y}" width="${half * 2}" height="6" rx="1.5" fill="${bronze}"/>
        <rect x="${cx - half}" y="${y}" width="${half * 2}" height="1.5" fill="#8a7058" opacity=".7"/>
      </g>`,
      glow: `<g class="sconce-glow" style="mix-blend-mode:screen" clip-path="${A.clip(`<rect x="${cx - 600}" y="${y + 4}" width="1200" height="600"/>`)}">
        <ellipse cx="${cx}" cy="${y + 70}" rx="${half + 110}" ry="130" fill="${rad([[0, "#ffa04a", 0.3], [0.5, "#ff8a36", 0.12], [1, "#ff8a36", 0]], 0.5, 0.12, 0.62, false, 0.5, 0.02)}" filter="url(#blur14)"/>
        <ellipse cx="${cx}" cy="${y + 14}" rx="${half + 10}" ry="16" fill="#ffb460" opacity=".22" filter="url(#blur10)"/>
        <rect x="${cx - half + 2}" y="${y + 5}" width="${half * 2 - 4}" height="1.4" fill="#ffc27a" opacity=".85"/>
      </g>`
    };
  }

  // the wand (hidden until the books are tapped). Drawn standing up, handle at (0,0)
  function wandMarkup() {
    const wood = lin([[0, "#2a160c"], [0.45, "#6a4024"], [0.6, "#4a2a16"], [1, "#1e0e06"]], 0, 0, 1, 0);
    return `<g id="wand" transform="translate(800 640)" pointer-events="visiblePainted" style="cursor:pointer">
      <g class="wand-move">
        <g class="wand-light">
          <circle cx="0" cy="-232" r="260" fill="${rad([[0, "#fff6dc", 0.55], [0.25, "#ffe2a8", 0.25], [1, "#ffcf8a", 0]])}" style="mix-blend-mode:screen"/>
          <circle cx="0" cy="-232" r="60" fill="#fffaf0" opacity=".55" filter="url(#blur30)"/>
        </g>
        <path d="M-6 0 L6 0 L3.2 -230 L-3.2 -230 Z" fill="${wood}"/>
        <path d="M-8 0 C-9 -20 -7 -40 -6 -64 L6 -64 C7 -40 9 -20 8 0 Z" fill="${wood}"/>
        ${[-14, -30, -46, -62].map((y) => `<ellipse cx="0" cy="${y}" rx="7.6" ry="2.6" fill="#1a0c04"/><ellipse cx="0" cy="${y - 1.2}" rx="7" ry="1.6" fill="#8a5a34" opacity=".55"/>`).join("")}
        <ellipse cx="0" cy="0" rx="8" ry="3" fill="#160a04"/>
        <path d="M-1 -70 L1 -70 L.8 -226 L-.8 -226 Z" fill="#c89a6a" opacity=".35"/>
        <g class="wand-tip">
          <circle cx="0" cy="-232" r="14" fill="#fffdf2" filter="url(#blur6)"/>
          <circle cx="0" cy="-232" r="5" fill="#fff"/>
          ${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="spark" style="animation-delay:${i * 0.12}s;--a:${i * 60}deg" cx="0" cy="-232" r="2.4" fill="#fff4cc"/>`).join("")}
        </g>
      </g>
      <text class="wand-word" x="0" y="-300" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="34" fill="#fff4dc">Lumos!</text>
    </g>`;
  }

  // the cat's water bowl
  const BOWL = { x: 1310, y: 978 };
  function waterBowl() {
    const { x, y } = BOWL;
    return `<g class="bowl">
      <ellipse cx="${x - 3}" cy="${y + 2}" rx="34" ry="7" fill="#000" opacity=".5" filter="url(#blur4)"/>
      <path d="M${x - 28} ${y - 14} L${x - 22} ${y} Q${x} ${y + 5} ${x + 22} ${y} L${x + 28} ${y - 14} Z" fill="${lin([[0, "#3e6e96"], [0.45, "#8cbfe4"], [1, "#2a4e70"]], 0, 0, 1, 0)}"/>
      <ellipse cx="${x}" cy="${y - 14}" rx="28" ry="6.5" fill="${lin([[0, "#f6f0e6"], [1, "#c8bfb2"]])}"/>
      <ellipse cx="${x}" cy="${y - 13.5}" rx="23" ry="4.6" fill="#9fd0ee"/>
      <ellipse cx="${x - 6}" cy="${y - 14.5}" rx="8" ry="1.4" fill="#fff" opacity=".6"/>
    </g>`;
  }

  // a glowing "PROJECTS" lightbox above the record wall
  function lightbox() {
    const { x0, x1, y0, y1 } = SIGN, d = 10;
    const sideR = [[x1, y0], [x1 + d * 0.5, y0 + d * 0.6], [x1 + d * 0.5, y1 + d * 0.6], [x1, y1]];
    const bottom = [[x0, y1], [x1, y1], [x1 + d * 0.5, y1 + d * 0.6], [x0 + d * 0.5, y1 + d * 0.6]];
    return {
      body: `<g class="lightbox">
        <rect x="${x0 + 8}" y="${y0 + 12}" width="${x1 - x0}" height="${y1 - y0}" fill="#1e0e05" opacity=".4" filter="url(#blur8)"/>
        ${poly(sideR, lin([[0, "#d8d0c4"], [1, "#a89e90"]], 0, 0, 1, 0))}
        ${poly(bottom, "#b8ae9e")}
        <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="2" fill="#f2ece0"/>
      </g>`,
      glow: `<g class="lightbox-glow">
        <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="2" fill="${lin([[0, "#fffdf6"], [0.55, "#fff5e2"], [1, "#f6e6c8"]])}"/>
        <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="2" fill="none" stroke="#e6d8c0" stroke-width="1.5"/>
        <text x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + 14}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif" font-size="40" letter-spacing="2.4" fill="#c8202a">PROJECTS</text>
        <rect x="${x0}" y="${y1 - 3}" width="${x1 - x0}" height="3" fill="#fff" opacity=".7"/>
      </g>`
    };
  }

  /* ---------------- lighting ---------------- */
  function lighting() {
    const L = LAMP_GLOW;
    return `
      <g class="light-lamp" style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2600" fill="${rad([[0, "#ff7a26", 0.62], [0.26, "#d8521a", 0.3], [0.6, "#a03a10", 0.08], [1, "#a03a10", 0]], L.x, L.y, 900, true)}"/>
        <ellipse cx="${L.x}" cy="${L.y - 20}" rx="290" ry="240" fill="${rad([[0, "#ffc27a", 0.55], [1, "#ff9a40", 0]])}"/>
        <ellipse cx="${L.x - 20}" cy="${CAB.top - 14}" rx="340" ry="32" fill="#ffcf8a" opacity=".45" filter="url(#blur14)"/>
        <path d="M${CAB.x1 - 140} ${CAB.top} L${CAB.x1 + 8} ${CAB.top}" stroke="#ffd9a0" stroke-width="3" opacity=".6"/>
      </g>
      <g style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2600" fill="${rad([[0, "#ff8434", 0.3], [1, "#ff8434", 0]], 1530, 300, 420, true)}"/>
      </g>
      <rect x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="#ec9660" opacity=".74"/>
      <rect x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="${rad([[0, "#ffffff", 0], [0.22, "#e8a87a", 0.36], [0.55, "#5a2410", 0.72], [1, "#080201", 0.94]], 860, 620, 1180, true)}"/>
      <rect class="night" x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="${rad([[0, "#6a5a8a"], [0.5, "#3e3458"], [1, "#1e1830"]], 300, 200, 1700, true)}"/>`;
  }

  /* ---------------- assemble ---------------- */
  A.resetDefs();
  BOOK_SHEEN = lin([[0, "#fff", 0.22], [0.35, "#fff", 0.05], [1, "#000", 0.4]]);
  REC_SHADE = lin([[0, "#fff", 0.12], [0.5, "#000", 0.05], [1, "#000", 0.42]], 0, 0, 1, 0.4);
  const NOTE_SHEEN = lin([[0, "#fff", 0.35], [1, "#000", 0.1]], 0, 0, 1, 1);
  const vinyls = music.map((m) => vinylMarkup(m, "spin"));
  const donut = donutLamp(), sconce = barSconce(), sign = lightbox();

  const body = `
    ${wall()}
    ${donut.wall}
    ${board()}
    ${sconce.fixture}
    ${sign.body}
    ${Array.from({ length: Math.min(SITE.wallSlots, 8) }, (_, i) => record(i)).join("")}
    ${floor()}
    ${rug()}
    ${cabinet()}
    ${rackRecords()}
    ${cubbyRight()}
    <g transform="translate(0 ${DY})">
      ${turntable()}
      ${lampMarkup()}
    </g>
    <mask id="curtain-fade" maskUnits="userSpaceOnUse" x="-600" y="-200" width="1400" height="1400">
      <rect x="-600" y="-200" width="1400" height="1400" fill="${lin([[0, "#fff"], [0.86, "#fff"], [1, "#000"]], 0, -200, 0, FLOOR + 40, true)}"/>
    </mask>
    <g id="curtains" pointer-events="none" mask="url(#curtain-fade)"></g>
    ${beanbag()}
    ${ipodMirror()}
    ${waterBowl()}
    <g id="cat" class="hot" data-hot="cat" data-pose="sleep">${window.Cat.markup()}</g>
    <g id="flydisc" opacity="0"></g>
    <g id="overlay" pointer-events="none">${lighting()}</g>
    <g id="emissive" pointer-events="none">
      ${lampEmissive()}
      ${donut.emit}
      ${sign.glow}
      <use id="lamp-halo" href="#lamp" transform="translate(0 ${DY})" filter="url(#outline-only)"/>
      ${wandMarkup()}
      ${sconce.glow}
      <g id="fx"></g>
    </g>`;

  const filters = `
    ${[2, 4, 6, 8, 10, 14, 30].map((d) => `<filter id="blur${d}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${d / 2}"/></filter>`).join("")}
    <clipPath id="labelclip"><circle r="17"/></clipPath>
    <pattern id="hp-diamonds" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M7 0 L14 5 L7 10 L0 5 Z" fill="#000" opacity=".16"/><path d="M7 1.5 L12 5 L7 8.5 L2 5 Z" fill="#fff" opacity=".06"/></pattern>
    <pattern id="grille" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#7a746e"/></pattern>
    <pattern id="velvet-nap" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".6" fill="#fff" opacity=".07"/><circle cx="4" cy="5" r=".6" fill="#000" opacity=".12"/></pattern>
    <pattern id="cam-mesh" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".6" fill="#3a2a10" opacity=".8"/></pattern>
    <filter id="outline-glow" x="-15%" y="-30%" width="130%" height="160%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/>
      <feGaussianBlur in="d" stdDeviation="2" result="b"/>
      <feFlood flood-color="#fff0c8"><animate attributeName="flood-opacity" values=".3;1;.3" dur="1.8s" repeatCount="indefinite"/></feFlood>
      <feComposite in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="outline-only" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/>
      <feGaussianBlur in="d" stdDeviation="4" result="b"/>
      <feFlood flood-color="#ffd890"><animate attributeName="flood-opacity" values=".35;.95;.35" dur="2s" repeatCount="indefinite"/></feFlood>
      <feComposite in2="b" operator="in" result="g"/>
      <feComposite in="g" in2="SourceAlpha" operator="out"/>
    </filter>
    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b"/>
      <feFlood flood-color="#ffc47e" flood-opacity=".9"/><feComposite in2="b" operator="in" result="g"/>
      <feComponentTransfer in="SourceGraphic" result="s"><feFuncR type="linear" slope="1.16"/><feFuncG type="linear" slope="1.12"/><feFuncB type="linear" slope="1.06"/></feComponentTransfer>
      <feMerge><feMergeNode in="g"/><feMergeNode in="s"/></feMerge>
    </filter>
`;

  const svg = document.getElementById("room");
  svg.setAttribute("viewBox", "0 0 1600 1000");
  svg.innerHTML = `<defs>${filters}${A.defsMarkup()}</defs>${body}`;
  const $ = (sel) => svg.querySelector(sel);

  /* ---------------- state ---------------- */
  const S = { lamp: true, disc: null, queue: null, angle: 0, arm: 0, notes: [], hover: null, t: 0 };

  /* ---------------- records ---------------- */
  const flyEl = $("#flydisc"), platEl = $("#platter-disc"), armEl = $("#tonearm"), ledEl = $("#tt-led");
  const recPos = (i) => { const rc = RACK.find((r) => r.i === i); return { x: rc.x + SLEEVE * SQ * 0.5, y: REC_BASE - SLEEVE * 0.55 }; };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const platScale = ((PLAT.rx - 4) / 50) * TT.s, platSy = platScale * (PLAT.ry / PLAT.rx);
  const DISC0 = 0.58;
  const recEl = (i) => svg.querySelector(`[data-hot=music][data-i="${i}"]`);

  /* ---------------- the lid: closed on arrival, flips open on click ---------------- */
  const lidBack = $("#lid-back"), lidFront = $("#lid-front"), platterGroup = $("#platter-disc").parentNode;
  const armGroup = armEl.closest("g[transform^='scale']");
  let afterOpen = null, prompted = false;
  function drawLid(t) {
    const { fl, fr, ft, tl, tr, lidTop } = LID.geo;
    const a = ease(t) * Math.PI * 0.5;                  // 0 = lying on the deck, 1 = standing up
    const hy = (tl[1] + tr[1]) / 2 + 2;
    const reach = Math.hypot(lidTop, ft - hy);          // lid length
    const ey = hy + Math.cos(a) * (ft - hy) - Math.sin(a) * lidTop;
    const spread = 1 - t;                               // the free edge is wider when it's down at the front
    const ex0 = lerp(tl[0] - 6, fl - 2, spread), ex1 = lerp(tr[0] + 6, fr + 2, spread);
    const outer = [[tl[0] - 2, hy], [tr[0] + 2, hy], [ex1, ey], [ex0, ey]];
    const inset = (p, d) => [[p[0][0] + 9, p[0][1] - 4 * (t > 0.5 ? 1 : -1)], [p[1][0] - 9, p[1][1] - 4 * (t > 0.5 ? 1 : -1)], [p[2][0] - 8, p[2][1] + d], [p[3][0] + 8, p[3][1] + d]];
    const inner = inset(outer, 12);
    const edge = [[ex0, ey], [ex1, ey], [ex1, ey + 7 * (1 - t)], [ex0, ey + 7 * (1 - t)]];
    const up = ey < hy;
    const g = up ? lidBack : lidFront;
    lidBack.style.display = up ? "" : "none";
    lidFront.style.display = up ? "none" : "";
    const pts = (p) => p.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
    g.querySelectorAll(".lid-out").forEach((e) => e.setAttribute("points", pts(outer)));
    g.querySelectorAll(".lid-in").forEach((e) => { e.setAttribute("points", pts(inner)); e.setAttribute("opacity", up ? Math.min(1, (hy - ey) / 30).toFixed(2) : 0); });
    g.querySelector(".lid-edge").setAttribute("points", pts(edge));
    const clasp = g.querySelector(".lid-clasp");
    clasp.setAttribute("x", ((ex0 + ex1) / 2 - 8).toFixed(1)); clasp.setAttribute("y", (ey - 2).toFixed(1));
    // the platter and arm are hidden under the closed lid
    const show = up || t > 0.02 ? "" : "none";
    platterGroup.style.visibility = up ? "visible" : "hidden";
    if (armGroup) armGroup.style.visibility = up ? "visible" : "hidden";
    void reach; void show;
  }
  function setLid(open, then) {
    LID.target = open ? 1 : 0;
    afterOpen = then || null;
    AE.sfx(open ? "latch" : "thump");
  }
  function updateLid(dt) {
    if (LID.t === LID.target) return;
    LID.t = LID.target > LID.t ? Math.min(1, LID.t + dt / 0.75) : Math.max(0, LID.t - dt / 0.6);
    drawLid(LID.t);
    if (LID.t === 1) {
      if (afterOpen) { const f = afterOpen; afterOpen = null; f(); }
      else if (!prompted) promptRecord();
    }
  }
  // after the lid opens, one record glows to invite a hover
  function promptRecord() {
    prompted = true;
    const el = recEl(0);
    if (!el) return;
    el.classList.add("halo");
    el.addEventListener("pointerenter", () => el.classList.remove("halo"), { once: true });
  }
  function stopBeckon() { const t = svg.querySelector('[data-hot="turntable"]'); if (t) t.classList.remove("beckon"); }
  function clickTurntable() {
    stopBeckon();
    if (S.disc) return returnDisc();
    setLid(LID.target !== 1);
  }

  function pickRecord(i) {
    stopBeckon();
    if (LID.t < 1) {                                    // open the lid first, then play
      prompted = true; svg.querySelectorAll(".rec.halo").forEach((e) => e.classList.remove("halo"));
      return setLid(true, () => pickRecord(i));
    }
    svg.querySelectorAll(".rec.halo").forEach((e) => e.classList.remove("halo"));
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
    recEl(i).classList.add("out");
    refreshCard();
  }
  function returnDisc() {
    if (!S.disc) return;
    AE.stop(); hud(null);
    S.disc.phase = "armUp";
    refreshCard();
  }
  function updateDisc(dt) {
    const d = S.disc;
    if (!d) return;
    if (d.phase === "arm" || d.phase === "play" || d.phase === "armUp") S.angle += dt * 200;
    const spin = platEl.querySelector(".spin");
    if (spin) spin.setAttribute("transform", `rotate(${S.angle})`);
    const s = recPos(d.id);
    const out = (t) => { // slides up out of its sleeve, turning to face you
      const e = ease(t);
      flyEl.setAttribute("transform", `translate(${s.x} ${s.y - e * 100}) scale(${lerp(SQ * DISC0, DISC0, e)} ${DISC0})`);
    };
    const fly = (t) => {
      const e = ease(t);
      const x = lerp(s.x, PLAT_W.x, e), y = lerp(s.y - 100, PLAT_W.y - 1, e) - Math.sin(Math.PI * t) * 70;
      flyEl.setAttribute("transform", `translate(${x} ${y}) scale(${lerp(DISC0, platScale, e)} ${lerp(DISC0, platSy, e)})`);
    };
    switch (d.phase) {
      case "out": d.t = Math.min(1, d.t + dt / 0.45); flyEl.setAttribute("opacity", 1); out(d.t); if (d.t >= 1) { d.phase = "fly"; d.t = 0; } break;
      case "fly": d.t = Math.min(1, d.t + dt / 0.85); fly(d.t);
        if (d.t >= 1) { d.phase = "arm"; flyEl.setAttribute("opacity", 0); platEl.setAttribute("opacity", 1); AE.sfx("thump"); } break;
      case "arm": S.arm = Math.min(1, S.arm + dt / 0.7);
        if (S.arm >= 1) { d.phase = "play"; AE.play(music[d.id]); hud(music[d.id]); ledEl.setAttribute("fill", "#7dff8a"); refreshCard(); } break;
      case "armUp": ledEl.setAttribute("fill", "#5a2a2a"); S.arm = Math.max(0, S.arm - dt / 0.45);
        if (S.arm <= 0) { d.phase = "back"; d.t = 1; platEl.setAttribute("opacity", 0); flyEl.setAttribute("opacity", 1); } break;
      case "back": d.t = Math.max(0, d.t - dt / 0.75); fly(d.t); if (d.t <= 0) { d.phase = "in"; d.t = 1; } break;
      case "in": d.t = Math.max(0, d.t - dt / 0.4); out(d.t);
        if (d.t <= 0) {
          flyEl.setAttribute("opacity", 0);
          recEl(d.id).classList.remove("out");
          S.disc = null; refreshCard();
          if (S.queue !== null) { const q = S.queue; S.queue = null; startDisc(q); }
        } break;
    }
    armEl.setAttribute("transform", `rotate(${ease(S.arm) * 32} 112 -70)`);
  }

  /* ---------------- notes ---------------- */
  const NOTE_COLS = ["#fff1a6", "#ffd0dc", "#cfeeff", "#d9f3c6", "#ffdcb0"];
  function wrap(text, n = 17, max = 4) {
    const words = String(text).split(/\s+/), lines = [];
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
    $("#notes").innerHTML = S.notes.slice(0, 8).map((n, i) => {
      const h = hash(n.id), col = NOTE_COLS[h % NOTE_COLS.length];
      const x = BOARD.x + 30 + (i % 3) * 104, y = BOARD.y + 88 + Math.floor(i / 3) * 106;
      const rot = ((h >> 4) % 9) - 4;
      return `<g class="hot note" data-hot="note" data-i="${i}" transform="translate(${x} ${y}) rotate(${rot} 42 36) scale(.92)">
        <g class="lift">
        <rect x="3" y="6" width="92" height="78" fill="#1e0e05" opacity=".45" filter="url(#blur4)"/>
        <rect width="92" height="78" fill="${col}"/><rect width="92" height="78" fill="${NOTE_SHEEN}"/>
        ${wrap(n.message).map((l, j) => `<text x="9" y="${24 + j * 14}" font-family="Caveat, cursive" font-size="16" fill="#3a2a2a">${esc(l)}</text>`).join("")}
        <text x="84" y="72" text-anchor="end" font-family="Caveat, cursive" font-size="13" fill="#7a6058">— ${esc(String(n.name).slice(0, 14))}</text>
        <circle cx="46" cy="5" r="5" fill="${["#d9473b", "#e0a43b", "#3a7bd5", "#4aa36a"][h % 4]}"/><circle cx="44.5" cy="3.5" r="1.6" fill="#fff" opacity=".7"/>
        </g></g>`;
    }).join("");
  }

  /* ---------------- sheer curtains drifting in from the window ---------------- */
  const curtainsEl = $("#curtains"), sunEl = svg.querySelector(".sun");
  const CURTAIN = { top: -80, bot: FLOOR + 26, rows: 24, strips: 12 };
  const hemY = (L, u, y, t) => (y < CURTAIN.bot - 1 ? y : y + 9 * Math.sin(u * 11 + t * 0.9 + L.phase) + 5 * Math.sin(u * 23 + L.phase * 3));
  const layers = [
    { x0: -150, w: 190, amp: 175, phase: 0, a: [0.5, 0.34] },
    { x0: -195, w: 190, amp: 125, phase: 1.9, a: [0.36, 0.24] }
  ].map((L) => {
    const g = document.createElementNS(SVGNS, "g");
    L.paths = Array.from({ length: CURTAIN.strips }, (_, i) => {
      const p = document.createElementNS(SVGNS, "path");
      p.setAttribute("fill", i % 2 ? "#fffaf2" : "#ffeed8");
      p.setAttribute("opacity", L.a[i % 2]);
      g.appendChild(p);
      return p;
    });
    curtainsEl.appendChild(g);
    return L;
  }).reverse();
  function curtainX(L, u, y, t, gust) {
    const v = (y - CURTAIN.top) / (CURTAIN.bot - CURTAIN.top);
    const gather = 0.55 + 0.45 * v;                       // gathered at the rod, fuller toward the hem
    const billow = L.amp * gust * Math.pow(u, 0.9) * (0.25 + 0.75 * v);
    const ripple = 7 * Math.sin(y * 0.011 + t * 1.4 + u * 4 + L.phase) * (0.3 + v);
    return L.x0 + u * L.w * gather + billow + ripple;
  }
  function updateCurtains(t) {
    let gustMain = 0;
    layers.forEach((L) => {
      // slow, irregular breeze
      const gust = Math.max(0, 0.45 + 0.35 * Math.sin(t * 0.37 + L.phase) + 0.2 * Math.sin(t * 0.91 + L.phase * 2));
      if (L.phase === 0) gustMain = gust;
      const ys = Array.from({ length: CURTAIN.rows + 1 }, (_, j) => CURTAIN.top + (j / CURTAIN.rows) * (CURTAIN.bot - CURTAIN.top));
      L.paths.forEach((p, i) => {
        const u0 = i / CURTAIN.strips, u1 = (i + 1) / CURTAIN.strips;
        let d = "";
        ys.forEach((y, j) => { d += (j ? "L" : "M") + curtainX(L, u0, y, t, gust).toFixed(1) + " " + hemY(L, u0, y, t).toFixed(1); });
        for (let j = ys.length - 1; j >= 0; j--) d += "L" + curtainX(L, u1, ys[j], t, gust).toFixed(1) + " " + hemY(L, u1, ys[j], t).toFixed(1);
        p.setAttribute("d", d + "Z");
      });
    });
    // the window light shifts as the curtains move
    if (sunEl) { sunEl.setAttribute("opacity", (0.82 - gustMain * 0.25).toFixed(3)); sunEl.setAttribute("transform", `translate(${(gustMain * 14).toFixed(1)} 0)`); }
  }

  /* ---------------- hearts ---------------- */
  const fxEl = $("#fx"), parts = [];
  function spawn(x, y, kind) {
    const g = document.createElementNS(SVGNS, "g");
    g.innerHTML = kind === "z"
      ? `<text font-family="Fraunces, Georgia, serif" font-style="italic" font-size="20" fill="#fff0dc">z</text>`
      : `<path d="M0 6 C-14 -4 -8 -16 0 -8 C8 -16 14 -4 0 6 Z" fill="#ff7096"/>`;
    fxEl.appendChild(g);
    const z = kind === "z";
    parts.push({ g, x, y, vx: z ? 8 : (Math.random() - 0.5) * 30, vy: z ? -18 : -60, life: z ? 2.6 : 1.4, max: z ? 2.6 : 1.4 });
  }

  /* ---------------- the cat ---------------- */
  const catEl = $("#cat");
  const cat = window.Cat.start(catEl, {
    bowl: BOWL, xMin: 90, xMax: 1520, yMin: 952, yMax: 992, scale: 0.5, AE,
    onZ: (x, y) => spawn(x, y, "z")
  });
  window.Cat.maybePeek(AE);
  function petCat() {
    const st = cat.state;
    for (let i = 0; i < 4; i++) setTimeout(() => spawn(st.x - 25 + Math.random() * 50, st.y - 80), i * 150);
    cat.pet();
  }
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) { p.g.remove(); parts.splice(i, 1); continue; }
      p.g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${0.8 + (1 - p.life / p.max) * 0.5})`);
      p.g.setAttribute("opacity", Math.min(1, (p.life / p.max) * 2).toFixed(2));
    }
  }

  /* ---------------- DOM wiring ---------------- */
  const hudEl = document.getElementById("hud");
  const toastEl = document.getElementById("toast");

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.t += dt;
    updateDisc(dt); updateLid(dt); updateParts(dt); updateCurtains(S.t); cat.update(dt);
    requestAnimationFrame(loop);
  }

  const hotFrom = (t) => (t.closest ? t.closest("[data-hot]") : null);

  function refreshCard() {}

  svg.addEventListener("click", (e) => {
    const el = hotFrom(e.target);
    if (!el) return;
    const kind = el.dataset.hot, i = +el.dataset.i;
    act(kind, i);
  });
  function act(kind, i) {
    switch (kind) {
      case "project": return openProject(projects[i]);
      case "music": return pickRecord(i);
      case "turntable": return clickTurntable();
      case "lamp": return toggleLamp();
      case "camera": openModal("camera-modal"); return window.InstantCamera.start();
      case "beanbag": return rustle();
      case "cat": return petCat();
      case "books": return lumos();
      case "note": case "board": return openNotes();
    }
  }
  // the beanbag rustles when you brush past it
  const bag = $(".beanbag");
  let rustleAt = 0;
  function rustle() {
    const now = performance.now();
    if (now - rustleAt < 700) return;
    rustleAt = now;
    bag.classList.remove("wobble"); void bag.getBBox(); bag.classList.add("wobble");
    AE.sfx("rustle");
  }
  bag.addEventListener("pointerenter", rustle);

  /* ---------------- tap the books: a wand appears, swishes, and casts Lumos ---------------- */
  const wandEl = $("#wand");
  let lumosT = null;
  function lumos() {
    if (wandEl.classList.contains("on")) return nox();
    wandEl.classList.remove("cast", "lit", "leaving");
    void wandEl.getBBox();
    wandEl.classList.add("on");
    AE.sfx("whoosh");
    clearTimeout(lumosT);
    lumosT = setTimeout(() => {
      wandEl.classList.add("cast");
      AE.sfx("lumos");
      // the room goes dark and the wand becomes the light
      S.lamp = false; document.body.classList.add("lamp-off", "lumos");
      setTimeout(() => wandEl.classList.add("lit"), 250);
      lumosT = setTimeout(hideWand, 2200);
    }, 1150);
  }
  // the wand slips away; the room stays dark and the lamp glows to be switched back on
  function hideWand() {
    clearTimeout(lumosT);
    wandEl.classList.add("leaving");
    wandEl.classList.remove("lit");
    document.body.classList.add("lamp-beckon");
    lumosT = setTimeout(() => wandEl.classList.remove("on", "cast", "leaving"), 600);
  }
  function nox() { hideWand(); }
  wandEl.addEventListener("click", hideWand);

  function toggleLamp() {
    S.lamp = !S.lamp;
    document.body.classList.toggle("lamp-off", !S.lamp);
    if (S.lamp) document.body.classList.remove("lumos", "lamp-beckon");
    AE.sfx("click");
  }

  function hud(m) {
    if (!m) return hudEl.classList.remove("show");
    hudEl.querySelector(".title").textContent = `${m.title} — ${m.artist}${m.src ? "" : " (lo-fi stand-in)"}`;
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
    const f = m.querySelector("textarea, .x"); if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModals() {
    document.querySelectorAll(".modal.open").forEach((m) => {
      if (m.id === "project-modal") return closeProject();
      if (m.id === "camera-modal") window.InstantCamera.stop();
      m.classList.remove("open"); m.setAttribute("aria-hidden", "true");
    });
  }
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModals));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

  // the record opens like a gatefold sleeve: the cover swings open to the
  // project notes and the vinyl slides out of its pocket
  const gate = document.getElementById("gatefold");
  let gateT = null;
  function openProject(p) {
    document.getElementById("project-cover").innerHTML = `<svg viewBox="0 0 100 100"><defs>${A.defsMarkup()}</defs>${A.cover(p.cover)}</svg>`;
    document.getElementById("gf-disc").innerHTML = `<svg viewBox="-52 -52 104 104"><defs>${A.defsMarkup()}</defs>${vinylMarkup({ cover: p.cover })}</svg>`;
    document.getElementById("project-title").textContent = p.title;
    document.getElementById("project-sub").textContent = [p.subtitle, p.year].filter(Boolean).join(" · ");
    document.getElementById("project-tags").innerHTML = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    document.getElementById("project-blurb").textContent = p.blurb || "";
    const link = document.getElementById("project-link");
    if (p.url) { link.href = p.url; link.classList.remove("disabled"); link.textContent = "open project →"; }
    else { link.removeAttribute("href"); link.classList.add("disabled"); link.textContent = "full project page coming soon"; }
    gate.classList.remove("opened");
    openModal("project-modal");
    clearTimeout(gateT);
    gateT = setTimeout(() => gate.classList.add("opened"), 420);
    AE.sfx("thump");
  }
  function closeProject() {
    gate.classList.remove("opened");
    clearTimeout(gateT);
    gateT = setTimeout(() => { const m = document.getElementById("project-modal"); m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }, 520);
  }

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

  const nav = document.getElementById("a11y-nav");
  nav.innerHTML = "<h2>Projects</h2>" + projects.map((p, i) => `<button data-p="${i}">${esc(p.title)}</button>`).join("") +
    "<h2>Music</h2>" + music.map((m, i) => `<button data-m="${i}">Play ${esc(m.title)} by ${esc(m.artist)}</button>`).join("") +
    `<button data-a="lamp">Toggle lamp</button><button data-a="notes">Leave a note</button><button data-a="camera">Take an instant photo</button>`;
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.p) openProject(projects[+b.dataset.p]);
    else if (b.dataset.m) pickRecord(+b.dataset.m);
    else if (b.dataset.a === "lamp") toggleLamp();
    else if (b.dataset.a === "notes") openNotes();
    else if (b.dataset.a === "camera") { openModal("camera-modal"); window.InstantCamera.start(); }
  });

  const wrapEl = document.getElementById("stage-wrap");
  const arrowL = document.getElementById("pan-left"), arrowR = document.getElementById("pan-right");
  function updateArrows() {
    const max = wrapEl.scrollWidth - wrapEl.clientWidth;
    const pannable = max > 4;
    arrowL.classList.toggle("show", pannable && wrapEl.scrollLeft > 8);
    arrowR.classList.toggle("show", pannable && wrapEl.scrollLeft < max - 8);
  }
  function centerScroll() { if (wrapEl.scrollWidth > wrapEl.clientWidth) wrapEl.scrollLeft = (wrapEl.scrollWidth - wrapEl.clientWidth) * 0.5; updateArrows(); }
  window.addEventListener("resize", centerScroll);
  wrapEl.addEventListener("scroll", updateArrows, { passive: true });
  const pan = (dir) => wrapEl.scrollBy({ left: dir * wrapEl.clientWidth * 0.6, behavior: "smooth" });
  arrowL.addEventListener("click", () => pan(-1));
  arrowR.addEventListener("click", () => pan(1));

  (function grain() {
    const c = document.createElement("canvas"); c.width = c.height = 160;
    const g = c.getContext("2d"), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    document.getElementById("grain").style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------------- boot ---------------- */
  document.title = SITE.title;
  refreshNotes();
  drawLid(0);
  centerScroll();
  requestAnimationFrame(loop);
  window.__room = { S, cat };
})();
