/* ------------------------------------------------------------------
   SITE CONTENT — edit this file to change what's on the wall.
   Everything here is plain data; no build step needed.
------------------------------------------------------------------- */
window.SITE = {
  title: "my small corner",

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
      id: "project-01", title: "Cher's Closet", subtitle: "a short tagline",
      year: "2026", tags: ["web", "design"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: "https://cher-closet.vercel.app/",
      /* the inside of the sleeve: a two-page design (left page holds the blurb on its lines);
         github / site fill in the two round icons on the right page, url fills in "link" */
      spread: { left: "assets/spreads/clueless-left.jpg", right: "assets/spreads/clueless-right.jpg" },
      links: { github: "https://github.com/amyge0510/cher-closet", site: "https://cher-closet.vercel.app/" },
      cover: { image: "assets/covers/project-01.jpg",
               palette: { bg: "#2b3a67", a: "#f4a259", b: "#e76f51", c: "#ffe8a3", ink: "#fff4e0" } }
    },
    {
      id: "project-02", title: "Project 02", subtitle: "a short tagline",
      year: "2026", tags: ["research"],
      blurb: "Describe what you built, why, and what you learned. Edit me in js/data.js.",
      url: null,
      cover: { image: "assets/covers/project-02.jpg", palette: { bg: "#efe1c4", a: "#c8202a", b: "#3a2a1e", c: "#e8d2a8", ink: "#2a2a2a" } }
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

  /* MUSIC — the records in the cabinet rack.
     spotify: the Spotify track ID (from a share link: open.spotify.com/track/<ID>).
              When a record lands on the player, that track plays in a small
              Spotify player (full songs for listeners logged into Spotify,
              30-second previews otherwise).
     cover:   path to the album art. */
  music: [
    { id: "home", title: "Home", artist: "Edward Sharpe & The Magnetic Zeros",
      cover: "assets/covers/home.jpg", spotify: "7w5cxTEzp1rfV3KCy0Bd5N" },
    { id: "la-la-land", title: "La La Land", artist: "Justin Hurwitz",
      cover: "assets/covers/la-la-land.jpg", spotify: "5kRBzRZmZTXVg8okC7SJFZ" },
    { id: "from-the-start", title: "From the Start", artist: "Laufey",
      cover: "assets/covers/from-the-start.jpg", spotify: "43iIQbw5hx986dUEZbr3eN" },
    { id: "little-lion-man", title: "Little Lion Man", artist: "Mumford & Sons",
      cover: "assets/covers/sigh-no-more.jpg", spotify: "37jCwWbb32w46aS5pKZZbe" },
    { id: "doo-wops", title: "Doo-Wops & Hooligans", artist: "Bruno Mars",
      cover: "assets/covers/doo-wops.jpg", spotify: "3w3y8KPTfNeOKPiqUTakBh" },
    { id: "a-bar-song", title: "A Bar Song (Tipsy)", artist: "Shaboozey",
      cover: "assets/covers/a-bar-song.jpg", spotify: "5fZJQrFKWQLb7FpJXZ1g7K" },
    { id: "jazz-is-for-ordinary-people", title: "Jazz Is for Ordinary People", artist: "berlioz",
      cover: "assets/covers/jazz-is-for-ordinary-people.jpg", spotify: "06SYfhYSo9iY3txHE6W9Dl" },
    { id: "her-eyes", title: "her eyes", artist: "",
      cover: "assets/covers/her-eyes.jpg", spotify: "2JCZkX4VIhV0SvCvqtreS1" }
  ]
};
