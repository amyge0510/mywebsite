import { useGame } from "./store";

// Shared, mutable input state read every frame by the player. Kept outside
// React so key presses and joystick drags never cause re-renders.

export const input = {
  keys: new Set<string>(),
  // Joystick vector, x = strafe (right +), y = forward (+). Range -1..1.
  joystick: { x: 0, y: 0 },
  // Accumulated look deltas in pixels, consumed by the player each frame.
  look: { x: 0, y: 0 },
  // Set true for one frame when the visitor presses E / taps interact.
  interact: false,
};

const MOVE_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

export function bindKeyboard(onEscape: () => void) {
  const down = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (MOVE_KEYS.has(e.code)) e.preventDefault();
    if (e.code === "KeyE" && !e.repeat) input.interact = true;
    if (e.code === "Escape") onEscape();
    input.keys.add(e.code);
  };
  const up = (e: KeyboardEvent) => input.keys.delete(e.code);
  const blur = () => input.keys.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}

export function clearInput() {
  input.keys.clear();
  input.joystick.x = 0;
  input.joystick.y = 0;
  input.look.x = 0;
  input.look.y = 0;
  input.interact = false;
}

/** Lock the mouse to the game for mouse-look (desktop only). */
export function requestLook() {
  const { isTouch, started, overlay } = useGame.getState();
  if (isTouch || !started || overlay) return;
  const canvas = document.querySelector<HTMLCanvasElement>(".game canvas");
  try {
    void canvas?.requestPointerLock()?.catch?.(() => {});
  } catch {
    // Pointer lock can be unavailable (e.g. inside some iframes); drag-to-look still works.
  }
}
