/* Audio: plays a track's audio file if it has one, otherwise a
   procedurally generated lo-fi loop. Also small sound effects. */
window.AudioEngine = (() => {
  let ctx = null, out = null, noiseBuf = null, crackleBuf = null;
  let bus = null, timer = null, media = null, nodes = [];

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 5200;
      const comp = ctx.createDynamicsCompressor();
      out = ctx.createGain(); out.gain.value = 0.8;
      out.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
      noiseBuf = buffer(2, () => Math.random() * 2 - 1);
      crackleBuf = buffer(3, () =>
        (Math.random() < 0.0007 ? (Math.random() * 2 - 1) * 0.8 : 0) + (Math.random() * 2 - 1) * 0.01);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function buffer(sec, fn) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = fn(i);
    return b;
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function env(gainNode, t, a, peak, d, sustain, end, r) {
    const p = gainNode.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.linearRampToValueAtTime(sustain, t + a + d);
    p.setValueAtTime(sustain, end);
    p.linearRampToValueAtTime(0.0001, end + r);
  }

  function noise(t, dur, type, freq, q, vol, dest) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gn); gn.connect(dest);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  /* ---------------- synth track ---------------- */
  const DEFAULT_SYNTH = { bpm: 76, seed: 3, lead: "triangle", density: 0.45,
    chords: [[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]], scale: [72,74,76,79,81,84] };
  function startSynth(track) {
    const sp = track.synth || { ...DEFAULT_SYNTH, seed: (track.id || "x").length * 7 };
    const s = { sp, step: 0, next: ctx.currentTime + 0.15 };
    const beat = 60 / sp.bpm;

    // echo for the lead
    const dl = ctx.createDelay(2); dl.delayTime.value = beat * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.3;
    const wet = ctx.createGain(); wet.gain.value = 0.28;
    dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(bus);
    s.fx = dl;

    // tape wobble
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.45;
    const lfoG = ctx.createGain(); lfoG.gain.value = 9;
    lfo.connect(lfoG); lfo.start();
    s.wobble = lfoG; nodes.push(lfo);

    // pad filter
    const padF = ctx.createBiquadFilter(); padF.type = "lowpass"; padF.frequency.value = 1100;
    padF.connect(bus); s.padF = padF;

    const makePhrase = (n) => {
      const r = rng(sp.seed * 97 + n * 13);
      const ph = [];
      for (let i = 0; i < 32; i++)
        ph.push(i % 2 === 0 && r() < sp.density ? sp.scale[Math.floor(r() * sp.scale.length)] : 0);
      return ph;
    };
    s.phrases = [makePhrase(0), makePhrase(1)];

    if (track.rain) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 0.4;
      const gn = ctx.createGain(); gn.gain.value = 0.05;
      src.connect(f); f.connect(gn); gn.connect(bus); src.start();
      nodes.push(src);
    }

    timer = setInterval(() => {
      const spb = beat / 4;
      while (s.next < ctx.currentTime + 0.2) {
        step(s, s.step, s.next, spb);
        s.step++; s.next += spb;
      }
    }, 25);
  }

  function step(s, n, t, spb) {
    const sp = s.sp, st = n % 16, bar = Math.floor(n / 16);
    const chord = sp.chords[bar % sp.chords.length];
    const swing = st % 2 === 1 ? spb * 0.2 : 0;
    const tt = t + swing;

    if (st === 0) { // pad
      chord.forEach((m, i) => {
        ["triangle", "sine"].forEach((type, k) => {
          const o = ctx.createOscillator(); o.type = type;
          o.frequency.value = mtof(m + (k ? 12 : 0));
          o.detune.value = (i - 1.5) * 3;
          s.wobble.connect(o.detune);
          const gn = ctx.createGain();
          env(gn, t, 0.5, k ? 0.018 : 0.04, 0.6, k ? 0.012 : 0.03, t + spb * 15, 0.6);
          o.connect(gn); gn.connect(s.padF);
          o.start(t); o.stop(t + spb * 16 + 0.8);
        });
      });
    }
    if (st === 0 || st === 10) { // bass
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.value = mtof(chord[0] - 12);
      const gn = ctx.createGain();
      const len = st === 0 ? spb * 8 : spb * 5;
      env(gn, t, 0.02, 0.26, 0.3, 0.14, t + len, 0.15);
      o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + len + 0.2);
    }
    // drums
    if (st === 0 || st === 10 || (st === 7 && bar % 2 === 1)) {
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(115, tt);
      o.frequency.exponentialRampToValueAtTime(42, tt + 0.13);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.5, tt);
      gn.gain.exponentialRampToValueAtTime(0.0001, tt + 0.28);
      o.connect(gn); gn.connect(bus); o.start(tt); o.stop(tt + 0.3);
    }
    if (st === 4 || st === 12) noise(tt, 0.16, "bandpass", 1700, 0.8, 0.12, bus);
    if (st % 2 === 0) noise(tt, 0.045, "highpass", 7000, 0.5, st % 4 === 0 ? 0.035 : 0.02, bus);
    else if (Math.random() < 0.25) noise(tt, 0.03, "highpass", 8000, 0.5, 0.012, bus);

    // lead
    const phrase = s.phrases[Math.floor(bar / 2) % 2];
    const m = phrase[n % 32];
    if (m && bar % 8 < 7) {
      const o = ctx.createOscillator(); o.type = sp.lead;
      o.frequency.value = mtof(m);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = sp.lead === "square" ? 1500 : 2400;
      const gn = ctx.createGain();
      const vol = sp.lead === "square" ? 0.035 : 0.07;
      env(gn, tt, 0.01, vol, 0.12, vol * 0.4, tt + spb * 1.5, 0.25);
      o.connect(f); f.connect(gn); gn.connect(bus); gn.connect(s.fx);
      o.start(tt); o.stop(tt + spb * 2 + 0.4);
    }
  }

  function play(track) {
    stop();
    if (!init()) return;
    bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    bus.connect(out);

    const cr = ctx.createBufferSource(); cr.buffer = crackleBuf; cr.loop = true;
    const crg = ctx.createGain(); crg.gain.value = 0.55;
    cr.connect(crg); crg.connect(bus); cr.start(); nodes.push(cr);

    if (track.src) {
      let fell = false;
      const fallback = () => { if (fell) return; fell = true; media = null; startSynth(track); };
      media = new Audio(track.src);
      media.loop = true;
      media.addEventListener("error", fallback);
      try { ctx.createMediaElementSource(media).connect(bus); } catch (e) { /* plays directly */ }
      media.play().catch(fallback);
    } else {
      startSynth(track);
    }
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (media) { media.pause(); media = null; }
    if (bus && ctx) {
      const b = bus, ns = nodes;
      b.gain.cancelScheduledValues(ctx.currentTime);
      b.gain.setValueAtTime(b.gain.value, ctx.currentTime);
      b.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => { ns.forEach((n) => { try { n.stop(); } catch (e) {} }); b.disconnect(); }, 600);
    }
    bus = null; nodes = [];
  }

  /* ---------------- sound effects ---------------- */
  function sfx(name) {
    if (!init()) return;
    const t = ctx.currentTime;
    const o = () => ctx.createOscillator(), gn = () => ctx.createGain();
    if (name === "click") {
      noise(t, 0.03, "highpass", 2500, 0.7, 0.25, out);
    } else if (name === "thump") {
      const a = o(), g1 = gn();
      a.frequency.setValueAtTime(90, t); a.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g1.gain.setValueAtTime(0.4, t); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      a.connect(g1); g1.connect(out); a.start(t); a.stop(t + 0.25);
    } else if (name === "rip") {
      // paper tearing along a perforation: a quick run of crackly noise bursts
      for (let i = 0; i < 14; i++) noise(t + i * 0.018, 0.03, "bandpass", 2400 + Math.random() * 2400, 1.2, 0.08 + Math.random() * 0.06, out);
      noise(t, 0.28, "highpass", 3000, 0.6, 0.05, out);
    } else if (name === "whoosh") {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 0.8;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.35); f.frequency.exponentialRampToValueAtTime(600, t + 0.8);
      const g1 = gn(); g1.gain.setValueAtTime(0.0001, t); g1.gain.linearRampToValueAtTime(0.14, t + 0.3); g1.gain.linearRampToValueAtTime(0.0001, t + 0.85);
      src.connect(f); f.connect(g1); g1.connect(out); src.start(t); src.stop(t + 0.9);
    } else if (name === "lumos") {
      // a rising shimmer of soft bells
      [1046, 1318, 1568, 2093, 2637, 3136].forEach((fq, i) => {
        const a = o(), g1 = gn(), tt = t + i * 0.07;
        a.type = "sine"; a.frequency.value = fq;
        g1.gain.setValueAtTime(0.0001, tt); g1.gain.linearRampToValueAtTime(0.07, tt + 0.02); g1.gain.exponentialRampToValueAtTime(0.0001, tt + 1.2);
        a.connect(g1); g1.connect(out); a.start(tt); a.stop(tt + 1.3);
      });
    } else if (name === "pin") {
      [1320, 1760].forEach((f, i) => {
        const a = o(), g1 = gn(); a.type = "sine"; a.frequency.value = f;
        g1.gain.setValueAtTime(0.12, t + i * 0.08); g1.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.3);
        a.connect(g1); g1.connect(out); a.start(t + i * 0.08); a.stop(t + i * 0.08 + 0.35);
      });
    } else if (name === "brew") {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.9;
      const g1 = gn();
      g1.gain.setValueAtTime(0.0001, t);
      g1.gain.linearRampToValueAtTime(0.09, t + 0.6);
      g1.gain.setValueAtTime(0.09, t + 2.2);
      g1.gain.linearRampToValueAtTime(0.0001, t + 2.8);
      src.connect(f); f.connect(g1); g1.connect(out); src.start(t); src.stop(t + 3);
      for (let i = 0; i < 9; i++) { // gurgles
        const a = o(), g2 = gn(), tt = t + 0.7 + i * 0.22 + Math.random() * 0.1;
        a.frequency.setValueAtTime(120 + Math.random() * 120, tt);
        a.frequency.exponentialRampToValueAtTime(60, tt + 0.08);
        g2.gain.setValueAtTime(0.06, tt); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1);
        a.connect(g2); g2.connect(out); a.start(tt); a.stop(tt + 0.12);
      }
    } else if (name === "rustle") {
      // a soft fabric-and-beans shuffle: overlapping, gently swelling swishes
      for (let i = 0; i < 4; i++) {
        const tt = t + i * 0.11 + Math.random() * 0.05, len = 0.28 + Math.random() * 0.18;
        const src = ctx.createBufferSource(); src.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 220;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.3;
        lp.frequency.setValueAtTime(700 + Math.random() * 300, tt);
        lp.frequency.linearRampToValueAtTime(1300 + Math.random() * 500, tt + len * 0.5);
        lp.frequency.linearRampToValueAtTime(600, tt + len);
        const g1 = gn(), peak = 0.05 + Math.random() * 0.03;
        g1.gain.setValueAtTime(0.0001, tt);
        g1.gain.linearRampToValueAtTime(peak, tt + len * 0.35);
        g1.gain.linearRampToValueAtTime(0.0001, tt + len);
        src.connect(hp); hp.connect(lp); lp.connect(g1); g1.connect(out);
        src.start(tt, Math.random()); src.stop(tt + len + 0.05);
      }
    } else if (name === "latch") {
      noise(t, 0.04, "bandpass", 1600, 1, 0.12, out);
      const a = o(), g1 = gn();
      a.frequency.setValueAtTime(140, t + 0.05); a.frequency.exponentialRampToValueAtTime(70, t + 0.2);
      g1.gain.setValueAtTime(0.18, t + 0.05); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      a.connect(g1); g1.connect(out); a.start(t + 0.05); a.stop(t + 0.3);
    } else if (name === "sip") {
      noise(t, 0.12, "bandpass", 900, 2, 0.12, out);
      noise(t + 0.18, 0.12, "bandpass", 700, 2, 0.1, out);
    } else if (name === "purr") {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 260;
      const am = gn(); am.gain.value = 0.5;
      const l = o(); l.frequency.value = 24; const lg = gn(); lg.gain.value = 0.5;
      l.connect(lg); lg.connect(am.gain);
      const g1 = gn();
      g1.gain.setValueAtTime(0.0001, t); g1.gain.linearRampToValueAtTime(0.9, t + 0.2);
      g1.gain.setValueAtTime(0.9, t + 1.3); g1.gain.linearRampToValueAtTime(0.0001, t + 1.8);
      src.connect(f); f.connect(am); am.connect(g1); g1.connect(out);
      src.start(t); l.start(t); src.stop(t + 1.9); l.stop(t + 1.9);
    } else if (name === "meow") {
      const a = o(); a.type = "sawtooth";
      a.frequency.setValueAtTime(520, t);
      a.frequency.linearRampToValueAtTime(820, t + 0.15);
      a.frequency.linearRampToValueAtTime(480, t + 0.5);
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 3;
      f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.15);
      f.frequency.linearRampToValueAtTime(800, t + 0.5);
      const g1 = gn();
      g1.gain.setValueAtTime(0.0001, t); g1.gain.linearRampToValueAtTime(0.25, t + 0.05);
      g1.gain.linearRampToValueAtTime(0.0001, t + 0.55);
      a.connect(f); f.connect(g1); g1.connect(out); a.start(t); a.stop(t + 0.6);
    }
  }

  return { play, stop, sfx };
})();
