// The featured books that glow in the stacks. Each one is placed on a shelf
// by `shelf` (0–5) and `slot` (0–9 along that shelf). Placeholder text below —
// swap in your real books, excerpts and thoughts.

export type Book = {
  id: string;
  title: string;
  author: string;
  color: string;
  shelf: number;
  slot: number;
  excerpt: string;
  note: string;
};

export const books: Book[] = [
  {
    id: "book-1",
    title: "Your Favorite Novel",
    author: "Author Name",
    color: "#b5473a",
    shelf: 0,
    slot: 3,
    excerpt: "A short passage you love goes here — the line you underlined twice.",
    note: "Why this book matters to me, and when I first read it.",
  },
  {
    id: "book-2",
    title: "A Book That Changed My Mind",
    author: "Author Name",
    color: "#3f6e8c",
    shelf: 2,
    slot: 6,
    excerpt: "An excerpt that captures the idea that stuck with you.",
    note: "What I believed before, and what I believe now.",
  },
  {
    id: "book-3",
    title: "Comfort Read",
    author: "Author Name",
    color: "#7a5a9e",
    shelf: 4,
    slot: 1,
    excerpt: "The opening line you could recite from memory.",
    note: "The book I reread every winter.",
  },
  {
    id: "book-4",
    title: "Currently Reading",
    author: "Author Name",
    color: "#4f8a5b",
    shelf: 1,
    slot: 8,
    excerpt: "Where I'm at so far…",
    note: "Halfway through. No spoilers please.",
  },
];
