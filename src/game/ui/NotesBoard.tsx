"use client";

import { useEffect, useState } from "react";
import { playChime } from "../audio";

// The poster board where visitors leave notes. For now notes are saved in the
// visitor's own browser; the next step swaps `loadNotes` / `saveNote` for a
// shared Supabase table (with moderation) so everyone sees the same board.

type Note = { id: string; text: string; from: string; color: string; at: number };

const COLORS = ["#fff3a8", "#ffc2d9", "#bfe8ff", "#d2f5c4", "#e6d0ff"];
const KEY = "amys-bookstore:notes";
const MAX = 240;

const SEED: Note[] = [
  { id: "seed-1", text: "first! this place is so cozy", from: "amy", color: COLORS[0], at: 0 },
  { id: "seed-2", text: "pet the cat on the windowsill. trust me.", from: "amy", color: COLORS[1], at: 0 },
];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    // storage blocked (private mode etc.) — the note still shows this session
  }
}

export function NotesBoard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => setNotes(loadNotes()), []);

  const pin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim().slice(0, MAX);
    if (!clean) return;
    const note: Note = {
      id: `${Date.now()}`,
      text: clean,
      from: from.trim().slice(0, 40) || "a visitor",
      color,
      at: Date.now(),
    };
    const next = [note, ...notes];
    setNotes(next);
    saveNotes(next);
    setText("");
    playChime();
  };

  const all = [...notes, ...SEED];

  return (
    <div className="notes">
      <div className="board">
        {all.map((n, i) => (
          <div
            key={n.id}
            className="note"
            style={{ background: n.color, transform: `rotate(${((i * 37) % 9) - 4}deg)` }}
          >
            <span className="pin" />
            <p>{n.text}</p>
            <span className="note-from">— {n.from}</span>
          </div>
        ))}
      </div>
      <form className="note-form" onSubmit={pin}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX}
          placeholder="leave amy a note…"
          rows={3}
        />
        <div className="note-form-row">
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="your name (optional)" maxLength={40} />
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`swatch ${c === color ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label="note colour"
              />
            ))}
          </div>
          <button className="pixel-btn" type="submit" disabled={!text.trim()}>
            pin it
          </button>
        </div>
        <p className="muted small">notes are only saved in your browser for now — a shared board is coming.</p>
      </form>
    </div>
  );
}
