# mywebsite

A cozy pixel-art room that works as a personal site. The records on the wall are projects.
Under them, a cabinet holds records you can play, there's a lamp you can switch on and off,
a coffee station, a bulletin board where visitors leave notes, and Mochi the cat.

There's no build step. It's plain HTML, CSS and JS.

```
index.html        page shell, modals
css/style.css     UI styling (tooltips, modals, HUD)
js/data.js        ← YOUR CONTENT: projects, music, cat name, Supabase keys
js/scene.js       the room: pixel renderer, lighting, interactions, cat AI
js/audio.js       record playback + built-in lo-fi synth + sound effects
js/notes.js       bulletin-board storage (localStorage or Supabase)
supabase/schema.sql
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Editing content

Everything lives in `js/data.js`:

- **Projects** (records on the wall): title, subtitle, year, tags, blurb, and `url`.
  Set `url` (for example `"projects/01.html"`) once a project page exists, and the
  popup's button links to it. `wallSlots` controls how many slots show. Slots
  without a project show "coming soon". Covers are generated pixel art (pick a
  `motif` and a `palette`).
- **Music** (records in the cabinet): set `src` to an audio file you're allowed to
  host, such as `assets/music/my-song.mp3`. While `src` is `null`, a built-in lo-fi
  synth plays that record's `synth` recipe, so every record makes sound out of the box.

## What you'll need ("connectors")

| Need | Recommendation | Why |
|---|---|---|
| Hosting | **GitHub Pages**, Vercel or Netlify (all free) | It's a static site, so any of them works with no config. |
| Shared bulletin board | **Supabase** (free tier) | Without it, notes only live in each visitor's own browser. |
| Project pages | Nothing extra | Add `projects/<name>.html` files (or move to Astro/Next later) and set `url`. |
| Your favorite songs | Files you have rights to, or **Spotify/YouTube embeds** | You can't legally host commercial tracks on your site. For real songs, the usual approach is a Spotify embed per record (it plays a preview, or the full track for logged-in users). |
| Optional later | A CMS such as Notion or Sanity, plus Supabase Storage | If you'd rather edit projects without touching code. |

### Setting up Supabase for the bulletin board

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Go to Project Settings → API and copy the **Project URL** and the **anon public** key
   into `supabaseUrl` and `supabaseAnonKey` in `js/data.js`.

The anon key is meant to be public. Row-level security in the schema only allows
reading visible notes and posting new ones. To hide a note, set `hidden = true`
in the table editor. If spam becomes a problem, add a captcha (Supabase supports
hCaptcha/Turnstile) or a rate-limit edge function.
