/* The cat: a flat-illustrated orange cat in a red scarf.
   Poses (all drawn with the ground at y=0, facing right):
     sit   – front-on, like the reference; yawns, meows, wags her tail
     sleep – curled up, breathing
     walk  – side-on; also used for drinking with her head lowered
   window.Cat.markup() returns the SVG; window.Cat.start(el, opts) runs her. */
window.Cat = (() => {
  "use strict";
  const O = "#f6ad66", O2 = "#e3924c", C = "#fdeedd", S = "#c8604a", S2 = "#9e4232", L = "#3a2418", P = "#d98a86";
  const line = (d, w = 1.8, col = L, op = 1) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;

  function head() {
    return `<g class="c-head">
      <g class="ear-l"><path d="M-72 -30 L-62 -100 L-20 -66 Z" fill="${O}"/><path d="M-63 -44 L-57 -88 L-31 -64 Z" fill="${P}"/></g>
      <g class="ear-r"><path d="M72 -30 L62 -100 L20 -66 Z" fill="${O}"/><path d="M63 -44 L57 -88 L31 -64 Z" fill="${P}"/></g>
      <path d="M-84 -6 C-88 -56 -50 -82 0 -82 C50 -82 88 -56 84 -6 C82 30 46 50 0 50 C-46 50 -82 30 -84 -6 Z" fill="${O}"/>
      <path d="M-10 -80 L-6 -96 L0 -86 L6 -100 L10 -80 Z" fill="${O}"/>
      <path d="M-84 -2 L-94 4 L-84 8 L-90 16 L-80 16 Z" fill="${O}"/><path d="M84 -2 L94 4 L84 8 L90 16 L80 16 Z" fill="${O}"/>
      <path d="M-72 12 C-50 -6 -20 6 0 2 C20 6 50 -6 72 12 C62 40 30 52 0 52 C-30 52 -62 40 -72 12 Z" fill="${C}"/>
      <g class="c-eyes">${line("M-54 -20 Q-38 -34 -22 -22", 3.6)}${line("M22 -22 Q38 -34 54 -20", 3.6)}</g>
      <path d="M-7 0 L7 0 L0 8 Z" fill="${P}" stroke="${P}" stroke-width="3" stroke-linejoin="round"/>
      <g class="c-mouth">${line("M0 9 V13 M-12 12 Q-6 19 0 13 Q6 19 12 12", 2)}</g>
      <g class="c-yawn" transform="translate(0 12) scale(0) translate(0 -12)">
        <ellipse cx="0" cy="20" rx="12" ry="13" fill="#6e2424"/><ellipse cx="0" cy="27" rx="7" ry="4.5" fill="#e07a7a"/>
      </g>
    </g>`;
  }

  function sit() {
    return `<g class="pose pose-sit">
      <ellipse cx="0" cy="0" rx="120" ry="10" fill="#000" opacity=".35"/>
      <g class="c-tail"><path d="M50 -26 C100 -16 132 -40 140 -84 L150 -86 L142 -96 C146 -120 140 -150 124 -172 L128 -186 L116 -180 L112 -192 L108 -178 C112 -160 112 -144 106 -128 C96 -96 80 -70 46 -58 Z" fill="${O}"/>
        ${line("M120 -150 Q126 -130 122 -112", 1.4)}${line("M132 -96 Q130 -78 120 -64", 1.4)}</g>
      <path d="M-74 -118 C-112 -86 -122 -24 -104 0 L104 0 C122 -24 112 -86 74 -118 Z" fill="${O}"/>
      <path d="M-66 -124 C-72 -96 -46 -72 -10 -60 L0 -52 L10 -60 C46 -72 72 -96 66 -124 Z" fill="${C}"/>
      ${line("M-92 -60 Q-98 -36 -96 -14", 1.4)}${line("M92 -60 Q98 -36 96 -14", 1.4)}${line("M-80 -24 Q-84 -10 -82 0", 1.2)}${line("M80 -24 Q84 -10 82 0", 1.2)}
      ${line("M-40 -64 C-44 -40 -44 -16 -40 0", 1.8)}${line("M-4 -56 C-2 -36 -2 -16 -4 0", 1.8)}${line("M4 -56 C2 -36 2 -16 4 0", 1.8)}${line("M40 -64 C44 -40 44 -16 40 0", 1.8)}
      <path d="M-42 0 C-42 -14 -2 -14 -2 0 Z" fill="${O}"/><path d="M2 0 C2 -14 42 -14 42 0 Z" fill="${O}"/>
      ${line("M-42 0 C-42 -14 -2 -14 -2 0", 1.8)}${line("M2 0 C2 -14 42 -14 42 0", 1.8)}${line("M-28 0 V-6 M-16 0 V-6 M16 0 V-6 M28 0 V-6", 1.4)}
      <g class="c-headwrap" transform="translate(0 -160)">${head()}</g>
      <path d="M-90 -122 C-60 -104 60 -104 90 -122 C98 -104 94 -82 84 -74 C44 -58 -44 -58 -84 -74 C-96 -84 -98 -106 -90 -122 Z" fill="${S}"/>
      ${line("M-82 -102 C-40 -88 40 -88 82 -102", 1.6, S2)}${line("M-72 -86 C-30 -76 30 -76 72 -88", 1.6, S2)}${line("M-50 -110 C-20 -98 10 -100 30 -104", 1.4, S2)}
      <path d="M28 -76 C32 -48 28 -26 34 -10 C44 -6 56 -10 60 -16 C54 -40 56 -62 54 -82 Z" fill="${S}"/>
      ${line("M40 -64 V-22 M48 -60 V-18", 1.4, S2)}
    </g>`;
  }

  function sleep() {
    return `<g class="pose pose-sleep">
      <ellipse cx="0" cy="0" rx="130" ry="10" fill="#000" opacity=".35"/>
      <g class="c-breathe">
        <path d="M-112 -6 C-124 -56 -80 -100 -10 -100 C60 -100 104 -74 108 -40 C110 -14 96 -2 80 0 L-100 0 C-108 -1 -112 -3 -112 -6 Z" fill="${O}"/>
        ${line("M-74 -10 C-84 -50 -54 -78 -18 -72", 1.5)}${line("M-20 -96 Q10 -92 34 -86", 1.3)}${line("M40 -80 Q56 -70 64 -58", 1.3)}
        <path d="M56 -10 C66 -30 94 -32 112 -14 C110 -4 98 2 82 2 L56 2 Z" fill="${C}"/>
        ${line("M70 2 V-4 M82 2 V-4 M94 2 V-4", 1.3)}
      </g>
      <path d="M-104 -12 C-96 12 0 14 62 4 C76 2 86 -4 90 -10" stroke="${O}" stroke-width="26" fill="none" stroke-linecap="round"/>
      ${line("M-60 4 Q-20 10 20 6", 1.3)}
      <g transform="translate(80 -52) rotate(12) scale(.74)">
        <path d="M-60 40 C-40 64 40 64 60 40 C64 56 56 74 40 80 C10 90 -10 90 -40 80 C-56 74 -64 56 -60 40 Z" fill="${S}"/>
        ${head()}
      </g>
    </g>`;
  }

  function walk() {
    const leg = (cls, x, far) => `<g class="c-leg ${cls}" transform="translate(${x} -72)"><g class="swing">
      <path d="M-12 0 C-13 26 -11 52 -11 66 C-11 73 11 73 11 66 C11 52 13 26 12 0 Z" fill="${far ? O2 : O}"/>
      ${line("M-6 71 V66 M0 72 V66 M6 71 V66", 1.2)}</g></g>`;
    return `<g class="pose pose-walk">
      <ellipse cx="10" cy="0" rx="130" ry="10" fill="#000" opacity=".35"/>
      <g class="c-bob">
        <g class="c-wtail"><path d="M-90 -96 C-130 -108 -152 -150 -140 -196 L-150 -206 L-136 -206 L-134 -218 L-124 -206 C-116 -200 -118 -186 -120 -176 C-126 -150 -112 -124 -84 -110 Z" fill="${O}"/>
          ${line("M-132 -170 Q-136 -150 -128 -134", 1.3)}</g>
        ${leg("lf1", -52, true)}${leg("lf2", 70, true)}
        <path d="M-96 -92 C-70 -116 50 -116 82 -104 C104 -96 112 -66 96 -50 C60 -36 -50 -36 -90 -50 C-110 -60 -110 -82 -96 -92 Z" fill="${O}"/>
        <path d="M70 -100 C100 -96 112 -70 100 -50 C90 -42 76 -42 66 -48 C76 -64 76 -86 70 -100 Z" fill="${C}"/>
        ${line("M-70 -104 Q-30 -112 20 -108", 1.3)}${line("M-92 -60 Q-80 -50 -60 -46", 1.3)}
        ${leg("ln1", -78, false)}${leg("ln2", 46, false)}
        <g class="c-whead" transform="translate(104 -126) scale(.78)">${head()}</g>
        <path d="M62 -108 C78 -126 112 -130 132 -110 C136 -96 130 -84 120 -80 C102 -92 80 -94 62 -84 C56 -94 56 -102 62 -108 Z" fill="${S}"/>
        ${line("M68 -100 C88 -112 110 -112 126 -100", 1.4, S2)}
        <path d="M82 -90 C84 -70 82 -56 86 -44 C94 -42 102 -44 104 -50 C100 -66 102 -80 100 -94 Z" fill="${S}"/>
      </g>
    </g>`;
  }

  function markup() {
    return `${sleep()}${sit()}${walk()}`;
  }

  /* ---------------- behaviour ---------------- */
  function start(el, opts) {
    const { bowl, xMin, xMax, yMin, yMax, scale, AE, onZ } = opts;
    const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
    const parts = {
      tail: q(".pose-sit .c-tail"), sitHead: q(".pose-sit .c-headwrap"), yawn: qa(".c-yawn"), mouth: qa(".c-mouth"),
      legs: ["lf1", "lf2", "ln1", "ln2"].map((k) => q(`.${k} .swing`)), bob: q(".c-bob"), wtail: q(".c-wtail"), whead: q(".c-whead"),
      breathe: q(".c-breathe"), ears: qa(".pose-sleep .ear-r")
    };
    const rand = (a, b) => a + Math.random() * (b - a);
    const cat = {
      mode: "sleep", x: rand(xMin + 200, xMax - 200), y: rand(yMin, yMax), dir: 1, timer: rand(25, 45),
      t: 0, phase: 0, target: null, next: null, yawnT: -1, meowT: -1, wag: 0, pet: 0
    };
    const lerp = (a, b, k) => a + (b - a) * k;

    function pose(name) { el.dataset.pose = name; }
    function mouthOpen(k) {
      parts.yawn.forEach((g) => g.setAttribute("transform", `translate(0 12) scale(${(0.8 + k * 0.2).toFixed(3)} ${k.toFixed(3)}) translate(0 -12)`));
      parts.mouth.forEach((g) => g.setAttribute("opacity", k > 0.15 ? 0 : 1));
    }
    function walkTo(x, y, then) {
      cat.target = { x, y }; cat.next = then;
      cat.dir = x >= cat.x ? 1 : -1;
      cat.mode = "walk"; pose("walk");
    }
    function goSleep() { cat.mode = "sleep"; cat.timer = rand(35, 70); pose("sleep"); }
    function goDrink() {
      cat.mode = "drink"; cat.timer = rand(8, 14); pose("walk");
      el.classList.add("drinking");
    }
    function wake() {
      cat.mode = "sit"; pose("sit"); cat.timer = rand(5, 8);
      cat.yawnT = 0; cat.wag = 1;
      if (Math.random() < 0.35) cat.meowT = 3.2;
    }
    function decide() {
      // after sitting a moment: usually wander off for a drink, otherwise find a new nap spot
      if (Math.random() < 0.55) {
        const side = cat.x < bowl.x ? -1 : 1;
        walkTo(bowl.x + side * 64 * scale / 0.5, bowl.y, () => { cat.dir = -side; goDrink(); });
      } else {
        walkTo(rand(xMin, xMax), rand(yMin, yMax), goSleep);
      }
    }

    function update(dt) {
      cat.t += dt;
      cat.pet = Math.max(0, cat.pet - dt);
      if (cat.mode === "sleep") {
        if (cat.pet <= 0) cat.timer -= dt;
        parts.breathe.setAttribute("transform", `translate(0 0) scale(1 ${(1 + Math.sin(cat.t * 1.6) * 0.025).toFixed(4)})`);
        if (Math.random() < dt * 0.35) onZ && onZ(cat.x + 30 * scale * cat.dir, cat.y - 70 * scale);
        if (cat.timer <= 0) wake();
      } else if (cat.mode === "sit") {
        cat.timer -= dt;
        cat.wag = Math.max(0.25, cat.wag - dt * 0.12);
        parts.tail.setAttribute("transform", `rotate(${(Math.sin(cat.t * 3.2) * 9 * cat.wag).toFixed(2)} 50 -26)`);
        let tilt = 0;
        if (cat.yawnT >= 0) {
          cat.yawnT += dt;
          const k = Math.max(0, Math.sin(Math.min(1, cat.yawnT / 2.4) * Math.PI));
          mouthOpen(k); tilt = -7 * k;
          if (cat.yawnT > 2.4) { cat.yawnT = -1; mouthOpen(0); }
        } else if (cat.meowT >= 0) {
          cat.meowT -= dt;
          if (cat.meowT <= 0 && cat.meowT > -dt * 1.5) AE && AE.sfx("meow");
          if (cat.meowT <= 0) {
            const k = Math.max(0, Math.sin(Math.min(1, -cat.meowT / 0.55) * Math.PI)) * 0.5;
            mouthOpen(k);
            if (cat.meowT < -0.55) { cat.meowT = -1; mouthOpen(0); }
          }
        }
        parts.sitHead.setAttribute("transform", `translate(0 -160) rotate(${(tilt + Math.sin(cat.t * 0.8) * 1.5).toFixed(2)})`);
        if (cat.timer <= 0 && cat.yawnT < 0 && cat.meowT < 0) decide();
      } else if (cat.mode === "walk") {
        const dx = cat.target.x - cat.x, dy = cat.target.y - cat.y, d = Math.hypot(dx, dy);
        const step = Math.min(d, dt * 62);
        if (d > 0.5) { cat.x += (dx / d) * step; cat.y += (dy / d) * step; }
        cat.phase += dt * 7;
        const s = Math.sin(cat.phase);
        [s, -s, -s, s].forEach((v, k) => parts.legs[k].setAttribute("transform", `rotate(${(v * 22).toFixed(1)})`));
        parts.bob.setAttribute("transform", `translate(0 ${(-Math.abs(Math.cos(cat.phase)) * 3).toFixed(1)})`);
        parts.wtail.setAttribute("transform", `rotate(${(Math.sin(cat.phase * 0.5) * 7).toFixed(1)} -90 -96)`);
        parts.whead.setAttribute("transform", `translate(104 ${(-126 + Math.sin(cat.phase * 2) * 1.5).toFixed(1)}) scale(.78)`);
        if (d <= 0.5) { parts.legs.forEach((l) => l.setAttribute("transform", "")); const f = cat.next; cat.next = null; f && f(); }
      } else if (cat.mode === "drink") {
        cat.timer -= dt;
        const lap = Math.max(0, Math.sin(cat.t * 9)) * 2.5;
        parts.whead.setAttribute("transform", `translate(122 ${(-74 + lap).toFixed(1)}) rotate(14) scale(.78)`);
        parts.bob.setAttribute("transform", "translate(0 6)");
        parts.wtail.setAttribute("transform", `rotate(${(Math.sin(cat.t * 1.2) * 5).toFixed(1)} -90 -96)`);
        if (cat.timer <= 0) {
          el.classList.remove("drinking");
          parts.bob.setAttribute("transform", "");
          walkTo(rand(xMin, xMax), rand(yMin, yMax), goSleep);
        }
      }
      el.setAttribute("transform", `translate(${cat.x.toFixed(1)} ${cat.y.toFixed(1)}) scale(${(scale * cat.dir).toFixed(3)} ${scale})`);
    }

    function pet() {
      cat.pet = 3;
      if (cat.mode === "sleep") {
        parts.ears.forEach((e) => { e.classList.remove("twitch"); void e.getBBox(); e.classList.add("twitch"); });
        AE && AE.sfx("purr");
      } else if (cat.mode === "sit") {
        cat.meowT = 0.01; cat.timer = Math.max(cat.timer, 3);
      } else {
        AE && AE.sfx("meow");
      }
    }
    const says = () => ({ sleep: "napping", sit: "just woke up", walk: "wandering", drink: "having a drink" }[cat.mode]);

    pose("sleep");
    update(0);
    return { update, pet, says, state: cat };
  }

  return { markup, start };
})();
