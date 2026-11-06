/* Plays a record's Spotify track in a small embedded Spotify player, using
   Spotify's iFrame API. Loaded on first use. */
window.SpotifyPlayer = (() => {
  "use strict";
  let ctrl = null, loading = null, want = null;
  const uri = (id) => `spotify:track:${id}`;

  function load() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      window.onSpotifyIframeApiReady = (api) => resolve(api);
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      s.onerror = () => reject(new Error("spotify unavailable"));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error("spotify timeout")), 12000);
    });
    return loading;
  }
  // start loading early (e.g. when a record is picked) so playback is instant
  function warm() { load().catch(() => {}); }

  async function play(id) {
    want = id;
    const api = await load();
    if (!ctrl) {
      const host = document.getElementById("spotify-embed");
      host.innerHTML = "<div></div>";
      await new Promise((res) => api.createController(host.firstChild, { uri: uri(id), width: "100%", height: 80 }, (c) => { ctrl = c; res(); }));
      ctrl.addListener("ready", () => { if (want) ctrl.play(); });
    } else {
      ctrl.loadUri(uri(id));
    }
    ctrl.play();
  }
  function stop() { want = null; if (ctrl) ctrl.pause(); }
  return { play, stop, warm };
})();
