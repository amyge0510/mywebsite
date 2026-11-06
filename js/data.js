/* ------------------------------------------------------------------
   SITE CONTENT — edit this file to change what's on the wall.
   Everything here is plain data; no build step needed.
------------------------------------------------------------------- */
window.SITE = {
  title: "my little room",
  catName: "Mochi",

  /* Backend for the bulletin board. Leave blank to keep notes in the
     visitor's browser only (localStorage). Fill both in to share notes
     between all visitors via Supabase — see README.md. */
  supabaseUrl: "",
  supabaseAnonKey: "",

  /* How many record slots the wall has (4 per row). Slots without a
     project show as "coming soon". */
  wallSlots: 8,

  /* PROJECTS — the records on the wall.
     motif: sunset | ghost | face | bauhaus | waves | planet | flower | dots
     url:   set this when the project page exists (e.g. "projects/01.html") */
  projects: [
    {
      id: "project-01", title: "Project 01", subtitle: "a short tagline",
      year: "2026", tags: ["web", "design"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "sunset", label: "PROJECT 01",
               palette: { bg: "#2b3a67", a: "#f4a259", b: "#e76f51", c: "#ffe8a3", ink: "#fff4e0" } }
    },
    {
      id: "project-02", title: "Project 02", subtitle: "a short tagline",
      year: "2026", tags: ["research"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "face", label: "PROJECT 02",
               palette: { bg: "#efe7da", a: "#c44536", b: "#2a2a2a", c: "#e8c4a8", ink: "#2a2a2a" } }
    },
    {
      id: "project-03", title: "Project 03", subtitle: "a short tagline",
      year: "2025", tags: ["app"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "ghost", label: "PROJECT 03",
               palette: { bg: "#6b7f4f", a: "#9fb3c8", b: "#d9c6a5", c: "#c08552", ink: "#ffffff" } }
    },
    {
      id: "project-04", title: "Project 04", subtitle: "a short tagline",
      year: "2025", tags: ["hardware"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "bauhaus", label: "PROJECT 04",
               palette: { bg: "#f2e3c6", a: "#d1495b", b: "#00798c", c: "#edae49", ink: "#30343f" } }
    },
    {
      id: "project-05", title: "Project 05", subtitle: "a short tagline",
      year: "2024", tags: ["ml", "data"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "planet", label: "PROJECT 05",
               palette: { bg: "#1b1b3a", a: "#f9c784", b: "#e7663b", c: "#a8dadc", ink: "#f1faee" } }
    },
    {
      id: "project-06", title: "Project 06", subtitle: "a short tagline",
      year: "2024", tags: ["game"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { motif: "flower", label: "PROJECT 06",
               palette: { bg: "#f6bd60", a: "#f28482", b: "#84a59d", c: "#fff1c1", ink: "#3d2c2e" } }
    }
  ],

  /* MUSIC — the records in the cabinet.
     src:   path/URL to an audio file you have the rights to (e.g. "assets/music/song.mp3").
            While src is null, a built-in lo-fi synth plays the `synth` recipe instead. */
  music: [
    {
      id: "warm-static", title: "Warm Static", artist: "built-in lo-fi synth",
      src: null, vinyl: "#d9622b",
      cover: { motif: "waves", palette: { bg: "#3d405b", a: "#e07a5f", b: "#f2cc8f", c: "#81b29a", ink: "#f4f1de" } },
      synth: { bpm: 76, seed: 3, lead: "triangle", density: 0.45,
               chords: [[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],
               scale: [72,74,76,79,81,84] }
    },
    {
      id: "matcha-morning", title: "Matcha Morning", artist: "built-in lo-fi synth",
      src: null, vinyl: "#7fa65a",
      cover: { motif: "dots", palette: { bg: "#dde5b6", a: "#6a994e", b: "#386641", c: "#f2e8cf", ink: "#283618" } },
      synth: { bpm: 86, seed: 11, lead: "square", density: 0.4,
               chords: [[50,54,57,61],[47,50,54,57],[43,47,50,54],[45,50,52,55]],
               scale: [74,76,78,81,83,86] }
    },
    {
      id: "late-night-loop", title: "Late Night Loop", artist: "built-in lo-fi synth",
      src: null, vinyl: "#1d1a22",
      cover: { motif: "planet", palette: { bg: "#0b132b", a: "#c6a0f6", b: "#5bc0be", c: "#f6f0a0", ink: "#ffffff" } },
      synth: { bpm: 70, seed: 27, lead: "triangle", density: 0.35,
               chords: [[45,48,52,55],[41,45,48,52],[50,53,57,60],[52,56,59,62]],
               scale: [69,72,74,76,79,81] }
    },
    {
      id: "rainy-window", title: "Rainy Window", artist: "built-in lo-fi synth",
      src: null, vinyl: "#4b7bb5", rain: true,
      cover: { motif: "sunset", palette: { bg: "#264653", a: "#8ab4d6", b: "#5a7fa8", c: "#e9c46a", ink: "#ffffff" } },
      synth: { bpm: 72, seed: 42, lead: "triangle", density: 0.4,
               chords: [[51,55,58,62],[48,51,55,58],[44,48,51,55],[46,50,53,55]],
               scale: [75,77,79,82,84,87] }
    }
  ]
};
