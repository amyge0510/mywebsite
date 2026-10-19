import { create } from "zustand";

export type OverlayKind =
  | { type: "computer" }
  | { type: "book"; bookId: string }
  | { type: "records" }
  | { type: "notes" }
  | { type: "amy" }
  | { type: "fortune"; text: string }
  | { type: "sign"; title: string; body: string }
  | { type: "menu" };

export type Prompt = { id: string; label: string } | null;

type GameState = {
  started: boolean;
  overlay: OverlayKind | null;
  prompt: Prompt;
  isTouch: boolean;
  soundOn: boolean;
  secretsFound: string[];
  start: () => void;
  openOverlay: (o: OverlayKind) => void;
  closeOverlay: () => void;
  setPrompt: (p: Prompt) => void;
  setTouch: (t: boolean) => void;
  toggleSound: () => void;
  findSecret: (id: string) => void;
};

export const TOTAL_SECRETS = 5;

export const useGame = create<GameState>((set) => ({
  started: false,
  overlay: null,
  prompt: null,
  isTouch: false,
  soundOn: true,
  secretsFound: [],
  start: () => set({ started: true }),
  openOverlay: (overlay) => set({ overlay, prompt: null }),
  closeOverlay: () => set({ overlay: null }),
  setPrompt: (prompt) =>
    set((s) => (s.prompt?.id === prompt?.id ? s : { prompt })),
  setTouch: (isTouch) => set({ isTouch }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  findSecret: (id) =>
    set((s) =>
      s.secretsFound.includes(id) ? s : { secretsFound: [...s.secretsFound, id] },
    ),
}));
