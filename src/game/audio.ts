// All sounds are synthesized with the Web Audio API for now, so the world has
// a voice before any real recordings exist. Swap in recorded samples later.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function initAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  startRain();
}

export function setMuted(muted: boolean) {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.1);
}

function noiseBuffer(c: AudioContext, seconds: number, brown = false) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buf;
}

// Rain: filtered noise that gets louder upstairs, near the windows.
let rainGain: GainNode | null = null;
function startRain() {
  if (!ctx || !master) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 4);
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 0.4;
  rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  src.connect(bp).connect(rainGain).connect(master);
  src.start();
}

export function setRainLevel(level: number) {
  if (!ctx || !rainGain) return;
  rainGain.gain.setTargetAtTime(level * 0.05, ctx.currentTime, 0.4);
}

// A purr voice per cat. Volume is driven by distance from the player.
export function createPurr() {
  if (!ctx || !master) return null;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 3, true);
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 260;
  const tremolo = ctx.createGain();
  tremolo.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 26;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.5;
  lfo.connect(lfoDepth).connect(tremolo.gain);
  const out = ctx.createGain();
  out.gain.value = 0;
  src.connect(lp).connect(tremolo).connect(out).connect(master);
  src.start();
  lfo.start();
  const c = ctx;
  return {
    setLevel(level: number) {
      out.gain.setTargetAtTime(level, c.currentTime, 0.15);
    },
    stop() {
      src.stop();
      lfo.stop();
      out.disconnect();
    },
  };
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playDoorBell() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(1318, t, 1.2, 0.12);
  tone(1760, t + 0.12, 1.4, 0.1);
}

export function playBlip() {
  if (!ctx) return;
  tone(660, ctx.currentTime, 0.12, 0.06, "square");
}

export function playChime() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.8, 0.07, "triangle"));
}

export function playHoot() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  for (const [start, len] of [[0, 0.25], [0.35, 0.5]] as const) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(420, t + start);
    osc.frequency.linearRampToValueAtTime(360, t + start + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(0.12, t + start + 0.05);
    g.gain.linearRampToValueAtTime(0, t + start + len);
    osc.connect(g).connect(master);
    osc.start(t + start);
    osc.stop(t + start + len + 0.05);
  }
}

export function playMeow() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.linearRampToValueAtTime(900, t + 0.15);
  osc.frequency.linearRampToValueAtTime(500, t + 0.45);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.05);
  g.gain.linearRampToValueAtTime(0, t + 0.5);
  osc.connect(lp).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.55);
}
