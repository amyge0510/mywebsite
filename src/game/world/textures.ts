import * as THREE from "three";

// Procedural pixel-art textures, painted onto tiny canvases and shown with
// nearest-neighbour filtering so they stay crisp. They stand in for hand-made
// textures until real art exists; swap any of them for an image later.

type Painter = (g: CanvasRenderingContext2D, size: number, rand: () => number) => void;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

const painters: Record<string, { size: number; paint: Painter }> = {
  woodFloor: {
    size: 32,
    paint(g, n, r) {
      const base = ["#6b4126", "#74482a", "#5f3a22", "#7a4e2e"];
      for (let row = 0; row < 4; row++) {
        const y = row * 8;
        const offset = row % 2 ? 12 : 0;
        for (let x = -16; x < n; x += 24) {
          g.fillStyle = base[Math.floor(r() * base.length)];
          g.fillRect(x + offset, y, 24, 8);
          g.fillStyle = "#3e2414";
          g.fillRect(x + offset, y, 1, 8);
        }
        g.fillStyle = "#3e2414";
        g.fillRect(0, y + 7, n, 1);
        for (let i = 0; i < 6; i++) {
          g.fillStyle = "rgba(255,220,170,0.08)";
          g.fillRect(Math.floor(r() * n), y + 1 + Math.floor(r() * 5), 3 + Math.floor(r() * 5), 1);
        }
      }
    },
  },
  darkWood: {
    size: 16,
    paint(g, n, r) {
      g.fillStyle = "#4a2c1c";
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = r() > 0.5 ? "#3b2216" : "#573522";
        g.fillRect(0, Math.floor(r() * n), n, 1);
      }
    },
  },
  brick: {
    size: 32,
    paint(g, n, r) {
      g.fillStyle = "#5a3a33";
      g.fillRect(0, 0, n, n);
      const tones = ["#8e4a36", "#9b5440", "#7f4030", "#a35c45"];
      for (let row = 0; row < 8; row++) {
        const off = row % 2 ? 4 : 0;
        for (let x = -8; x < n; x += 8) {
          g.fillStyle = tones[Math.floor(r() * tones.length)];
          g.fillRect(x + off, row * 4, 7, 3);
          g.fillStyle = "rgba(0,0,0,0.12)";
          g.fillRect(x + off, row * 4 + 2, 7, 1);
        }
      }
    },
  },
  cobble: {
    size: 32,
    paint(g, n, r) {
      g.fillStyle = "#2b2b36";
      g.fillRect(0, 0, n, n);
      const tones = ["#4b4c5c", "#545566", "#43444f", "#5d5e70"];
      for (let row = 0; row < 6; row++) {
        const off = row % 2 ? 3 : 0;
        for (let x = -6; x < n; x += 6) {
          g.fillStyle = tones[Math.floor(r() * tones.length)];
          g.fillRect(x + off, row * 6 - 1, 5, 5);
          g.fillStyle = "rgba(255,255,255,0.07)";
          g.fillRect(x + off, row * 6 - 1, 5, 1);
        }
      }
    },
  },
  plaster: {
    size: 32,
    paint(g, n, r) {
      g.fillStyle = "#cdb79a";
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 80; i++) {
        g.fillStyle = r() > 0.5 ? "#c4ad8f" : "#d6c2a6";
        g.fillRect(Math.floor(r() * n), Math.floor(r() * n), 1, 1);
      }
      // wainscot band at the bottom of every tile reads as panelling
      g.fillStyle = "#6b4630";
      g.fillRect(0, n - 9, n, 9);
      g.fillStyle = "#4e3222";
      g.fillRect(0, n - 9, n, 1);
      for (let x = 0; x < n; x += 8) g.fillRect(x, n - 8, 1, 8);
    },
  },
  wallpaper: {
    size: 16,
    paint(g, n) {
      g.fillStyle = "#4a3566";
      g.fillRect(0, 0, n, n);
      g.fillStyle = "#553d75";
      g.fillRect(0, 0, 4, n);
      g.fillRect(8, 0, 1, n);
      g.fillStyle = "#6b5091";
      g.fillRect(12, 3, 1, 1);
      g.fillRect(12, 11, 1, 1);
    },
  },
  beams: {
    size: 32,
    paint(g, n) {
      g.fillStyle = "#3a2418";
      g.fillRect(0, 0, n, n);
      g.fillStyle = "#523222";
      g.fillRect(0, 2, n, 10);
      g.fillRect(0, 18, n, 10);
      g.fillStyle = "#2c1a10";
      g.fillRect(0, 12, n, 1);
      g.fillRect(0, 28, n, 1);
    },
  },
  rug: {
    size: 32,
    paint(g, n, r) {
      g.fillStyle = "#6e2b4a";
      g.fillRect(0, 0, n, n);
      g.fillStyle = "#c48a4a";
      g.strokeStyle = "#c48a4a";
      g.fillRect(2, 2, n - 4, 1);
      g.fillRect(2, n - 3, n - 4, 1);
      g.fillRect(2, 2, 1, n - 4);
      g.fillRect(n - 3, 2, 1, n - 4);
      g.fillStyle = "#3d1a3a";
      for (let i = 0; i < 4; i++) {
        const c = 6 + i * 5;
        g.fillRect(c, n / 2 - 1, 3, 3);
      }
      for (let i = 0; i < 40; i++) {
        g.fillStyle = "rgba(0,0,0,0.1)";
        g.fillRect(Math.floor(r() * n), Math.floor(r() * n), 1, 1);
      }
    },
  },
  cork: {
    size: 32,
    paint(g, n, r) {
      g.fillStyle = "#b07d4c";
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 160; i++) {
        g.fillStyle = r() > 0.5 ? "#9c6b3e" : "#c28e5a";
        g.fillRect(Math.floor(r() * n), Math.floor(r() * n), 1, 1);
      }
    },
  },
  spine: {
    size: 8,
    paint(g, n) {
      g.fillStyle = "#e6e0d6";
      g.fillRect(0, 0, n, n);
      g.fillStyle = "#b3aa9c";
      g.fillRect(0, 1, n, 1);
      g.fillRect(0, n - 2, n, 1);
      g.fillStyle = "#f6f0e2";
      g.fillRect(2, 3, n - 4, 2);
    },
  },
  awning: {
    size: 16,
    paint(g, n) {
      g.fillStyle = "#1f4a3a";
      g.fillRect(0, 0, n, n);
      g.fillStyle = "#2b5e4a";
      g.fillRect(0, 0, n / 2, n);
    },
  },
};

