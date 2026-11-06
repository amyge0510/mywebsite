/* The room: drawn at 640x360 on a canvas, lit per-pixel with a dithered
   light map, and scaled up with crisp pixels. */
(function () {
  "use strict";
  const W = 640, H = 360, FLOOR = 320;
  const SITE = window.SITE, AE = window.AudioEngine, Notes = window.NotesStore;

  const canvas = document.getElementById("scene");
  const out = canvas.getContext("2d");
  const buf = document.createElement("canvas"); buf.width = W; buf.height = H;
  const g = buf.getContext("2d", { willReadFrequently: true });
  const stat = document.createElement("canvas"); stat.width = W; stat.height = H;
  const sg = stat.getContext("2d");
  [out, g, sg].forEach((c) => (c.imageSmoothingEnabled = false));

  /* ================= utilities ================= */
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function px(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function ellipse(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
      c.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
    }
  }
  function ellipseRing(c, cx, cy, rx, ry, col, step = 0.04) {
    c.fillStyle = col;
    for (let a = 0; a < Math.PI * 2; a += step) c.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
  function line(c, x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy; c.fillStyle = col;
    for (;;) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // dithered vertical gradient a -> b
  function gradV(c, x, y, w, h, a, b, levels = [a, b]) {
    for (let yy = 0; yy < h; yy++) {
      const t = h > 1 ? yy / (h - 1) : 0;
      for (let xx = 0; xx < w; xx++) {
        const v = t * (levels.length - 1);
        const i = Math.floor(v), f = v - i;
        const col = levels[Math.min(levels.length - 1, i + (bay(x + xx, y + yy) < f ? 1 : 0))];
        px(c, x + xx, y + yy, col);
      }
    }
  }
  // dithered shade: draws col where dither < density
  function shade(c, x, y, w, h, col, density) {
    c.fillStyle = col;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++)
      if (bay(x + xx, y + yy) < density) c.fillRect(x + xx, y + yy, 1, 1);
  }

  /* ---- 3x5 pixel font ---- */
  const FONT = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
    E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
    I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
    M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
    Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
    U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
    Y: "101101010010010", Z: "111001010100111", 0: "111101101101111", 1: "010110010010111",
    2: "111001111100111", 3: "111001011001111", 4: "101101111001001", 5: "111100111001111",
    6: "111100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001111",
    "!": "010010010000010", ".": "000000000000010", "-": "000000111000000", "?": "110001010000010",
    ":": "000010000010000", "'": "010010000000000", "/": "001001010100100", ",": "000000000010100",
    "*": "101111111010000", " ": "000000000000000"
  };
  function text(c, str, x, y, col) {
    c.fillStyle = col;
    for (const ch of str.toUpperCase()) {
      const bits = FONT[ch] || FONT[" "];
      for (let i = 0; i < 15; i++) if (bits[i] === "1") c.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1);
      x += 4;
    }
  }
  const textW = (s) => s.length * 4 - 1;

  /* ---- string sprites ---- */
  function makeSprite(rows, pal) {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== "." && pal[ch]) px(c, x, y, pal[ch]); }));
    return cv;
  }
  function drawSprite(c, spr, x, y, flip) {
    x = Math.round(x); y = Math.round(y);
    if (flip) { c.save(); c.translate(x + spr.width, y); c.scale(-1, 1); c.drawImage(spr, 0, 0); c.restore(); }
    else c.drawImage(spr, x, y);
  }
  function compose(w, h, parts) {
    const gr = Array.from({ length: h }, () => Array(w).fill("."));
    parts.forEach(([rows, ox, oy]) => rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== "." && gr[oy + y] && gr[oy + y][ox + x] !== undefined) gr[oy + y][ox + x] = ch;
    })));
    return gr.map((r) => r.join(""));
  }

  /* ================= cover art ================= */
  function coverArt(spec, s) {
    const cv = document.createElement("canvas"); cv.width = s; cv.height = s;
    const c = cv.getContext("2d");
    const p = spec.palette, u = s / 60, r = rng(hash(spec.label || spec.motif) + s);
    const U = (v) => Math.round(v * u);
    rect(c, 0, 0, s, s, p.bg);
    switch (spec.motif) {
      case "sunset": {
        gradV(c, 0, 0, s, U(34), p.a, p.b, [p.bg, p.b, p.a]);
        // sun
        for (let y = 0; y < U(34); y++) for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - s / 2, y - U(34));
          if (d < U(14)) px(c, x, y, p.c);
        }
        rect(c, 0, U(34), s, s - U(34), p.bg);
        for (let i = 0; i < 7; i++) {
          const y = U(36 + i * 3.4), w = U(26 - i * 3);
          rect(c, s / 2 - w / 2, y, w, Math.max(1, U(1)), p.c);
          rect(c, U(4 + i * 6) % s, y + U(1.5), U(6), 1, p.a);
        }
        break;
      }
      case "ghost": {
        gradV(c, 0, 0, s, U(36), p.a, p.b, [p.a, p.b]);
        gradV(c, 0, U(36), s, s - U(36), p.bg, p.bg, [p.bg, p.bg]);
        for (let i = 0; i < 60 * u; i++) px(c, r() * s, U(36) + r() * (s - U(36)), r() < 0.5 ? "#5a6b42" : "#7d9160");
        // ghost
        const gx = U(36), gy = U(18);
        ellipse(c, gx, gy + U(6), U(7), U(7), p.ink);
        rect(c, gx - U(7), gy + U(6), U(15), U(18), p.ink);
        for (let i = 0; i < 4; i++) rect(c, gx - U(7) + i * U(4), gy + U(24), U(2), U(2), p.ink);
        rect(c, gx - U(3), gy + U(4), Math.max(1, U(1.5)), U(2), "#222");
        rect(c, gx + U(2), gy + U(4), Math.max(1, U(1.5)), U(2), "#222");
        // dog
        rect(c, U(12), U(40), U(9), U(5), p.c); rect(c, U(19), U(37), U(4), U(4), p.c);
        rect(c, U(12), U(45), U(2), U(3), p.c); rect(c, U(18), U(45), U(2), U(3), p.c);
        break;
      }
      case "face": {
        ellipse(c, U(32), U(36), U(18), U(24), p.b); // hair
        ellipse(c, U(32), U(38), U(13), U(18), p.c); // face
        rect(c, U(14), U(14), U(36), U(9), p.b); // bangs
        rect(c, U(23), U(32), U(5), U(2), p.b); rect(c, U(36), U(32), U(5), U(2), p.b);
        px(c, U(25), U(34), "#fff"); px(c, U(38), U(34), "#fff");
        rect(c, U(31), U(37), U(2), U(6), "#c79a80");
        rect(c, U(28), U(47), U(8), U(2), p.a);
        rect(c, U(40), U(10), U(18), U(5), p.a);
        break;
      }
      case "bauhaus": {
        ellipse(c, U(20), U(22), U(14), U(14), p.a);
        rect(c, U(30), U(30), U(26), U(26), p.b);
        for (let y = 0; y < U(20); y++) rect(c, U(8), U(56) - y, U(20) - y, 1, p.c);
        for (let i = 0; i < 4; i++) rect(c, U(38), U(8 + i * 4), U(18), Math.max(1, U(1.5)), p.ink);
        break;
      }
      case "waves": {
        const cols = [p.a, p.b, p.c, p.ink];
        for (let row = 0; row < 9; row++) for (let x = 0; x < s; x++) {
          const y = U(10 + row * 5.5) + Math.round(Math.sin(x / (4 * u) + row) * 2 * u);
          rect(c, x, y, 1, Math.max(1, U(2)), cols[row % 4]);
        }
        break;
      }
      case "planet": {
        for (let i = 0; i < 70 * u; i++) px(c, r() * s, r() * s, r() < 0.3 ? p.c : p.ink);
        const cx = U(30), cy = U(32), R = U(15);
        for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
          const d = Math.hypot(x, y); if (d > R) continue;
          const l = (x + y) / (R * 2) + 0.5; // light from top-left
          px(c, cx + x, cy + y, bay(cx + x, cy + y) < l * 1.2 - 0.1 ? p.b : p.a);
        }
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const x = cx + Math.cos(a) * U(25), y = cy + Math.sin(a) * U(6) - Math.cos(a) * U(3);
          if (Math.sin(a) < 0 && Math.hypot(x - cx, y - cy) < R) continue;
          rect(c, x, y, Math.max(1, U(1.2)), Math.max(1, U(1.2)), p.c);
        }
        break;
      }
      case "flower": {
        for (let y = U(42); y < s; y += U(6)) for (let x = 0; x < s; x += U(6))
          if (((x + y) / U(6)) % 2 < 1) rect(c, x, y, U(6), U(6), p.c);
        rect(c, U(29), U(28), U(3), U(20), p.b);
        ellipse(c, U(24), U(40), U(5), U(2), p.b);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ellipse(c, U(30) + Math.cos(a) * U(9), U(22) + Math.sin(a) * U(9), U(6), U(6), p.a);
        }
        ellipse(c, U(30), U(22), U(5), U(5), p.c);
        break;
      }
      case "dots": {
        for (let y = U(3); y < s; y += U(6)) for (let x = U(3); x < s; x += U(6)) {
          const rr = Math.max(0.5, (1 - Math.hypot(x - s * 0.65, y - s * 0.4) / (s * 0.75)) * U(3));
          ellipse(c, x, y, rr, rr, p.a);
        }
        ellipse(c, U(22), U(40), U(10), U(10), p.b);
        rect(c, U(10), U(52), U(40), Math.max(1, U(2)), p.ink);
        break;
      }
    }
    if (spec.label && s >= 50) {
      text(c, spec.label, 3, 3, p.ink);
    }
    // subtle edge
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, s - 1, s, 1); c.fillRect(s - 1, 0, 1, s);
    c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(0, 0, s, 1); c.fillRect(0, 0, 1, s);
    return cv;
  }

  /* ================= layout ================= */
  const COVER = 60, GAP = 26;
  const ROWS = [22, 108];
  const COLS = [0, 1, 2, 3].map((i) => 218 + i * (COVER + GAP));
  const CAB = { x: 240, y: 250, w: 260, h: 68 };
  const CUBL = { x: 249, y: 258, w: 122, h: 56 };
  const CUBR = { x: 379, y: 258, w: 112, h: 56 };
  const SLEEVE = 28;
  const sleeveX = (i) => CUBL.x + 3 + i * (SLEEVE + 2);
  const SLEEVE_Y = CUBL.y + CUBL.h - SLEEVE - 1;
  const PLAT = { x: 292, y: 229, rx: 30, ry: 7 };
  const PIVOT = { x: 334, y: 224 };
  const LAMP = { cx: 455, cy: 222 };
  const MACH = { x: 30, y: 186, w: 52, h: 46 };
  const BOARD = { x: 18, y: 52, w: 150, h: 110 };
  const CUPS_X = [90, 102, 114];
  const CAT_Y = 347;

  const projects = SITE.projects.map((p) => ({ ...p, art: coverArt(p.cover, COVER) }));
  const music = SITE.music.map((m) => ({ ...m, art: coverArt(m.cover, SLEEVE) }));

  /* ================= state ================= */
  const S = {
    t: 0, lamp: true, lampT: 1,
    hover: null, mouse: { x: -99, y: -99 },
    disc: null, queue: null, angle: 0, arm: 0,
    coffee: null, served: [],
    notes: [], particles: [],
    interacted: false
  };

  /* ================= static layer ================= */
  const PAL = {
    wall: "#ecc59c", wallD: "#e2b88e", wallL: "#f3d1ac",
    wood: "#3a2a22", woodL: "#5a4030", woodLL: "#755440", woodD: "#211812",
    floor: "#8a5a3c", floorD: "#6e4630", floorL: "#9b6a48"
  };

  function drawStatic(c) {
    // wall
    rect(c, 0, 0, W, FLOOR, PAL.wall);
    const r = rng(7);
    for (let i = 0; i < 4200; i++) px(c, r() * W, r() * FLOOR, r() < 0.6 ? PAL.wallD : PAL.wallL);
    // ceiling shadow & corner
    shade(c, 0, 0, W, 6, "#c9a07c", 0.5);
    shade(c, 0, 0, 6, FLOOR, "#c9a07c", 0.4);

    // door (right)
    rect(c, 584, 66, 56, FLOOR - 66, "#e6dccd");
    rect(c, 588, 72, 52, FLOOR - 72, "#f2ebe0");
    rect(c, 588, 72, 1, FLOOR - 72, "#cfc3b2");
    for (let y = 84; y < 204; y += 3) { rect(c, 596, y, 40, 2, "#e4d9c9"); rect(c, 596, y + 2, 40, 1, "#cdbfac"); }
    rect(c, 595, 83, 42, 1, "#cdbfac"); rect(c, 595, 204, 42, 1, "#cdbfac");
    rect(c, 596, 216, 40, 90, "#ebe2d5"); rect(c, 596, 216, 40, 1, "#cdbfac"); rect(c, 596, 216, 1, 90, "#cdbfac");
    rect(c, 592, 196, 3, 4, "#b49a72");

    // baseboard
    rect(c, 0, FLOOR - 8, 584, 8, "#efdcc4"); rect(c, 0, FLOOR - 8, 584, 1, "#fff0dc");
    rect(c, 0, FLOOR - 1, W, 1, "#b8987a");

    // floor planks
    rect(c, 0, FLOOR, W, H - FLOOR, PAL.floor);
    for (let y = FLOOR; y < H; y += 6) {
      rect(c, 0, y, W, 1, PAL.floorD);
      const off = ((y / 6) * 53) % 90;
      for (let x = -off; x < W; x += 90) rect(c, x, y, 1, 6, PAL.floorD);
      rect(c, 0, y + 1, W, 1, PAL.floorL);
    }
    for (let i = 0; i < 600; i++) px(c, r() * W, FLOOR + r() * (H - FLOOR), r() < 0.5 ? PAL.floorD : PAL.floorL);

    // rug
    ellipse(c, 370, 341, 160, 15, "#9e4a36");
    ellipse(c, 370, 341, 154, 12, "#c4704e");
    ellipse(c, 370, 341, 140, 9, "#9e4a36");
    ellipse(c, 370, 341, 136, 7, "#d48a5e");
    for (let x = 250; x < 494; x += 8) { px(c, x, 341, "#f0c890"); px(c, x + 4, 339, "#9e4a36"); px(c, x + 4, 343, "#9e4a36"); }

    // record shelves: ledges + soft shadows
    ROWS.forEach((ry) => COLS.forEach((cx) => {
      shade(c, cx - 3, ry + 64, 66, 5, "#b98e66", 0.5);
      shade(c, cx - 3, ry + 69, 66, 3, "#b98e66", 0.25);
      rect(c, cx - 3, ry + 60, 66, 4, PAL.wood);
      rect(c, cx - 3, ry + 60, 66, 1, PAL.woodLL);
    }));

    drawCounter(c);
    drawBoardFrame(c);
    drawCabinet(c);

    // cat corner: bed + bowls
    ellipse(c, 524, 344, 27, 6, "#7d5a8a");
    ellipse(c, 524, 343, 23, 4, "#e9b9c6");
    for (let x = 504; x < 546; x += 4) px(c, x, 343, "#d9a0b0");
    // water bowl
    rect(c, 558, 341, 13, 5, "#4f7fa6"); rect(c, 557, 340, 15, 2, "#6fa0c8"); rect(c, 559, 340, 11, 1, "#bfe3ff");
    // food bowl
    rect(c, 575, 341, 13, 5, "#b5453a"); rect(c, 574, 340, 15, 2, "#d0644f");
    [576, 579, 582, 585, 578, 583].forEach((x, i) => px(c, x, 339 - (i > 3 ? 1 : 0), "#8a5a2e"));
    // outlet
    rect(c, 516, 292, 6, 9, "#f4ead8"); px(c, 518, 295, "#8a7a68"); px(c, 518, 298, "#8a7a68");
  }

  function drawCounter(c) {
    // body
    rect(c, 16, 237, 156, FLOOR - 237, "#9fb38f");
    rect(c, 16, FLOOR - 5, 156, 5, "#5e6e52");
    rect(c, 20, 242, 72, 70, "#acbf9c"); rect(c, 96, 242, 72, 70, "#acbf9c");
    rect(c, 20, 242, 72, 1, "#c6d6b8"); rect(c, 96, 242, 72, 1, "#c6d6b8");
    rect(c, 20, 311, 72, 1, "#7e8f70"); rect(c, 96, 311, 72, 1, "#7e8f70");
    rect(c, 86, 270, 3, 8, "#e7cf9c"); rect(c, 99, 270, 3, 8, "#e7cf9c");
    // top
    rect(c, 13, 231, 162, 6, "#c89a68"); rect(c, 13, 231, 162, 1, "#e2b886"); rect(c, 13, 236, 162, 1, "#8e643e");

    // machine
    const m = MACH;
    rect(c, m.x + 2, m.y + 44, 4, 2, "#2a2422"); rect(c, m.x + m.w - 6, m.y + 44, 4, 2, "#2a2422");
    rect(c, m.x, m.y + 4, m.w, 40, "#eadcc4");
    rect(c, m.x, m.y + 4, m.w, 1, "#fff4e0");
    rect(c, m.x, m.y, m.w, 5, "#3a3330"); rect(c, m.x + 2, m.y - 2, m.w - 4, 2, "#8c8480");
    rect(c, m.x, m.y + 13, m.w, 3, "#d86c4a");
    // gauge
    ellipse(c, m.x + 10, m.y + 23, 5, 5, "#9a8f84"); ellipse(c, m.x + 10, m.y + 23, 4, 4, "#fbf7ef");
    line(c, m.x + 10, m.y + 23, m.x + 12, m.y + 20, "#c0392b");
    // brew recess
    rect(c, m.x + 18, m.y + 18, 24, 22, "#2a2422");
    rect(c, m.x + 22, m.y + 18, 16, 4, "#9a9490"); rect(c, m.x + 24, m.y + 22, 12, 2, "#2a2422");
    rect(c, m.x + 36, m.y + 22, 14, 2, "#1a1412");
    rect(c, m.x + 17, m.y + 40, 26, 3, "#8a8480"); rect(c, m.x + 17, m.y + 40, 26, 1, "#b5afa8");
    // steam wand
    rect(c, m.x - 3, m.y + 18, 2, 16, "#b5afa8"); rect(c, m.x - 3, m.y + 18, 4, 2, "#b5afa8");
    // cups on top
    rect(c, m.x + 8, m.y - 6, 7, 4, "#f7efe4"); rect(c, m.x + 18, m.y - 6, 7, 4, "#e9a98a");

    // matcha tin, whisk, plant
    rect(c, 124, 218, 10, 13, "#6f8f52"); rect(c, 124, 222, 10, 4, "#f2e8cf"); rect(c, 123, 217, 12, 2, "#4e6b3a");
    rect(c, 138, 224, 6, 7, "#d9b77a"); for (let x = 138; x < 144; x += 2) rect(c, x, 219, 1, 5, "#c9a466");
    rect(c, 150, 221, 13, 10, "#c0603a"); rect(c, 149, 220, 15, 2, "#d4774e");
    const leaves = [[152, 212, 5, 4], [160, 208, 5, 4], [156, 203, 4, 5], [148, 206, 4, 3], [164, 214, 4, 3], [157, 214, 4, 3]];
    leaves.forEach(([x, y, rx, ry], i) => ellipse(c, x, y, rx, ry, i % 2 ? "#5a8a4a" : "#7aaa5a"));
    line(c, 156, 220, 156, 206, "#4a7a3a");
  }

  function drawBoardFrame(c) {
    const b = BOARD;
    shade(c, b.x + 3, b.y + b.h, b.w, 3, "#b98e66", 0.5);
    rect(c, b.x, b.y, b.w, b.h, "#7a4e2e");
    rect(c, b.x + 1, b.y + 1, b.w - 2, 1, "#9a6a44");
    rect(c, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#c8935c");
    const r = rng(3);
    for (let i = 0; i < 900; i++) px(c, b.x + 4 + r() * (b.w - 8), b.y + 4 + r() * (b.h - 8), r() < 0.55 ? "#b07c48" : "#d9a670");
    // title card
    const label = "LEAVE A NOTE!";
    const tw = textW(label) + 8, tx = b.x + Math.floor((b.w - tw) / 2);
    rect(c, tx + 1, b.y + 8, tw, 11, "#9a6a40");
    rect(c, tx, b.y + 7, tw, 11, "#fbf3e4");
    text(c, label, tx + 4, b.y + 10, "#8a4a2e");
    px(c, tx + 2, b.y + 9, "#d9473b"); px(c, tx + tw - 3, b.y + 9, "#d9473b");
    // a polaroid of the cat, a ticket stub and a doodle (notes cover them as the board fills)
    const px0 = b.x + 118, py0 = b.y + 76;
    rect(c, px0 + 1, py0 + 1, 22, 26, "#9a6a40"); rect(c, px0, py0, 22, 26, "#fbf7ef");
    rect(c, px0 + 2, py0 + 2, 18, 17, "#f2b8c0");
    ellipse(c, px0 + 11, py0 + 14, 6, 3, "#ffffff"); ellipse(c, px0 + 7, py0 + 12, 3, 3, "#ffffff");
    px(c, px0 + 5, py0 + 8, "#ffffff"); px(c, px0 + 9, py0 + 8, "#ffffff"); px(c, px0 + 6, py0 + 12, "#333"); px(c, px0 + 8, py0 + 12, "#333");
    rect(c, px0 + 5, py0 + 22, 12, 1, "#9a8a80");
    px(c, px0 + 11, py0 + 1, "#3a7bd5");
    const t0 = b.x + 84, t1 = b.y + 84;
    rect(c, t0, t1, 26, 11, "#e86a4a"); rect(c, t0 + 7, t1, 1, 11, "#fbe3c8");
    text(c, "ADMIT", t0 + 9, t1 + 3, "#fbe3c8");
    [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1], [2, 2], [1, 2], [3, 2], [2, 3]].forEach(([dx, dy]) => px(c, b.x + 66 + dx, b.y + 90 + dy, "#d9473b"));
  }

  function drawCabinet(c) {
    // feet
    rect(c, CAB.x + 4, CAB.y + CAB.h, 6, 3, PAL.woodD); rect(c, CAB.x + CAB.w - 10, CAB.y + CAB.h, 6, 3, PAL.woodD);
    rect(c, CAB.x, CAB.y, CAB.w, CAB.h, PAL.wood);
    rect(c, CAB.x - 4, CAB.y - 6, CAB.w + 8, 6, PAL.woodL);
    rect(c, CAB.x - 4, CAB.y - 6, CAB.w + 8, 1, PAL.woodLL);
    rect(c, CAB.x - 4, CAB.y - 1, CAB.w + 8, 1, PAL.woodD);
    // cubbies
    [CUBL, CUBR].forEach((u) => {
      rect(c, u.x, u.y, u.w, u.h, "#1c1410");
      rect(c, u.x, u.y, u.w, 2, "#120c09");
      rect(c, u.x, u.y + u.h - 1, u.w, 1, "#4a3628");
    });
    // right cubby: shelf + books
    rect(c, CUBR.x, CUBR.y + 27, CUBR.w, 2, PAL.woodL);
    const bc = ["#c0563f", "#e8c26a", "#5d7ea6", "#e6dccd", "#7a9a5a", "#a05a7a", "#d98c4a"];
    let y = CUBR.y + 27;
    [[60, 4], [52, 5], [66, 3], [48, 4]].forEach(([w, h], i) => {
      y -= h; rect(c, CUBR.x + 6 + (i % 2) * 3, y, w, h, bc[i]); rect(c, CUBR.x + 6 + (i % 2) * 3, y, w, 1, "rgba(255,255,255,0.25)");
    });
    let x = CUBR.x + 4;
    const r = rng(19);
    while (x < CUBR.x + CUBR.w - 6) {
      const w = 3 + Math.floor(r() * 4), h = 18 + Math.floor(r() * 8);
      rect(c, x, CUBR.y + CUBR.h - 1 - h, w, h, bc[Math.floor(r() * bc.length)]);
      if (r() < 0.5) rect(c, x, CUBR.y + CUBR.h - 1 - h + 4, w, 1, "#f4ead8");
      x += w + (r() < 0.2 ? 2 : 0);
    }
    // top: books
    rect(c, 356, 239, 50, 5, "#3e5c94"); rect(c, 356, 243, 50, 1, "#e9e0d0");
    rect(c, 359, 234, 44, 5, "#efc65c");
    [[362, 235, "#e2557a"], [368, 236, "#4fa3c7"], [375, 235, "#7bbf6a"], [382, 236, "#e2557a"], [390, 235, "#f08a3c"], [396, 236, "#4fa3c7"]]
      .forEach(([bx, by, col]) => { rect(c, bx, by, 4, 1, col); px(c, bx + 2, by + 1, col); });
    rect(c, 359, 238, 44, 1, "#f7f0e0");

    // turntable plinth (static parts)
    rect(c, 252, 222, 94, 14, "#2c2624");
    rect(c, 252, 222, 94, 1, "#4a423e");
    rect(c, 252, 236, 94, 8, "#d8d3ca"); rect(c, 252, 236, 94, 1, "#f1ede6"); rect(c, 252, 243, 94, 1, "#a8a29a");
    rect(c, 258, 239, 3, 2, "#6a6460"); rect(c, 264, 239, 3, 2, "#6a6460");
    text(c, "AT", 322, 238, "#8a847c");
    ellipse(c, PLAT.x, PLAT.y, PLAT.rx, PLAT.ry, "#bcb6ae");
    ellipse(c, PLAT.x, PLAT.y - 1, PLAT.rx - 1, PLAT.ry - 1, "#3a3432");
    ellipse(c, PIVOT.x, PIVOT.y + 1, 4, 2, "#8c8682"); ellipse(c, PIVOT.x, PIVOT.y, 3, 1.5, "#c9c3bb");
    rect(c, 338, 236 - 8, 4, 2, "#8c8682"); // arm rest
  }

  /* ================= light maps ================= */
  const STEPS = 12;
  function buildLight(on) {
    const m = new Uint16Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let r, gg, b;
      if (on) {
        r = 0.5; gg = 0.4; b = 0.37;
        const dx = x - LAMP.cx, dy = y - 214;
        let gl = 1.3 * Math.exp(-((dx * dx) / (2 * 175 * 175) + (dy * dy) / (2 * 135 * 135)));
        if (y >= 250 && y < 322 && x >= 236 && x < 504) gl *= 0.55; // cabinet front faces away from the bulb
        gl *= 1 - 0.25 * clamp((y - 240) / 90, 0, 1);
        let pool = 0;
        if (y >= 232 && y <= 250) pool = 0.9 * Math.exp(-(dx * dx) / (2 * 42 * 42));
        const k = gl + pool;
        r += 1.25 * k; gg += 0.8 * k; b += 0.42 * k;
      } else {
        const t = 1 - (x / W) * 0.35 - (y / H) * 0.25;
        r = 0.27 * t + 0.08; gg = 0.28 * t + 0.08; b = 0.42 * t + 0.11;
      }
      const fx = x - 93, fy = y - 50;
      const f = (on ? 0.4 : 0.62) * Math.exp(-((fx * fx) / (2 * 90 * 90) + (fy * fy) / (2 * 80 * 80)));
      r += 1.0 * f; gg += 0.7 * f; b += 0.4 * f;
      // vignette
      const vx = (x / W - 0.5) * 2, vy = (y / H - 0.45) * 2;
      const v = 1 - 0.18 * (vx * vx + vy * vy);
      const d = bay(x, y), i = (y * W + x) * 3;
      m[i] = (Math.floor(r * v * STEPS + d) / STEPS) * 256;
      m[i + 1] = (Math.floor(gg * v * STEPS + d) / STEPS) * 256;
      m[i + 2] = (Math.floor(b * v * STEPS + d) / STEPS) * 256;
    }
    return m;
  }
  const LIGHT_ON = buildLight(true), LIGHT_OFF = buildLight(false);
  const LIGHT_MIX = new Uint16Array(W * H * 3);

  /* ================= cat sprites =================
     Built from simple shapes into a colour grid, then auto-outlined. */
  const CATCOL = [null, "#fbf8f2", "#e4dbd1", "#f2a0aa", "#2a3a52", "#9a8a86"];
  const CAT_OUTLINE = "#5a4848";
  function catCanvas(pose, f) {
    const K = 1.4, w = Math.ceil(44 * K), h = Math.ceil(30 * K), G = new Uint8Array(w * h);
    const set = (x, y, v) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) G[y * w + x] = v; };
    const ell = (cx, cy, rx, ry, shadeFrom = 9) => {
      cx *= K; cy *= K; rx *= K; ry *= K;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, y > cy + ry * shadeFrom ? 2 : 1);
    };
    const box = (x, y, bw, bh) => {
      x = Math.round(x * K); y = Math.round(y * K); bw = Math.round(bw * K); bh = Math.round(bh * K);
      for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) set(x + i, y + j, j === bh - 1 ? 2 : 1);
    };
    const ear = (tx, ty, lean) => {
      tx *= K; ty *= K;
      for (let i = 0; i < 6; i++) for (let j = -Math.floor(i * 0.6); j <= Math.ceil(i * 0.6); j++) set(tx + j + lean * i * 0.4, ty + i, 1);
      set(tx + lean * 1.2, ty + 3, 3); set(tx + lean * 1.2, ty + 4, 3); set(tx + lean * 1.2 + lean, ty + 4, 3);
    };
    const tail = (x0, y0, x1, y1, x2, y2) => {
      [x0, y0, x1, y1, x2, y2] = [x0, y0, x1, y1, x2, y2].map((v) => v * K);
      for (let t = 0; t <= 1; t += 0.04) {
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2, y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
        ell(x / K, y / K, 1.3, 1.3);
      }
    };
    const face = (cx, cy, side, closed) => {
      cx = Math.round(cx * K); cy = Math.round(cy * K);
      const ex = side ? [cx - 2, cx + 3] : [cx - 4, cx + 4];
      ex.forEach((x) => {
        if (closed) { set(x - 1, cy + 1, 5); set(x, cy + 1, 5); set(x + 1, cy + 1, 5); }
        else { set(x, cy, 4); set(x, cy + 1, 4); set(x + 1, cy, 4); set(x + 1, cy + 1, 4); }
      });
      const nx = side ? cx + 2 : cx;
      set(nx, cy + 3, 3); set(nx + 1, cy + 3, 3);
      set(ex[0] - 2, cy + 3, 3); if (!side) set(ex[1] + 3, cy + 3, 3);
    };
    if (pose === "sit" || pose === "paw") {
      tail(14, 28, 3, 28, 4 + (f ? 1 : -1), 20);
      if (pose === "paw") { box(17, 23, 3, 6); } else { box(17, 23, 3, 6); box(22, 23, 3, 6); }
      ell(20, 21, 9, 7.5, 0.35);
      if (pose === "paw") { box(25, 15, 3, 6); ell(27, 14, 2, 2); }
      ell(21, 11, 7, 6); ear(16, 3, -1); ear(26, 3, 1);
      face(21, 11, false, false);
    } else if (pose === "walk") {
      tail(9, 16, 2, 13, 4, 4 + f);
      const legs = f ? [11, 14, 24, 27] : [8, 16, 22, 29];
      legs.forEach((x) => box(x, 21, 3, 8));
      ell(19, 18, 12, 6, 0.35);
      ell(31, 12, 6.5, 5.5); ear(27, 4, -1); ear(34, 4, 1);
      face(31, 12, true, false);
    } else if (pose === "crouch") {
      tail(7, 21, 1, 21, 1, 16 + f);
      [9, 13, 22, 26].forEach((x) => box(x, 23, 3, 6));
      ell(18, 21, 12, 5.5, 0.35);
      ell(31, 22 + f, 6, 5); ear(27, 15 + f, -1); ear(34, 15 + f, 1);
      face(31, 23 + f, true, false);
    } else if (pose === "sleep") {
      ell(24, 23, 14, 5.4 + f * 0.7, 0.3);
      tail(37, 25, 30, 30, 14, 28);
      ell(12, 23, 6, 5); ear(8, 16, -1); ear(15, 16, 1);
      face(12, 22, false, true);
    }
    const cv = document.createElement("canvas"); cv.width = w + 2; cv.height = h + 2;
    const c = cv.getContext("2d");
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      const v = x >= 0 && y >= 0 && x < w && y < h ? G[y * w + x] : 0;
      if (v) { px(c, x + 1, y + 1, CATCOL[v]); continue; }
      const nb = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && G[yy * w + xx];
      if (nb(x - 1, y) || nb(x + 1, y) || nb(x, y - 1) || nb(x, y + 1)) px(c, x + 1, y + 1, CAT_OUTLINE);
    }
    return cv;
  }
  const CAT = {
    walk: [catCanvas("walk", 0), catCanvas("walk", 1)],
    eat: [catCanvas("crouch", 0), catCanvas("crouch", 1)],
    sit: [catCanvas("sit", 0), catCanvas("paw", 0)],
    sleep: [catCanvas("sleep", 0), catCanvas("sleep", 1)]
  };
  const HEART = makeSprite([".H.H.", "HHHHH", "HHHHH", ".HHH.", "..H.."], { H: "#ff6f91" });
  const ARROW = makeSprite(["KKKKKKK", "KWWWWWK", ".KWWWK.", "..KWK..", "...K..."], { K: "#5a3a2a", W: "#fff4d6" });

  const cat = { x: 521, state: "sleep", timer: 12, dir: 1, target: 524, next: null, frame: 0, ft: 0, pet: 0, ball: 540 };
  const SPOTS = { sleep: { x: 521, dir: 1 }, drink: { x: 540, dir: 1 }, eat: { x: 557, dir: 1 }, play: { x: 496, dir: 1 } };

  function catPick() {
    const opts = ["sleep", "drink", "eat", "play"].filter((s) => s !== cat.state);
    const next = opts[Math.floor(Math.random() * opts.length)];
    cat.next = next;
    cat.target = SPOTS[next].x + (next === "play" ? Math.random() * 20 : 0);
    cat.state = "walk";
  }
  function updateCat(dt) {
    cat.ft += dt; cat.pet = Math.max(0, cat.pet - dt);
    if (cat.state === "walk") {
      const d = cat.target - cat.x;
      cat.dir = d > 0 ? 1 : -1;
      if (cat.ft > 0.18) { cat.ft = 0; cat.frame ^= 1; }
      cat.x += Math.sign(d) * Math.min(Math.abs(d), dt * 20);
      if (Math.abs(d) < 0.5) {
        cat.state = cat.next; cat.dir = SPOTS[cat.state].dir;
        cat.timer = cat.state === "sleep" ? 18 + Math.random() * 14 : 8 + Math.random() * 6;
        if (cat.state === "play") cat.ball = cat.x + 18;
      }
      return;
    }
    const rate = cat.state === "sleep" ? 1.2 : cat.state === "play" ? 0.35 : 0.3;
    if (cat.ft > rate) { cat.ft = 0; cat.frame ^= 1; }
    if (cat.state === "play") cat.ball = cat.x + 18 + Math.max(0, Math.sin(S.t * 2.2)) * 6;
    if (cat.pet <= 0) cat.timer -= dt;
    if (cat.timer <= 0) catPick();
    if (cat.state === "sleep" && Math.random() < dt * 0.7)
      S.particles.push({ kind: "z", x: cat.x - 16, y: CAT_Y - 24, vx: -3, vy: -6, life: 2.2, max: 2.2 });
  }
  function catSprite() {
    const st = cat.state;
    if (st === "walk") return CAT.walk[cat.frame];
    if (st === "eat" || st === "drink") return CAT.eat[cat.frame];
    if (st === "play") return CAT.sit[cat.frame];
    if (st === "sleep") return CAT.sleep[cat.frame];
    return CAT.sit[0];
  }
  function drawCat(c) {
    if (cat.state === "play") {
      // yarn
      ellipse(c, cat.ball, CAT_Y - 3, 3, 3, "#e86a8a");
      line(c, cat.ball - 2, CAT_Y - 4, cat.ball + 1, CAT_Y - 2, "#b8456a");
      line(c, cat.ball + 3, CAT_Y - 1, cat.ball + 9, CAT_Y, "#e86a8a");
    }
    const spr = catSprite();
    const bob = cat.state === "walk" && cat.frame ? -1 : 0;
    shade(c, Math.round(cat.x) - 20, CAT_Y - 1, 40, 2, "#000", 0.3);
    drawSprite(c, spr, cat.x - 31, CAT_Y - 43 + bob, cat.dir < 0);
  }
  function catBox() { return { x: cat.x - 28, y: CAT_Y - 40, w: 56, h: 41 }; }

  function petCat() {
    cat.pet = 2;
    for (let i = 0; i < 4; i++)
      S.particles.push({ kind: "heart", x: cat.x - 4 + Math.random() * 8, y: CAT_Y - 38, vx: (Math.random() - 0.5) * 8, vy: -12 - Math.random() * 8, life: 1.4 + i * 0.2, max: 1.6 });
    AE.sfx("purr");
    if (cat.state !== "sleep" && Math.random() < 0.5) setTimeout(() => AE.sfx("meow"), 600);
  }

  /* ================= records / turntable ================= */
  function sleeveBox(i) { return { x: sleeveX(i), y: SLEEVE_Y, w: SLEEVE, h: SLEEVE }; }

  function pickRecord(i) {
    const d = S.disc;
    if (d) {
      if (d.id === i && (d.phase === "play" || d.phase === "arm")) { returnDisc(); return; }
      if (d.id === i) return;
      S.queue = i;
      if (d.phase === "play" || d.phase === "arm") returnDisc();
      return;
    }
    S.disc = { id: i, phase: "out", t: 0 };
  }
  function returnDisc() {
    if (!S.disc) return;
    AE.stop(); hud(null);
    S.disc.phase = "armUp"; S.disc.t = 0;
  }
  function discPos(i, t) { // sleeve -> platter
    const sx = sleeveX(i) + SLEEVE / 2, sy = SLEEVE_Y - 2;
    const e = ease(t);
    return {
      x: lerp(sx, PLAT.x, e), y: lerp(sy, PLAT.y - 1, e) - Math.sin(Math.PI * t) * 34,
      rx: lerp(12, 26, e), ry: lerp(12, 6, e)
    };
  }
  function updateDisc(dt) {
    const d = S.disc; if (!d) { S.arm = Math.max(0, S.arm - dt * 2); return; }
    const spin = d.phase === "arm" || d.phase === "play" || d.phase === "armUp";
    if (spin) S.angle += dt * Math.PI * 2 * 0.55;
    switch (d.phase) {
      case "out": d.t += dt / 0.35; if (d.t >= 1) { d.phase = "fly"; d.t = 0; } break;
      case "fly": d.t += dt / 0.9; if (d.t >= 1) { d.phase = "arm"; d.t = 0; AE.sfx("thump"); } break;
      case "arm": S.arm = Math.min(1, S.arm + dt / 0.7);
        if (S.arm >= 1) { d.phase = "play"; AE.play(music[d.id]); hud(music[d.id]); } break;
      case "armUp": S.arm = Math.max(0, S.arm - dt / 0.45); if (S.arm <= 0) { d.phase = "back"; d.t = 1; } break;
      case "back": d.t -= dt / 0.75; if (d.t <= 0) { d.phase = "in"; d.t = 1; } break;
      case "in": d.t -= dt / 0.3; if (d.t <= 0) {
        S.disc = null;
        if (S.queue !== null) { const q = S.queue; S.queue = null; S.disc = { id: q, phase: "out", t: 0 }; }
      } break;
    }
  }
  function drawVinyl(c, x, y, rx, ry, m, spinning) {
    ellipse(c, x, y, rx, ry, m.vinyl);
    const dark = "rgba(0,0,0,0.28)";
    if (rx > 14) { ellipseRing(c, x, y, rx * 0.78, ry * 0.78, dark, 0.03); ellipseRing(c, x, y, rx * 0.55, ry * 0.55, dark, 0.04); }
    ellipse(c, x, y, Math.max(2, rx * 0.28), Math.max(1, ry * 0.3), m.cover.palette.c);
    px(c, x, y, "#111");
    if (spinning) {
      const a = S.angle;
      for (const k of [0, Math.PI]) {
        px(c, x + Math.cos(a + k) * rx * 0.68, y + Math.sin(a + k) * ry * 0.68, "rgba(255,255,255,0.55)");
        px(c, x + Math.cos(a + k + 0.15) * rx * 0.68, y + Math.sin(a + k + 0.15) * ry * 0.68, "rgba(255,255,255,0.35)");
      }
      px(c, x + Math.cos(a) * rx * 0.2, y + Math.sin(a) * ry * 0.2, "#fff");
    }
  }
  function drawSleeves(c) {
    music.forEach((m, i) => {
      const b = sleeveBox(i);
      const hov = S.hover && S.hover.kind === "music" && S.hover.i === i;
      const d = S.disc;
      // disc sliding in/out of its sleeve (behind the sleeve)
      if (d && d.id === i && (d.phase === "out" || d.phase === "in")) {
        const rise = ease(d.t) * 14;
        drawVinyl(c, b.x + SLEEVE / 2, b.y + 12 - rise, 12, 12, m, false);
      }
      const lift = hov ? 4 : 0;
      c.drawImage(m.art, b.x, b.y - lift);
      if (d && d.id === i && d.phase !== "out" && d.phase !== "in") { c.fillStyle = "rgba(20,10,5,0.5)"; c.fillRect(b.x, b.y - lift, SLEEVE, SLEEVE); }
    });
  }
  function drawTurntable(c) {
    const d = S.disc;
    if (d && (d.phase === "arm" || d.phase === "play" || d.phase === "armUp"))
      drawVinyl(c, PLAT.x, PLAT.y - 1, 26, 6, music[d.id], true);
    else ellipse(c, PLAT.x, PLAT.y - 1, 3, 1, "#a09a92");
    // tonearm (top-surface coords squashed vertically)
    const a0 = Math.atan2(18 + 20, 46 - 42), a1 = Math.atan2(10 + 20, 18 - 42);
    const a = lerp(a0, a1, ease(S.arm)), L = 38;
    const u = 42 + Math.cos(a) * L, v = -20 + Math.sin(a) * L;
    const tx = PLAT.x + u, ty = PLAT.y + v * 0.27;
    line(c, PIVOT.x, PIVOT.y, tx, ty, "#d8d2ca");
    line(c, PIVOT.x, PIVOT.y - 1, tx, ty - 1, "#a8a29a");
    rect(c, tx - 2, ty - 1, 3, 2, "#3a3432");
    // dust cover
    c.fillStyle = "rgba(255,250,240,0.16)";
    c.fillRect(252, 206, 94, 1); c.fillRect(252, 206, 1, 16); c.fillRect(345, 206, 1, 16);
    c.fillStyle = "rgba(255,250,240,0.06)"; c.fillRect(253, 207, 92, 15);
  }

  /* ================= lamp ================= */
  function drawLamp(c, on) {
    const { cx, cy } = LAMP;
    ellipse(c, cx, 242, 12, 2, on ? "#f3a520" : "#b06a1a");
    rect(c, cx - 3, cy, 7, 20, on ? "#ffb52e" : "#b8741e");
    rect(c, cx - 2, cy, 2, 20, on ? "#ffd56a" : "#cc8a2e");
    // dome
    for (let dy = -20; dy <= 0; dy++) {
      const hw = Math.round(25 * Math.sqrt(1 - (dy * dy) / 400));
      for (let dx = -hw; dx <= hw; dx++) {
        const l = (-dx - dy * 1.3) / 45;
        let col;
        if (on) col = l > 0.55 ? "#fff0a0" : bay(dx, dy) < l + 0.25 ? "#ffd04a" : "#ffb020";
        else col = l > 0.55 ? "#e0a040" : bay(dx, dy) < l + 0.25 ? "#c8822a" : "#a86520";
        px(c, cx + dx, cy + dy, col);
      }
    }
    ellipse(c, cx, cy + 1, 24, 2, on ? "#fff6c8" : "#7a4a18");
    if (on) { ellipse(c, cx, cy + 1, 10, 1, "#ffffff"); }
  }

  /* ================= coffee ================= */
  const DRINKS = {
    matcha: { name: "matcha latte", liquid: "#8db45a", top: "#c7dc98", stream: "#9cc066" },
    cappuccino: { name: "cappuccino", liquid: "#a8714a", top: "#f2dfc4", stream: "#7a4a2a", milk: true },
    coffee: { name: "coffee", liquid: "#3b2416", top: "#7a4a2a", stream: "#4a2c18" }
  };
  function brew(kind) {
    if (S.coffee) return;
    S.coffee = { kind, t: 0 };
    AE.sfx("brew");
  }
  function drawCup(c, x, y, drink, fill) {
    rect(c, x, y, 9, 7, "#f7f1e8"); rect(c, x, y + 6, 9, 1, "#d8cfc2");
    rect(c, x + 9, y + 1, 2, 1, "#f7f1e8"); rect(c, x + 10, y + 2, 1, 2, "#f7f1e8"); rect(c, x + 9, y + 4, 2, 1, "#f7f1e8");
    if (drink && fill > 0.6) { rect(c, x + 1, y, 7, 1, drink.top); if (drink.milk) px(c, x + 4, y, "#c89a70"); }
  }
  function updateCoffee(dt) {
    const co = S.coffee; if (!co) return;
    co.t += dt;
    const d = DRINKS[co.kind];
    if (co.t > 0.6 && co.t < 2.6 && Math.random() < dt * 10)
      S.particles.push({ kind: "steam", x: MACH.x - 2 + Math.random() * 2, y: MACH.y + 16, vx: -2, vy: -10, life: 1, max: 1 });
    if (co.t > 3.1) {
      S.served.push({ kind: co.kind });
      if (S.served.length > CUPS_X.length) S.served.shift();
      S.coffee = null;
      toast(`one ${d.name}, freshly made ♡`);
    }
  }
  function drawCoffee(c) {
    const co = S.coffee, m = MACH;
    const cupX = m.x + 25, cupY = m.y + 33;
    if (co) {
      const d = DRINKS[co.kind];
      const shake = co.t < 0.6 ? (Math.floor(co.t * 30) % 2) : 0;
      if (shake) rect(c, m.x + 22, m.y + 18, 16, 1, "#c9c3bb");
      if (co.t > 0.6 && co.t < 2.7) {
        const col = d.milk && co.t > 1.9 ? "#f2e8d8" : d.stream;
        rect(c, cupX + 4, m.y + 24, 1, cupY - m.y - 24, col);
        if (Math.floor(co.t * 12) % 2) px(c, cupX + 4, cupY - 1, "#fff");
      }
      drawCup(c, cupX, cupY, d, (co.t - 0.6) / 2);
    }
    S.served.forEach((s, i) => {
      const b = cupBox(i);
      const hov = S.hover && S.hover.kind === "cup" && S.hover.i === i;
      drawCup(c, b.x + 1, b.y + 2 - (hov ? 1 : 0), DRINKS[s.kind], 1);
      if (Math.random() < 0.04) S.particles.push({ kind: "steam", x: b.x + 4 + Math.random() * 3, y: b.y + 1, vx: 0, vy: -7, life: 1.1, max: 1.1 });
    });
  }
  function cupBox(i) { return { x: CUPS_X[i], y: 222, w: 12, h: 10 }; }

  /* ================= bulletin notes ================= */
  const NOTE_COLS = ["#fff3a8", "#ffc8d8", "#c8ecff", "#d6f5c4", "#ffd9a8"];
  function noteBox(i) {
    const col = i % 6, row = Math.floor(i / 6);
    const h = hash(S.notes[i] ? String(S.notes[i].id) : String(i));
    return { x: BOARD.x + 9 + col * 23 + (h % 3) - 1, y: BOARD.y + 24 + row * 27 + ((h >> 3) % 3) - 1, w: 18, h: 16 };
  }
  function drawNotes(c) {
    S.notes.slice(0, 18).forEach((n, i) => {
      const b = noteBox(i), h = hash(String(n.id));
      const hov = S.hover && S.hover.kind === "note" && S.hover.i === i;
      const y = b.y - (hov ? 1 : 0);
      shade(c, b.x + 1, y + 1, b.w, b.h, "#7a4e2e", 0.5);
      rect(c, b.x, y, b.w, b.h, NOTE_COLS[h % NOTE_COLS.length]);
      rect(c, b.x, y + b.h - 1, b.w, 1, "rgba(0,0,0,0.12)");
      const r = rng(h);
      for (let l = 0; l < 3; l++) rect(c, b.x + 3, y + 5 + l * 3, 4 + Math.floor(r() * 10), 1, "rgba(60,40,40,0.55)");
      px(c, b.x + 8, y + 1, "#d9473b"); px(c, b.x + 9, y + 1, "#b8332a"); px(c, b.x + 8, y + 2, "#8a2a22");
    });
  }

  /* ================= particles & emissive ================= */
  function updateParticles(dt) {
    S.particles = S.particles.filter((p) => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === "steam") p.vx += Math.sin(S.t * 4 + p.y) * dt * 6;
      return p.life > 0;
    });
  }
  function drawParticles(c) {
    S.particles.forEach((p) => {
      const a = p.life / p.max;
      if (p.kind === "steam") { c.globalAlpha = a * 0.6; px(c, p.x, p.y, "#fff8ee"); }
      else if (p.kind === "heart") { c.globalAlpha = Math.min(1, a * 2); drawSprite(c, HEART, p.x - 2, p.y); }
      else if (p.kind === "z") { c.globalAlpha = Math.min(1, a * 1.5); text(c, "Z", Math.round(p.x), Math.round(p.y), "#e8f0ff"); }
      c.globalAlpha = 1;
    });
  }

  function drawFairyLights(c) {
    const x0 = 14, x1 = 172;
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const y = 46 + Math.round(Math.sin(t * Math.PI * 2) ** 2 * 5);
      px(c, x, y, "#3a2a20");
      if ((x - x0) % 11 === 5) {
        const cols = ["#ffd27a", "#ff9f6a", "#fff0b0", "#ffb7c5"];
        const k = ((x - x0) / 11) | 0;
        const tw = 0.75 + 0.25 * Math.sin(S.t * 2 + k * 1.7);
        c.globalAlpha = 0.25 * tw; rect(c, x - 2, y, 5, 5, cols[k % 4]);
        c.globalAlpha = 1; rect(c, x - 1, y + 1, 3, 3, cols[k % 4]); px(c, x, y + 2, "#ffffff");
      }
    }
  }

  function drawEmissive(c) {
    if (S.lampT > 0.5) drawLamp(c, true);
    drawFairyLights(c);
    // LEDs
    px(c, 270, 239, S.disc && S.disc.phase === "play" ? "#7dff8a" : "#5a3030");
    px(c, MACH.x + 46, MACH.y + 8, S.coffee ? "#7dff8a" : "#ff6a4a");
    drawParticles(c);
    // hover arrow
    const h = S.hover;
    if (h && ["lamp", "machine", "board", "cat", "turntable"].includes(h.kind)) {
      const b = h.box(); const bob = Math.round(Math.sin(S.t * 5) * 1.5);
      drawSprite(c, ARROW, b.x + b.w / 2 - 3, b.y - 9 + bob);
    }
  }

  /* ================= hotspots ================= */
  const HOT = [];
  projects.forEach((p, i) => HOT.push({
    kind: "project", i, box: () => ({ x: COLS[i % 4], y: ROWS[Math.floor(i / 4)], w: COVER, h: COVER }),
    tip: () => `<b>${esc(p.title)}</b><span>${esc(p.subtitle || "")} · ${esc(p.year || "")}</span>`,
    click: () => openProject(p)
  }));
  for (let i = projects.length; i < Math.min(SITE.wallSlots, 8); i++) HOT.push({
    kind: "empty", i, box: () => ({ x: COLS[i % 4], y: ROWS[Math.floor(i / 4)], w: COVER, h: COVER }),
    tip: () => `<b>coming soon</b><span>a new record is on its way</span>`
  });
  music.forEach((m, i) => HOT.push({
    kind: "music", i, box: () => sleeveBox(i),
    tip: () => {
      const on = S.disc && S.disc.id === i;
      return `<b>♪ ${esc(m.title)}</b><span>${esc(m.artist)}</span><em>${on ? "click to put it back" : "click to play"}</em>`;
    },
    click: () => pickRecord(i)
  }));
  HOT.push({
    kind: "turntable", box: () => ({ x: 252, y: 206, w: 94, h: 38 }),
    tip: () => S.disc && S.disc.phase === "play"
      ? `<b>now spinning</b><span>${esc(music[S.disc.id].title)}</span><em>click to stop</em>`
      : `<b>record player</b><span>pick a record from the cabinet below ↓</span>`,
    click: () => { if (S.disc) returnDisc(); }
  });
  HOT.push({
    kind: "lamp", box: () => ({ x: LAMP.cx - 26, y: LAMP.cy - 21, w: 52, h: 46 }),
    tip: () => `<b>lamp</b><em>click to turn ${S.lamp ? "off" : "on"}</em>`,
    click: () => { S.lamp = !S.lamp; AE.sfx("click"); }
  });
  HOT.push({
    kind: "machine", box: () => ({ x: MACH.x - 4, y: MACH.y - 6, w: MACH.w + 4, h: MACH.h + 6 }),
    tip: () => S.coffee ? `<b>brewing…</b>` : `<b>coffee station</b><em>click to make a drink</em>`,
    click: () => { if (!S.coffee) openCoffeeMenu(); }
  });
  for (let i = 0; i < CUPS_X.length; i++) HOT.push({
    kind: "cup", i, active: () => !!S.served[i], box: () => cupBox(i),
    tip: () => `<b>your ${DRINKS[S.served[i].kind].name}</b><em>click to sip</em>`,
    click: () => {
      AE.sfx("sip");
      const b = cupBox(i);
      S.particles.push({ kind: "heart", x: b.x + 4, y: b.y - 4, vx: 0, vy: -10, life: 1.2, max: 1.2 });
      S.served.splice(i, 1);
      toast("ahh, perfect.");
    }
  });
  for (let i = 0; i < 18; i++) HOT.push({
    kind: "note", i, active: () => !!S.notes[i], box: () => noteBox(i),
    tip: () => { const n = S.notes[i]; return `<span class="topic">${esc(n.topic)}</span><b>“${esc(n.message)}”</b><span>— ${esc(n.name)}</span>`; },
    click: () => openNotes()
  });
  HOT.push({
    kind: "board", box: () => BOARD,
    tip: () => `<b>bulletin board</b><em>click to leave a note</em>`,
    click: () => openNotes()
  });
  HOT.push({
    kind: "cat", box: catBox,
    tip: () => `<b>${esc(SITE.catName)}</b><span>${{ sleep: "napping", drink: "having a drink", eat: "snack time", play: "playing with yarn", walk: "on the move" }[cat.state]}</span><em>click to pet</em>`,
    click: petCat
  });

  function hitTest(x, y) {
    const order = ["cat", "note", "cup", "music", "lamp", "turntable", "machine", "project", "empty", "board"];
    for (const k of order) for (const h of HOT) {
      if (h.kind !== k || (h.active && !h.active())) continue;
      const b = h.box();
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return h;
    }
    return null;
  }

  /* ================= frame ================= */
  function drawWall(c) {
    // record covers with lamp-cast shadows (up-left, fade with lamp)
    for (let i = 0; i < Math.min(SITE.wallSlots, 8); i++) {
      const x = COLS[i % 4], y = ROWS[Math.floor(i / 4)];
      const p = projects[i];
      const hov = S.hover && S.hover.i === i && (S.hover.kind === "project" || S.hover.kind === "empty");
      const lift = hov ? 3 : 0;
      if (p && S.lampT > 0.05) {
        const dx = Math.round((x + 30 - LAMP.cx) / 40), dy = -4;
        shade(c, x + dx, y + dy - lift, COVER, COVER, "#a87a56", 0.55 * S.lampT);
      }
      if (p) {
        c.drawImage(p.art, x, y - lift);
      } else {
        // empty slot: dashed outline
        for (let k = 0; k < COVER; k += 4) {
          rect(c, x + k, y + COVER - 1, 2, 1, "#9a6c4a");
          rect(c, x + k, y, 2, 1, "#9a6c4a");
          rect(c, x, y + k, 1, 2, "#9a6c4a");
          rect(c, x + COVER - 1, y + k, 1, 2, "#9a6c4a");
        }
        if (hov) shade(c, x + 1, y + 1, COVER - 2, COVER - 2, "#f7dcb8", 0.5);
        text(c, "COMING", x + 19, y + 24, "#9a6c4a");
        text(c, "SOON", x + 23, y + 31, "#9a6c4a");
      }
    }
  }

  function render() {
    g.drawImage(stat, 0, 0);
    drawWall(g);
    drawNotes(g);
    drawSleeves(g);
    drawTurntable(g);
    if (S.lampT <= 0.5) drawLamp(g, false);
    drawCoffee(g);
    drawCat(g);
    // flying disc on top
    const d = S.disc;
    if (d && (d.phase === "fly" || d.phase === "back")) {
      const p = discPos(d.id, d.t);
      drawVinyl(g, p.x, p.y, p.rx, p.ry, music[d.id], false);
    }

    // lighting pass
    const target = S.lamp ? 1 : 0;
    const img = g.getImageData(0, 0, W, H), D = img.data;
    let M;
    if (S.lampT === 1) M = LIGHT_ON;
    else if (S.lampT === 0) M = LIGHT_OFF;
    else {
      const t = ease(S.lampT), it = 1 - t;
      for (let i = 0; i < LIGHT_MIX.length; i++) LIGHT_MIX[i] = LIGHT_ON[i] * t + LIGHT_OFF[i] * it;
      M = LIGHT_MIX;
    }
    for (let p = 0, j = 0; p < D.length; p += 4, j += 3) {
      D[p] = (D[p] * M[j]) >> 8;
      D[p + 1] = (D[p + 1] * M[j + 1]) >> 8;
      D[p + 2] = (D[p + 2] * M[j + 2]) >> 8;
    }
    out.putImageData(img, 0, 0);
    drawEmissive(out);
    void target;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.t += dt;
    const target = S.lamp ? 1 : 0;
    if (S.lampT !== target) S.lampT = target > S.lampT ? Math.min(1, S.lampT + dt / 0.35) : Math.max(0, S.lampT - dt / 0.35);
    updateDisc(dt); updateCat(dt); updateCoffee(dt); updateParticles(dt);
    render();
    if (S.hover) placeTip(S.hover);
    requestAnimationFrame(loop);
  }

  /* ================= DOM: input, tooltip, modals ================= */
  const stage = document.getElementById("stage");
  const tipEl = document.getElementById("tooltip");
  const hudEl = document.getElementById("hud");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  let scale = 1;

  function esc(s) { return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let s = Math.min(vw / W, vh / H);
    if (vw < vh) s = Math.max(s, (vh * 0.7) / H); // phones: taller, scroll sideways
    if (s >= 2 && Math.floor(s) / s > 0.88) s = Math.floor(s);
    scale = s;
    stage.style.width = W * s + "px";
    stage.style.height = H * s + "px";
    const wrap = document.getElementById("stage-wrap");
    if (W * s > vw) wrap.scrollLeft = (W * s - vw) * 0.42;
  }
  window.addEventListener("resize", resize);

  function toScene(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  function placeTip(h) {
    const b = h.box();
    tipEl.style.left = (b.x + b.w / 2) * scale + "px";
    tipEl.style.top = (b.y - (h.kind === "project" ? 4 : 2)) * scale + "px";
  }
  function setHover(h) {
    if (h === S.hover) return;
    S.hover = h;
    canvas.style.cursor = h && h.click ? "pointer" : "default";
    if (h) { tipEl.innerHTML = h.tip(); tipEl.classList.add("show"); placeTip(h); }
    else tipEl.classList.remove("show");
  }
  canvas.addEventListener("pointermove", (e) => {
    const p = toScene(e); S.mouse = p;
    const h = hitTest(p.x, p.y);
    setHover(h);
    if (h) tipEl.innerHTML = h.tip();
  });
  canvas.addEventListener("pointerleave", () => setHover(null));
  canvas.addEventListener("click", (e) => {
    const p = toScene(e);
    const h = hitTest(p.x, p.y);
    if (!S.interacted) { S.interacted = true; hintEl.classList.add("gone"); }
    document.getElementById("coffee-menu").classList.remove("open");
    if (h && h.click) { h.click(); if (S.hover === h) tipEl.innerHTML = h.tip(); }
    else if (e.pointerType === "touch" && h) { setHover(h); }
  });

  function hud(m) {
    if (!m) { hudEl.classList.remove("show"); return; }
    hudEl.querySelector(".title").textContent = `${m.title} — ${m.artist}`;
    hudEl.classList.add("show");
  }
  hudEl.querySelector("button").addEventListener("click", () => returnDisc());

  let toastT = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  // modals
  function openModal(id) {
    const m = document.getElementById(id);
    m.classList.add("open"); m.setAttribute("aria-hidden", "false");
    const f = m.querySelector("[autofocus], textarea, button"); if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModals() {
    document.querySelectorAll(".modal.open").forEach((m) => { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); });
    document.getElementById("coffee-menu").classList.remove("open");
  }
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModals));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

  function openProject(p) {
    const box = document.getElementById("project-cover");
    box.innerHTML = ""; const big = coverArt(p.cover, 60); big.className = "cover-big"; box.appendChild(big);
    document.getElementById("project-title").textContent = p.title;
    document.getElementById("project-sub").textContent = [p.subtitle, p.year].filter(Boolean).join(" · ");
    document.getElementById("project-tags").innerHTML = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    document.getElementById("project-blurb").textContent = p.blurb || "";
    const link = document.getElementById("project-link");
    if (p.url) { link.href = p.url; link.classList.remove("disabled"); link.textContent = "open project →"; }
    else { link.removeAttribute("href"); link.classList.add("disabled"); link.textContent = "project page coming soon"; }
    openModal("project-modal");
  }

  function openCoffeeMenu() {
    const menu = document.getElementById("coffee-menu");
    menu.style.left = (MACH.x + MACH.w / 2) * scale + "px";
    menu.style.top = (MACH.y - 8) * scale + "px";
    menu.classList.add("open");
  }
  document.querySelectorAll("#coffee-menu [data-drink]").forEach((b) =>
    b.addEventListener("click", () => { document.getElementById("coffee-menu").classList.remove("open"); brew(b.dataset.drink); }));
  document.addEventListener("pointerdown", (e) => {
    const menu = document.getElementById("coffee-menu");
    if (menu.classList.contains("open") && !menu.contains(e.target) && e.target !== canvas) menu.classList.remove("open");
  });

  // notes
  const form = document.getElementById("note-form");
  const listEl = document.getElementById("note-list");
  function renderNoteList() {
    listEl.innerHTML = S.notes.map((n) =>
      `<li><span class="topic">${esc(n.topic)}</span><p>${esc(n.message)}</p><small>— ${esc(n.name)}</small></li>`).join("") ||
      "<li><p>no notes yet — be the first!</p></li>";
  }
  function openNotes() {
    renderNoteList();
    document.getElementById("note-shared").textContent = Notes.isShared()
      ? "notes are public — everyone who visits can read them."
      : "notes are saved in this browser for now.";
    openModal("note-modal");
  }
  async function refreshNotes() { S.notes = await Notes.list(40); renderNoteList(); }
  const msg = form.querySelector("textarea");
  const count = document.getElementById("note-count");
  msg.addEventListener("input", () => (count.textContent = `${msg.value.length}/140`));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await Notes.add({ name: data.get("name"), topic: data.get("topic"), message: data.get("message") });
      form.reset(); count.textContent = "0/140";
      await refreshNotes();
      AE.sfx("pin"); toast("pinned to the board ♡");
      closeModals();
    } catch (err) {
      toast(err.message === "empty note" ? "write something first :)" : "couldn't pin that — try again?");
    } finally { btn.disabled = false; }
  });

  // screen-reader / keyboard menu
  const nav = document.getElementById("a11y-nav");
  nav.innerHTML =
    "<h2>Projects</h2>" + projects.map((p, i) => `<button data-p="${i}">${esc(p.title)}</button>`).join("") +
    "<h2>Music</h2>" + music.map((m, i) => `<button data-m="${i}">Play ${esc(m.title)}</button>`).join("") +
    `<button data-a="lamp">Toggle lamp</button><button data-a="notes">Leave a note</button><button data-a="cat">Pet ${esc(SITE.catName)}</button>`;
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.p) openProject(projects[+b.dataset.p]);
    else if (b.dataset.m) pickRecord(+b.dataset.m);
    else if (b.dataset.a === "lamp") { S.lamp = !S.lamp; AE.sfx("click"); }
    else if (b.dataset.a === "notes") openNotes();
    else if (b.dataset.a === "cat") petCat();
  });

  /* ================= boot ================= */
  document.title = SITE.title;
  drawStatic(sg);
  resize();
  refreshNotes();
  requestAnimationFrame(loop);
  window.__room = S; S.cat = cat; // handy for debugging in the console
})();
