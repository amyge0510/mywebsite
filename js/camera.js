/* The instant camera: opens the webcam, snaps a square photo, runs it through
   the room's signature filter (warm, faded, a little light leak and grain) and
   prints it on an instant-photo frame styled like the site. */
window.InstantCamera = (() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let stream = null, busy = false;

  function setMsg(t) { const m = $("cam-msg"); m.textContent = t || ""; m.style.display = t ? "" : "none"; }

  async function start() {
    reset();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMsg("this browser can't open a camera — try Chrome, Safari or Firefox");
      return;
    }
    setMsg("starting the camera…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      const v = $("cam-video");
      v.srcObject = stream;
      await v.play().catch(() => {});
      setMsg("");
    } catch (e) {
      setMsg(e && e.name === "NotAllowedError"
        ? "allow camera access to take a photo (check the camera icon in your address bar)"
        : "no camera found on this device");
    }
  }
  function stop() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  function reset() {
    busy = false;
    document.querySelector(".cam-stage").classList.remove("printed", "developing");
    $("cam-snap").hidden = false; $("cam-save").hidden = true; $("cam-again").hidden = true;
  }

  // the signature look: warm highlights, lifted blacks, soft contrast, grain
  function develop(ctx, w, h) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const l = 0.3 * r + 0.59 * g + 0.11 * b;
      r = r + (l - r) * 0.12; g = g + (l - g) * 0.12; b = b + (l - b) * 0.12;   // a touch desaturated
      r = r * 1.05 + 14; g = g * 0.98 + 8; b = b * 0.84 + 12;                 // warm cast, lifted blacks
      r = (r - 128) * 0.94 + 128; g = (g - 128) * 0.94 + 128; b = (b - 128) * 0.94 + 128;
      const n = (Math.random() - 0.5) * 18;
      d[i] = r + n; d[i + 1] = g + n; d[i + 2] = b + n;
    }
    ctx.putImageData(img, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
    v.addColorStop(0, "rgba(255,255,255,1)"); v.addColorStop(1, "rgba(120,60,30,1)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";
    const leak = ctx.createLinearGradient(w, 0, w * 0.55, h * 0.45);
    leak.addColorStop(0, "rgba(255,120,40,.55)"); leak.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = leak; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // the print: cream card, the photo, and a caption in the site's label font
  function print(photo) {
    const W = 880, H = 1060, pad = 56, ps = W - pad * 2;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#f7f0e3"; g.fillRect(0, 0, W, H);
    const tex = g.getImageData(0, 0, W, H);
    for (let i = 0; i < tex.data.length; i += 4) { const n = (Math.random() - 0.5) * 10; tex.data[i] += n; tex.data[i + 1] += n; tex.data[i + 2] += n; }
    g.putImageData(tex, 0, 0);
    g.drawImage(photo, pad, pad, ps, ps);
    g.strokeStyle = "rgba(60,30,10,.25)"; g.lineWidth = 2; g.strokeRect(pad, pad, ps, ps);
    // caption
    const y = pad + ps + 92;
    g.fillStyle = "#d9622b";
    g.beginPath(); g.arc(pad + 26, y - 12, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1b1416"; g.beginPath(); g.arc(pad + 26, y - 12, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f2c46a"; g.beginPath(); g.arc(pad + 26, y - 12, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#3b2a20";
    g.font = '34px "Archivo Black", "Arial Black", sans-serif';
    if ("letterSpacing" in g) g.letterSpacing = "3px";
    g.fillText(((window.SITE && SITE.title) || "my little room").toUpperCase(), pad + 66, y);
    if ("letterSpacing" in g) g.letterSpacing = "0px";
    g.font = '40px Caveat, cursive';
    g.fillStyle = "#8a5a3a";
    const date = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toLowerCase();
    g.textAlign = "right"; g.fillText(date, W - pad, y + 2);
    return c.toDataURL("image/png");
  }

  function snap() {
    const v = $("cam-video");
    if (busy || !stream || !v.videoWidth) return;
    busy = true;
    const s = Math.min(v.videoWidth, v.videoHeight), S = 768;
    const c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d");
    g.translate(S, 0); g.scale(-1, 1); // selfie: mirror like the preview
    g.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, S, S);
    g.setTransform(1, 0, 0, 1, 0, 0);
    develop(g, S, S);
    const url = print(c);
    const f = $("cam-flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    window.AudioEngine && AudioEngine.sfx("click");
    const out = $("polaroid"); out.src = url;
    const stage = document.querySelector(".cam-stage");
    stage.classList.add("printed", "developing");
    setTimeout(() => stage.classList.remove("developing"), 60);
    $("cam-save").href = url;
    $("cam-snap").hidden = true; $("cam-save").hidden = false; $("cam-again").hidden = false;
  }

  function init() {
    $("cam-snap").addEventListener("click", snap);
    $("cam-again").addEventListener("click", () => { reset(); });
  }
  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  return { start, stop };
})();