const baseCache = new Map<string, THREE.CanvasTexture>();
const repeatCache = new Map<string, THREE.Texture>();

function base(name: keyof typeof painters) {
  let t = baseCache.get(name);
  if (t) return t;
  const { size, paint } = painters[name];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  paint(g, size, seeded(name.length * 997 + size));
  t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapNearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  baseCache.set(name, t);
  return t;
}

export type TextureName = keyof typeof painters;

/** A pixel texture tiled `rx` × `ry` times across a face. */
export function tex(name: TextureName, rx = 1, ry = 1) {
  const key = `${name}:${rx.toFixed(2)}:${ry.toFixed(2)}`;
  let t = repeatCache.get(key);
  if (t) return t;
  t = base(name).clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  repeatCache.set(key, t);
  return t;
}

/** Turn an ASCII pixel map into a sprite texture. `.` is transparent. */
export function spriteTexture(rows: string[], palette: Record<string, string>) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    });
  });
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, width: w, height: h };
}

/** A sign / label painted with the pixel font, redrawn once fonts load. */
export function textTexture(
  text: string,
  opts: { width: number; height: number; color: string; bg?: string; font?: string },
) {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const g = canvas.getContext("2d")!;
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (opts.bg) {
      g.fillStyle = opts.bg;
      g.fillRect(0, 0, canvas.width, canvas.height);
    }
    g.fillStyle = opts.color;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = opts.font ?? `${Math.floor(opts.height * 0.6)}px "Pixelify Sans", monospace`;
    g.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
    t.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return t;
}

export { shade };
