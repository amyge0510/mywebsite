import * as THREE from "three";

// A lightweight registry of things the visitor can interact with. World
// components register themselves; the player picks the nearest one that is
// in front of the camera and within reach, and shows its prompt.

export type Interactable = {
  id: string;
  label: string;
  position: THREE.Vector3;
  radius: number;
  action: () => void;
};

export const interactables = new Map<string, Interactable>();

export function registerInteractable(i: Interactable) {
  interactables.set(i.id, i);
  return () => {
    interactables.delete(i.id);
  };
}

const toTarget = new THREE.Vector3();

export function findFocused(eye: THREE.Vector3, forward: THREE.Vector3): Interactable | null {
  let best: Interactable | null = null;
  let bestScore = -Infinity;
  for (const i of interactables.values()) {
    toTarget.subVectors(i.position, eye);
    const dist = toTarget.length();
    if (dist > i.radius) continue;
    const facing = toTarget.normalize().dot(forward);
    if (facing < 0.55) continue;
    // Prefer things you're looking straight at, then things that are close.
    const score = facing * 2 - dist / i.radius;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
