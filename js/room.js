/* The room, as one layered SVG illustration.
   Stage is 1600x1000. The wall is the plane at depth 0; furniture is projected
   toward a vanishing point so tops and sides read as 3D. */
(function () {
  "use strict";
  const SITE = window.SITE, AE = window.AudioEngine, Notes = window.NotesStore, A = window.Art, CatArt = window.CatArt;
  const { lin, rad, rng, hash, esc } = A;

  const FLOOR = 860;
  const VP = { x: 800, y: 250 };
  const P = (x, y, k) => [x + (VP.x - x) * k, y + (VP.y - y) * k];
  const pt = (a) => `${a[0].toFixed(1)},${a[1].toFixed(1)}`;
  const poly = (pts, fill, extra = "") => `<polygon points="${pts.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;
  const SVGNS = "http://www.w3.org/2000/svg";
  const clipShape = (shapes) => A.clip(shapes);

  /* ---------------- layout ---------------- */
  const COVER = 150, GAP = 60;
  const COLS = [0, 1, 2, 3].map((i) => 510 + i * (COVER + GAP));
  const ROWS = [110, 330];
  const CAB = { x0: 560, x1: 1240, top: 730, k: 0.1 };
  CAB.bot = (FLOOR - VP.y * CAB.k) / (1 - CAB.k);
  const CUBL = { x0: 580, x1: 896, y0: CAB.top + 28, y1: CAB.bot - 24 };
  const CUBR = { x0: 914, x1: 1220, y0: CAB.top + 28, y1: CAB.bot - 24 };
  const DY = CAB.top - 640;                          // cabinet-top objects are drawn for a top at y=640
  const PLAT = { x: 700, y: 586 + DY, rx: 96, ry: 16 };
  const LAMP = { x: 1130, base: 620, drop: 44 };     // drop = how much shorter than before
  const LAMP_GLOW = { x: 1130, y: 490 + DY + LAMP.drop };
  const BOARD = { x: 36, y: 170, w: 360, h: 350 };
  const CAT_SCALE = 0.6;
  const CAT_SPOTS = [
    { x: 1478, y: 960, says: "fast asleep on her bed" },
    { x: 1030, y: 982, says: "napping on the rug" }
  ];
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
      panes.push(poly([sk(xa, ya), sk(xb, ya), sk(xb, yb), sk(xa, yb)], "#ffd38e"));
    return `<g class="sun" opacity=".75" filter="url(#blur14)" style="mix-blend-mode:screen">${panes.join("")}</g>`;
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
      <g transform="translate(${b.x + b.w - 116} ${b.y + b.h - 132}) rotate(6) scale(.84)">
        <rect x="3" y="5" width="92" height="104" fill="#1e0e05" opacity=".4" filter="url(#blur4)"/>
        <rect width="92" height="104" fill="#fbf7ef"/>
        <rect x="8" y="8" width="76" height="72" fill="${lin([[0, "#f2b58a"], [0.6, "#e07a4e"], [1, "#7a3a4e"]])}"/>
        <circle cx="46" cy="60" r="14" fill="#ffe2a4"/><rect x="8" y="62" width="76" height="18" fill="#3a2a4e"/>
        <text x="46" y="98" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#5a4a40">home ♡</text>
        <circle cx="46" cy="4" r="5" fill="#3a7bd5"/><circle cx="44.5" cy="2.5" r="1.6" fill="#fff" opacity=".7"/>
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
        <text y="7" text-anchor="middle" font-family="Caveat, cursive" font-size="27" font-weight="700" fill="#8a4a2e">leave a note!</text>
        <circle cx="-78" cy="-12" r="4.5" fill="#d9473b"/><circle cx="78" cy="-12" r="4.5" fill="#e0a43b"/>
      </g>
      <g id="notes"></g>
    </g>`;
  }

  /* the orange lounge chair with a knot pillow, turned slightly toward the room.
     One quilted piece: a tall back with rounded "ears", a sloping seat and a low front. */
  function armchair() {
    const back = "M92 -172 C84 -240 78 -320 74 -368 C72 -388 82 -400 100 -397 C160 -386 326 -386 390 -399 C410 -402 419 -389 416 -370 C412 -320 404 -240 398 -172 C330 -164 160 -164 92 -172 Z";
    const backSide = "M74 -368 C58 -360 48 -318 48 -258 C48 -208 54 -178 64 -158 L92 -172 C84 -240 78 -320 74 -368 Z";
    const seat = "M92 -172 C160 -164 330 -164 398 -172 C422 -160 440 -140 448 -122 C340 -106 150 -106 52 -124 C58 -146 72 -164 92 -172 Z";
    const front = "M52 -124 C150 -106 340 -106 448 -122 C455 -80 452 -30 442 -4 C340 7 150 7 58 -2 C47 -30 45 -80 52 -124 Z";
    const seatSide = "M52 -124 C40 -130 25 -128 17 -116 C10 -80 10 -30 19 -6 C30 -2 44 -2 58 -2 C47 -30 45 -80 52 -124 Z";
    const all = clipShape(`<path d="${back}"/><path d="${backSide}"/><path d="${seat}"/><path d="${front}"/><path d="${seatSide}"/>`);
    const backG = lin([[0, "#7a260a"], [0.18, "#b44618"], [0.62, "#d8622a"], [1, "#e9773c"]], 0, 0, 1, 0);
    const channel = (d, w = 1) => `<path d="${d}" stroke="#ff9e60" stroke-width="${12 * w}" fill="none" opacity=".22" stroke-linecap="round" filter="url(#blur8)" transform="translate(0 -12)"/>
      <path d="${d}" stroke="#4a1404" stroke-width="${6 * w}" fill="none" opacity=".42" stroke-linecap="round" filter="url(#blur4)"/>
      <path d="${d}" stroke="#5a1a06" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>`;
    const sag = (x0, x1, y, d = 9) => `M${x0} ${y} C${x0 + (x1 - x0) * 0.3} ${y + d} ${x0 + (x1 - x0) * 0.7} ${y + d} ${x1} ${y}`;
    const r = rng(31);
    let nap = "";
    for (let i = 0; i < 900; i++) nap += `<circle cx="${(10 + r() * 445).toFixed(1)}" cy="${(-400 + r() * 400).toFixed(1)}" r="${(0.5 + r()).toFixed(2)}" fill="${r() < 0.5 ? "#ffb07a" : "#5a1806"}" opacity="${(0.12 + r() * 0.18).toFixed(2)}"/>`;
    // knot pillow: soft rope looped into a ball
    const tube = (d) => `<path d="${d}" stroke="#5f8fc0" stroke-width="27" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="#9fc6ee" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="#eaf5ff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85" transform="translate(-2 -5)" filter="url(#blur2)"/>`;
    const knot = `<g transform="translate(244 -196)">
      <ellipse cx="6" cy="44" rx="78" ry="13" fill="#3a0e02" opacity=".55" filter="url(#blur8)"/>
      <ellipse cx="12" cy="0" rx="70" ry="58" fill="#3a0e02" opacity=".3" filter="url(#blur14)" transform="translate(14 -10)"/>
      ${tube("M-44 22 C-56 -6 -30 -30 -4 -22 C22 -14 26 12 8 22")}
      ${tube("M40 26 C58 2 44 -30 14 -30 C-14 -30 -24 -4 -10 14")}
      ${tube("M-30 -18 C-20 -44 16 -48 30 -26 C42 -6 30 20 4 30")}
      ${tube("M-48 4 C-40 30 -8 40 18 34 C40 28 52 14 50 0")}
      ${tube("M-6 -36 C6 -16 6 10 -6 28")}
    </g>`;
    return `<g class="chair" transform="translate(24 994) skewY(-3)">
      <ellipse cx="236" cy="2" rx="248" ry="22" fill="#000" opacity=".6" filter="url(#blur14)"/>
      <path d="${backSide}" fill="${lin([[0, "#4a1404"], [1, "#8a3210"]], 0, 0, 1, 0)}"/>
      <path d="${back}" fill="${backG}"/>
      ${channel(sag(86, 410, -334))}${channel(sag(84, 408, -284))}${channel(sag(86, 404, -232))}${channel(sag(90, 400, -192, 6), 0.8)}
      <path d="M246 -394 C247 -372 247 -352 246 -336" stroke="#5a1a06" stroke-width="3" fill="none" opacity=".45" filter="url(#blur2)"/>
      <path d="M100 -397 C160 -386 326 -386 390 -399" stroke="#ffb27a" stroke-width="4" fill="none" opacity=".4" filter="url(#blur4)"/>
      <path d="${seatSide}" fill="${lin([[0, "#3e1002"], [1, "#7a2a0c"]], 0, 0, 1, 0)}"/>
      <path d="${seat}" fill="${lin([[0, "#a8401a"], [1, "#ef8446"]])}"/>
      <path d="${seat}" fill="${lin([[0, "#000", 0.25], [0.5, "#000", 0], [1, "#fff", 0.06]], 0, 0, 1, 0)}"/>
      ${channel(sag(98, 396, -158, 6), 0.8)}
      <path d="${front}" fill="${lin([[0, "#e06c30"], [0.55, "#bf4f1e"], [1, "#7e2c0c"]])}"/>
      <path d="${front}" fill="${lin([[0, "#000", 0.3], [0.45, "#000", 0], [1, "#fff", 0.05]], 0, 0, 1, 0)}"/>
      ${channel(sag(54, 450, -84, 10))}${channel(sag(56, 448, -44, 10))}
      <path d="M52 -124 C150 -106 340 -106 448 -122" stroke="#ffae70" stroke-width="5" fill="none" opacity=".35" filter="url(#blur4)"/>
      <g clip-path="${all}">${nap}</g>
      ${knot}
    </g>`;
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
        vinyl: r() < 0.5, lean: -7 - r() * 6
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
    return `<g class="hot rec" data-hot="music" data-i="${rc.i}" transform="translate(${rc.x} ${REC_BASE})">${shadow}<g class="lift">${inner}</g></g>`;
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
    return s + rackWire();
  }

  // right cubby: a framed photo of the two of us, and the Harry Potter books stacked flat
  function cubbyRight() {
    const fb = CUBR.y1 - 6, fx = CUBR.x0 + 16, w = 146, h = 116;
    const frame = `<g>
      <rect x="${fx + 8}" y="${fb - h + 8}" width="${w}" height="${h}" fill="#000" opacity=".55" filter="url(#blur10)"/>
      <ellipse cx="${fx + w / 2}" cy="${fb + 1}" rx="${w / 2 + 6}" ry="5" fill="#000" opacity=".6" filter="url(#blur4)"/>
      <g transform="translate(${fx} ${fb - h})">
        <rect width="${w}" height="${h}" rx="3" fill="${lin([[0, "#6a4630"], [0.5, "#3a2416"], [1, "#1e1008"]], 0, 0, 1, 1)}"/>
        <rect x="2" y="2" width="${w - 4}" height="2" fill="#b0845e" opacity=".7"/>
        <rect x="9" y="9" width="${w - 18}" height="${h - 18}" fill="#f6f1e8"/>
        <image href="assets/img/us.jpg" x="15" y="15" width="${w - 30}" height="${h - 30}" preserveAspectRatio="xMidYMid slice"/>
        <rect x="9" y="9" width="${w - 18}" height="${h - 18}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="3" filter="url(#blur2)"/>
        <rect x="9" y="9" width="${w - 18}" height="${h - 18}" fill="${lin([[0, "#fff", 0.26], [0.35, "#fff", 0], [1, "#fff", 0]], 0, 0, 1, 1)}"/>
      </g></g>`;
    const books = [
      ["Sorcerer's Stone", "#a3302a", 12], ["Chamber of Secrets", "#2e5e46", 13], ["Prisoner of Azkaban", "#5b3a78", 14],
      ["Goblet of Fire", "#b5651e", 19], ["Order of the Phoenix", "#2c4a7a", 21], ["Half-Blood Prince", "#4f6e30", 16], ["Deathly Hallows", "#7a1f2e", 18]
    ];
    const r = rng(9), x0 = fx + w + 16;
    let y = fb, out = `<ellipse cx="${x0 + 62}" cy="${fb + 1}" rx="70" ry="5" fill="#000" opacity=".6" filter="url(#blur4)"/>`;
    books.forEach(([title, col, t], i) => {
      const len = 118 + Math.floor(r() * 8), x = x0 + Math.floor(r() * 8) - 4;
      y -= t;
      out += `<rect x="${x + 3}" y="${y + 3}" width="${len}" height="${t}" fill="#000" opacity=".35" filter="url(#blur2)"/>
        <rect x="${x}" y="${y}" width="${len}" height="${t}" rx="1.5" fill="${col}"/>
        <rect x="${x}" y="${y}" width="${len}" height="${t}" rx="1.5" fill="${BOOK_SHEEN}"/>
        <rect x="${x + 4}" y="${y + 1.5}" width="${len - 8}" height=".8" fill="#e8c46a" opacity=".8"/>
        <rect x="${x + 4}" y="${y + t - 2.3}" width="${len - 8}" height=".8" fill="#e8c46a" opacity=".8"/>
        <text x="${x + 8}" y="${y + t / 2 + 2.4}" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="${t > 15 ? 7.2 : 6.4}" letter-spacing=".4" fill="#f0d68c">${esc(title.toUpperCase())}</text>
        <text x="${x + len - 8}" y="${y + t / 2 + 2.4}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="6.6" fill="#f0d68c">${i + 1}</text>`;
      if (i === books.length - 1) out += poly([[x, y], [x + len, y], P(x + len, y, 0.035), P(x, y, 0.035)], col, `opacity=".9"`) + poly([[x, y], [x + len, y], P(x + len, y, 0.035), P(x, y, 0.035)], "#fff", `opacity=".18"`);
    });
    return frame + out;
  }
  let BOOK_SHEEN = "";

  function turntable() {
    const fl = 580, fr = 840, ft = 606, fb = 634, k = 0.1;
    const tl = P(fl, ft, k), tr = P(fr, ft, k);
    const sc = PLAT.ry / PLAT.rx, py = PLAT.y - DY;
    const lid = [P(fl + 4, ft, k), P(fr - 4, ft, k), [tr[0] - 6, tr[1] - 96], [tl[0] + 6, tl[1] - 96]];
    return `<g class="hot" data-hot="turntable">
      <ellipse cx="${(fl + fr) / 2 - 6}" cy="${fb + 2}" rx="${(fr - fl) / 2 + 18}" ry="7" fill="#000" opacity=".55" filter="url(#blur4)"/>
      ${poly(lid, lin([[0, "#fff", 0.1], [1, "#fff", 0.03]]), `stroke="#fff" stroke-opacity=".3" stroke-width="1.5"`)}
      <line x1="${lid[3][0] + 10}" y1="${lid[3][1] + 8}" x2="${lid[0][0] + 30}" y2="${lid[0][1] - 10}" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
      ${poly([[fl, ft], [fr, ft], tr, tl], lin([[0, "#1e1a19"], [1, "#3c3532"]], 0, 1, 0, 0))}
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="${fb - ft}" rx="2" fill="${lin([[0, "#ece8e1"], [0.45, "#c2bcb2"], [1, "#7e776d"]])}"/>
      <rect x="${fl}" y="${ft}" width="${fr - fl}" height="1.5" fill="#fff"/>
      <circle cx="${fl + 18}" cy="${ft + 14}" r="4" fill="#4a4440"/><circle cx="${fl + 32}" cy="${ft + 14}" r="4" fill="#4a4440"/>
      <circle id="tt-led" cx="${fl + 46}" cy="${ft + 14}" r="2.4" fill="#5a2a2a"/>
      <text x="${fr - 14}" y="${ft + 18}" text-anchor="end" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="2" fill="#5d564e">AUDIO</text>
      <g transform="translate(${PLAT.x} ${py})">
        <ellipse cx="0" cy="3" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="#6f6a63"/>
        <ellipse cx="0" cy="0" rx="${PLAT.rx}" ry="${PLAT.ry}" fill="${lin([[0, "#ece8e2"], [1, "#8f897f"]], 0, 0, 1, 0)}"/>
        <ellipse cx="0" cy="-.5" rx="${PLAT.rx - 4}" ry="${PLAT.ry - 1}" fill="#221e1d"/>
        <g id="platter-disc" transform="scale(${(PLAT.rx - 6) / 50} ${((PLAT.rx - 6) / 50) * sc})" opacity="0"></g>
        <ellipse cx="0" cy="-1" rx="3" ry="1" fill="#ddd"/>
        <g transform="scale(1 ${sc})">
          <g id="tonearm" transform="rotate(0 112 -70)">
            <line x1="112" y1="-70" x2="112" y2="50" stroke="#e6e1d9" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
            <rect x="104" y="44" width="16" height="22" rx="3" fill="#2e2a28"/>
          </g>
        </g>
      </g>
      <ellipse cx="${PLAT.x + 112}" cy="${py - 70 * sc - 2}" rx="9" ry="4" fill="#7f7a73"/>
      <rect x="${PLAT.x + 107}" y="${py - 70 * sc - 14}" width="10" height="12" rx="3" fill="${lin([[0, "#f4f1ec"], [1, "#7f7a73"]], 0, 0, 1, 0)}"/>
      <rect x="${PLAT.x + 120}" y="${py + 48 * sc - 9}" width="4" height="9" fill="#7f7a73"/>
    </g>`;
  }

  function lampMarkup() {
    const x = LAMP.x, b = LAMP.base, d = LAMP.drop;
    return `<g class="hot" data-hot="lamp">
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
      <ellipse cx="${x}" cy="494" rx="96" ry="36" fill="#ffd090" opacity=".55" filter="url(#blur14)"/>
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

  function catCorner() {
    const bx = 1480, by = 972;
    return `<ellipse cx="${bx - 8}" cy="${by + 10}" rx="120" ry="24" fill="#000" opacity=".5" filter="url(#blur8)"/>
      <ellipse cx="${bx}" cy="${by}" rx="108" ry="28" fill="${lin([[0, "#8a5a7a"], [1, "#4e2a44"]])}"/>
      <ellipse cx="${bx}" cy="${by - 7}" rx="86" ry="18" fill="${lin([[0, "#e2b0bd"], [1, "#b97f92"]])}"/>
      <ellipse cx="${bx}" cy="${by - 11}" rx="106" ry="19" fill="none" stroke="#a7769a" stroke-width="7"/>
      ${bowl(1300, 976, "#4f7fa6", "#8fc3e2")}
      ${bowl(1376, 980, "#a83e34", "#8a5a2e", true)}`;
  }
  function bowl(x, y, col, fill, kibble) {
    const r = rng(x);
    let k = "";
    if (kibble) for (let i = 0; i < 14; i++) k += `<circle cx="${x - 18 + r() * 36}" cy="${y - 15 + r() * 6}" r="2.6" fill="${["#8a5a2e", "#a8743a", "#6a4220"][i % 3]}"/>`;
    return `<ellipse cx="${x - 4}" cy="${y + 2}" rx="38" ry="8" fill="#000" opacity=".5" filter="url(#blur4)"/>
      <path d="M${x - 30} ${y - 14} L${x - 24} ${y} Q${x} ${y + 6} ${x + 24} ${y} L${x + 30} ${y - 14} Z" fill="${lin([[0, col], [0.45, "#fff"], [1, "#1a1a1a"]], 0, 0, 1, 0)}" opacity=".95"/>
      <path d="M${x - 30} ${y - 14} L${x - 24} ${y} Q${x} ${y + 6} ${x + 24} ${y} L${x + 30} ${y - 14} Z" fill="${col}" opacity=".7"/>
      <ellipse cx="${x}" cy="${y - 14}" rx="30" ry="7" fill="${lin([[0, "#f6f0e6"], [1, "#c8bfb2"]])}"/>
      <ellipse cx="${x}" cy="${y - 13.5}" rx="25" ry="5" fill="${fill}"/>${k}`;
  }

  /* ---------------- lighting ---------------- */
  function lighting() {
    const L = LAMP_GLOW;
    return `
      <g class="light-lamp" style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2600" fill="${rad([[0, "#ff8a30", 0.7], [0.28, "#e0601a", 0.34], [0.6, "#a84212", 0.1], [1, "#a84212", 0]], L.x, L.y, 1000, true)}"/>
        <ellipse cx="${L.x}" cy="${L.y - 20}" rx="290" ry="240" fill="${rad([[0, "#ffc27a", 0.55], [1, "#ff9a40", 0]])}"/>
        <ellipse cx="${L.x - 20}" cy="${CAB.top - 14}" rx="340" ry="32" fill="#ffcf8a" opacity=".45" filter="url(#blur14)"/>
        <path d="M${CAB.x1 - 140} ${CAB.top} L${CAB.x1 + 8} ${CAB.top}" stroke="#ffd9a0" stroke-width="3" opacity=".6"/>
      </g>
      <g style="mix-blend-mode:screen">
        <rect x="-1400" y="-900" width="4400" height="2600" fill="${rad([[0, "#ff8434", 0.3], [1, "#ff8434", 0]], 1530, 300, 420, true)}"/>
      </g>
      <rect x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="#f8b880" opacity=".62"/>
      <rect x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="${rad([[0, "#ffffff", 0], [0.26, "#f0c098", 0.3], [0.6, "#6e3416", 0.66], [1, "#0e0502", 0.95]], 900, 600, 1200, true)}"/>
      <rect class="night" x="-1400" y="-900" width="4400" height="2600" style="mix-blend-mode:multiply" fill="${rad([[0, "#6a5a8a"], [0.5, "#3e3458"], [1, "#1e1830"]], 300, 200, 1700, true)}"/>`;
  }

  /* ---------------- assemble ---------------- */
  A.resetDefs();
  BOOK_SHEEN = lin([[0, "#fff", 0.22], [0.35, "#fff", 0.05], [1, "#000", 0.4]]);
  REC_SHADE = lin([[0, "#fff", 0.12], [0.5, "#000", 0.05], [1, "#000", 0.42]], 0, 0, 1, 0.4);
  const NOTE_SHEEN = lin([[0, "#fff", 0.35], [1, "#000", 0.1]], 0, 0, 1, 1);
  const vinyls = music.map((m) => vinylMarkup(m, "spin"));
  const donut = donutLamp();

  const body = `
    ${wall()}
    ${donut.wall}
    ${sunlight()}
    ${board()}
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
    ${catCorner()}
    ${armchair()}
    <g id="cat" class="hot" data-hot="cat" data-state="sleep">${CatArt.markup()}</g>
    <g id="flydisc" opacity="0"></g>
    <g id="overlay" pointer-events="none">${lighting()}</g>
    <g id="emissive" pointer-events="none">
      ${lampEmissive()}
      ${donut.emit}
      <g id="fx"></g>
    </g>`;

  const filters = `
    ${[2, 4, 6, 8, 10, 14, 30].map((d) => `<filter id="blur${d}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${d / 2}"/></filter>`).join("")}
    <clipPath id="labelclip"><circle r="17"/></clipPath>
    ${CatArt.defs()}`;

  const svg = document.getElementById("room");
  svg.setAttribute("viewBox", "0 0 1600 1000");
  svg.innerHTML = `<defs>${filters}${A.defsMarkup()}</defs>${body}`;
  const $ = (sel) => svg.querySelector(sel);
  CatArt.grow($("#cat"));

  /* ---------------- state ---------------- */
  const S = { lamp: true, disc: null, queue: null, angle: 0, arm: 0, notes: [], hover: null, t: 0 };

  /* ---------------- records ---------------- */
  const flyEl = $("#flydisc"), platEl = $("#platter-disc"), armEl = $("#tonearm"), ledEl = $("#tt-led");
  const recPos = (i) => { const rc = RACK.find((r) => r.i === i); return { x: rc.x + SLEEVE * SQ * 0.5, y: REC_BASE - SLEEVE * 0.55 }; };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const platScale = (PLAT.rx - 6) / 50, platSy = platScale * (PLAT.ry / PLAT.rx);
  const DISC0 = 0.58;
  const recEl = (i) => svg.querySelector(`[data-hot=music][data-i="${i}"]`);

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
      const x = lerp(s.x, PLAT.x, e), y = lerp(s.y - 100, PLAT.y - 1, e) - Math.sin(Math.PI * t) * 70;
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

  /* ---------------- cat: sleeps a lot, sometimes wanders to her other spot ---------------- */
  const catEl = $("#cat");
  const legs = ["hf", "ff", "hn", "fn"].map((k) => catEl.querySelector(`.leg-${k} .leg-swing`));
  const walkBob = catEl.querySelector(".walk-bob"), headBob = catEl.querySelector(".head-bob"), walkTail = catEl.querySelector(".pose-walk .tail");
  const cat = { state: "sleep", spot: 0, x: CAT_SPOTS[0].x, y: CAT_SPOTS[0].y, dir: 1, from: null, timer: 45 + Math.random() * 30, phase: 0, pet: 0 };
  function placeCat() {
    catEl.setAttribute("transform", `translate(${cat.x.toFixed(1)} ${cat.y.toFixed(1)}) scale(${CAT_SCALE * cat.dir} ${CAT_SCALE})`);
  }
  function wakeAndWalk() {
    const to = (cat.spot + 1) % CAT_SPOTS.length;
    cat.from = { x: cat.x, y: cat.y }; cat.to = to;
    cat.dir = CAT_SPOTS[to].x > cat.x ? 1 : -1;
    cat.state = "walk"; catEl.dataset.state = "walk";
  }
  function updateCat(dt) {
    cat.pet = Math.max(0, cat.pet - dt);
    if (cat.state === "sleep") {
      if (cat.pet <= 0) cat.timer -= dt;
      if (cat.timer <= 0) wakeAndWalk();
    } else {
      const tgt = CAT_SPOTS[cat.to], total = Math.abs(tgt.x - cat.from.x) || 1;
      cat.x += cat.dir * Math.min(Math.abs(tgt.x - cat.x), dt * 52);
      cat.y = lerp(cat.from.y, tgt.y, 1 - Math.abs(tgt.x - cat.x) / total);
      cat.phase += dt * 6.2;
      const s = Math.sin(cat.phase);
      [s, -s, -s, s].forEach((v, k) => legs[k] && legs[k].setAttribute("transform", `rotate(${(v * 24).toFixed(1)})`));
      walkBob.setAttribute("transform", `translate(0 ${(-Math.abs(Math.cos(cat.phase)) * 3).toFixed(1)})`);
      headBob.setAttribute("transform", `translate(0 ${(Math.sin(cat.phase * 2) * 1.6).toFixed(1)})`);
      walkTail.setAttribute("transform", `rotate(${(Math.sin(cat.phase * 0.5) * 6).toFixed(1)})`);
      if (Math.abs(tgt.x - cat.x) < 0.5) {
        cat.spot = cat.to; cat.state = "sleep"; catEl.dataset.state = "sleep";
        cat.dir = cat.spot === 0 ? 1 : -1;
        cat.timer = 50 + Math.random() * 40;
      }
    }
    placeCat();
  }
  function petCat() {
    cat.pet = 3;
    for (let i = 0; i < 4; i++) setTimeout(() => spawn(cat.x - 30 + Math.random() * 60, cat.y - 90), i * 150);
    catEl.classList.remove("petted"); void catEl.getBBox(); catEl.classList.add("petted");
    AE.sfx("purr");
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
    $("#notes").innerHTML = S.notes.slice(0, 6).map((n, i) => {
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

  /* ---------------- hearts ---------------- */
  const fxEl = $("#fx"), parts = [];
  function spawn(x, y) {
    const g = document.createElementNS(SVGNS, "g");
    g.innerHTML = `<path d="M0 6 C-14 -4 -8 -16 0 -8 C8 -16 14 -4 0 6 Z" fill="#ff7096"/>`;
    fxEl.appendChild(g);
    parts.push({ g, x, y, vx: (Math.random() - 0.5) * 30, vy: -60, life: 1.4, max: 1.4 });
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
  const tipEl = document.getElementById("tooltip"), hudEl = document.getElementById("hud");
  const toastEl = document.getElementById("toast"), hintEl = document.getElementById("hint");
  const cardEl = document.getElementById("record-card");
  const card = { i: null, hideT: null };

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.t += dt;
    updateDisc(dt); updateCat(dt); updateParts(dt);
    if (S.hover) placeTip(S.hover.el);
    if (card.i !== null) placeCard();
    requestAnimationFrame(loop);
  }

  function tipFor(kind, i) {
    switch (kind) {
      case "project": { const p = projects[i]; return `<b>${esc(p.title)}</b><span>${esc(p.subtitle || "")}${p.year ? " · " + esc(p.year) : ""}</span><em>click to open</em>`; }
      case "empty": return `<b>coming soon</b><span>a new record is on its way</span>`;
      case "turntable": return S.disc && S.disc.phase === "play" ? `<b>now spinning</b><span>${esc(music[S.disc.id].title)}</span><em>click to stop</em>` : `<b>record player</b><span>pull a record from the rack below</span>`;
      case "lamp": return `<b>lamp</b><em>click to turn ${S.lamp ? "off" : "on"}</em>`;
      case "note": { const n = S.notes[i]; return `<span class="topic">${esc(n.topic)}</span><b>“${esc(n.message)}”</b><span>— ${esc(n.name)}</span>`; }
      case "board": return `<b>bulletin board</b><em>click to leave a note</em>`;
      case "cat": return `<b>${esc(SITE.catName)}</b><span>${cat.state === "walk" ? "stretching her legs" : CAT_SPOTS[cat.spot].says}</span><em>click to pet</em>`;
    }
    return "";
  }
  function placeTip(el) {
    const r = el.getBoundingClientRect();
    tipEl.style.left = r.left + r.width / 2 + "px";
    tipEl.style.top = r.top + "px";
  }
  const hotFrom = (t) => (t.closest ? t.closest("[data-hot]") : null);

  // glassy record card
  function showCard(i) {
    clearTimeout(card.hideT);
    if (card.i !== i) {
      card.i = i;
      const m = music[i];
      const img = cardEl.querySelector("img");
      img.src = m.cover; img.alt = `${m.title} cover`;
      cardEl.querySelector(".t").textContent = m.title;
      cardEl.querySelector(".a").textContent = m.artist;
    }
    refreshCard();
    cardEl.classList.add("show");
    placeCard();
  }
  function hideCardSoon() { clearTimeout(card.hideT); card.hideT = setTimeout(() => { cardEl.classList.remove("show"); card.i = null; }, 260); }
  function refreshCard() {
    if (card.i === null) return;
    const on = S.disc && S.disc.id === card.i;
    cardEl.querySelector("button").textContent = on ? "■  put it back" : "▶  play";
    cardEl.querySelector(".n").textContent = music[card.i].src ? "" : "plays a lo-fi stand-in for now";
  }
  function placeCard() {
    const el = recEl(card.i);
    if (!el) return;
    const r = el.getBoundingClientRect();
    cardEl.style.left = r.left + r.width / 2 + "px";
    cardEl.style.top = r.top + "px";
  }
  cardEl.addEventListener("pointerenter", () => clearTimeout(card.hideT));
  cardEl.addEventListener("pointerleave", hideCardSoon);
  cardEl.querySelector("button").addEventListener("click", () => { if (card.i !== null) pickRecord(card.i); refreshCard(); });

  svg.addEventListener("pointermove", (e) => {
    const el = hotFrom(e.target);
    const kind = el && el.dataset.hot, i = el ? +el.dataset.i : null;
    if (kind === "music") { S.hover = null; tipEl.classList.remove("show"); showCard(i); return; }
    if (kind === "project" || kind === "empty") { S.hover = null; tipEl.classList.remove("show"); if (card.i !== null) hideCardSoon(); return; }
    if (card.i !== null) hideCardSoon();
    if (!el) { if (S.hover) { S.hover = null; tipEl.classList.remove("show"); } return; }
    S.hover = { el, kind, i };
    tipEl.innerHTML = tipFor(kind, i);
    tipEl.classList.add("show");
    placeTip(el);
  });
  svg.addEventListener("pointerleave", () => { S.hover = null; tipEl.classList.remove("show"); hideCardSoon(); });
  svg.addEventListener("click", (e) => {
    hintEl.classList.add("gone");
    const el = hotFrom(e.target);
    if (!el) return;
    const kind = el.dataset.hot, i = +el.dataset.i;
    if (kind === "music" && e.pointerType === "touch" && card.i !== i) { showCard(i); return; }
    act(kind, i);
    if (S.hover && S.hover.el === el) tipEl.innerHTML = tipFor(kind, i);
  });
  function act(kind, i) {
    switch (kind) {
      case "project": return openProject(projects[i]);
      case "music": pickRecord(i); return refreshCard();
      case "turntable": return S.disc && returnDisc();
      case "lamp": return toggleLamp();
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
    tipEl.classList.remove("show");
    const f = m.querySelector("textarea, .x"); if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModals() {
    document.querySelectorAll(".modal.open").forEach((m) => {
      if (m.id === "project-modal") return closeProject();
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
    `<button data-a="lamp">Toggle lamp</button><button data-a="notes">Leave a note</button><button data-a="cat">Pet ${esc(SITE.catName)}</button>`;
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.p) openProject(projects[+b.dataset.p]);
    else if (b.dataset.m) pickRecord(+b.dataset.m);
    else if (b.dataset.a === "lamp") toggleLamp();
    else if (b.dataset.a === "notes") openNotes();
    else if (b.dataset.a === "cat") petCat();
  });

  const wrapEl = document.getElementById("stage-wrap");
  function centerScroll() { if (wrapEl.scrollWidth > wrapEl.clientWidth) wrapEl.scrollLeft = (wrapEl.scrollWidth - wrapEl.clientWidth) * 0.5; }
  window.addEventListener("resize", centerScroll);

  (function grain() {
    const c = document.createElement("canvas"); c.width = c.height = 160;
    const g = c.getContext("2d"), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    document.getElementById("grain").style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------------- boot ---------------- */
  document.title = SITE.title;
  placeCat();
  refreshNotes();
  centerScroll();
  requestAnimationFrame(loop);
  window.__room = { S, cat, wakeAndWalk };
})();
