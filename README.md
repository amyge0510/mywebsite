# Amy's Bookstore

A cozy, first-person pixel world you can walk around in: a little bookstore on a
rainy street, a café and record corner downstairs, the stacks, and Amy's room
upstairs with her desk, record wall and poster board.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (what Vercel runs)
npm run typecheck
```

Dev shortcut: `/?spawn=x,y,z,yaw` drops you anywhere, e.g.
`/?spawn=0,5.2,-3.2,3.14` puts you behind Amy at her desk.

## Controls

- **WASD** or **↑ ↓** to walk, **← →** or the mouse to turn and look
- **E** or click to interact, **Esc** for the menu
- On phones: joystick in the lower right, drag to look, tap the ✋ button to interact

## Editing your content

Everything personal lives in `src/content/`, no 3D code needed:

| File | What it controls |
| --- | --- |
| `site.ts` | name, LinkedIn/resume/email links, what Amy says, crystal-ball fortunes |
| `books.ts` | featured books that glow in the stacks (shelf + slot, excerpt, your note) |
| `projects.ts` | projects on Amy's computer |
| `music.ts` | records on the wall (add a Spotify album id to get the embedded player) |

## How the world is built

- `src/game/Game.tsx` sets up the canvas, physics, lighting and the pixel look
- `src/game/Player.tsx` is the first-person controller (walk, look, stairs, interact)
- `src/game/world/` holds the places: `Street`, `Shell` (the building and stairs),
  `GroundFloor`, `Upstairs`, plus `Shelves` (books) and `Characters` (Amy and the cats)
- `src/game/world/textures.ts` paints the placeholder pixel-art textures and sprites
- `src/game/ui/` is the HUD, joystick, start screen and pop-up panels
- `src/game/audio.ts` synthesizes rain, purring, the door bell, and so on

The world renders at half resolution and scales up with crisp pixels
(`PIXEL_SCALE` in `Game.tsx`). Raise it toward 1 for less pixelation.

## Not built yet

- Shared notes board (Supabase); notes are saved per-browser for now
- Live Spotify "what I'm listening to" and Hardcover "currently reading"
- Contact form (Resend)
- Real art: textures, props and sprite sheets to replace the placeholders
