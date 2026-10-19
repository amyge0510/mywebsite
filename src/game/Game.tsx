"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./Player";
import { Shell } from "./world/Shell";
import { Street } from "./world/Street";
import { GroundFloor } from "./world/GroundFloor";
import { Upstairs } from "./world/Upstairs";
import { HUD } from "./ui/HUD";
import { Overlays } from "./ui/Overlays";
import { StartScreen } from "./ui/StartScreen";
import { useGame } from "./store";
import { bindKeyboard, clearInput, input, requestLook } from "./input";
import { setMuted } from "./audio";

// The world renders at a fraction of screen resolution and is scaled up with
// crisp pixels (see `.game canvas` in globals.css). 0.5 = "barely pixelated".
const PIXEL_SCALE = 0.5;

const DEFAULT_SPAWN: [number, number, number, number] = [0, 1.2, 9, 0];

// Dev helper: /?spawn=x,y,z,yaw drops you anywhere in the world.
function readSpawn(): [number, number, number, number] {
  const raw = new URLSearchParams(window.location.search).get("spawn");
  const parts = raw?.split(",").map(Number);
  if (!parts || parts.length < 3 || parts.some(Number.isNaN)) return DEFAULT_SPAWN;
  return [parts[0], parts[1], parts[2], parts[3] ?? 0];
}

export default function Game() {
  const overlay = useGame((s) => s.overlay);
  const soundOn = useGame((s) => s.soundOn);
  const lastUnlock = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [spawn] = useState(readSpawn);
  const spawnPos = useMemo(() => [spawn[0], spawn[1], spawn[2]] as [number, number, number], [spawn]);

  useEffect(() => {
    useGame.getState().setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(
    () =>
      bindKeyboard(() => {
        // In pointer lock the browser eats Escape and we open the menu from
        // the pointerlockchange handler instead; don't double-handle it.
        if (performance.now() - lastUnlock.current < 200) return;
        const s = useGame.getState();
        if (!s.started) return;
        if (s.overlay) s.closeOverlay();
        else s.openOverlay({ type: "menu" });
      }),
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      input.look.x += e.movementX;
      input.look.y += e.movementY;
    };
    const onLockChange = () => {
      if (document.pointerLockElement) return;
      lastUnlock.current = performance.now();
      const s = useGame.getState();
      if (s.started && !s.overlay) s.openOverlay({ type: "menu" });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, []);

  useEffect(() => {
    if (overlay) {
      clearInput();
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [overlay]);

  useEffect(() => setMuted(!soundOn), [soundOn]);

  // Drag-to-look for touch screens (and for mice when pointer lock is off).
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      if (document.pointerLockElement) {
        input.interact = true;
        return;
      }
      requestLook();
    }
    if (drag.current) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || document.pointerLockElement) return;
    const factor = e.pointerType === "touch" ? 1.8 : 1;
    input.look.x += (e.clientX - d.x) * factor;
    input.look.y += (e.clientY - d.y) * factor;
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  return (
    <div
      className="game"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas
        dpr={PIXEL_SCALE}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 72, near: 0.05, far: 220, position: [0, 1.6, 9] }}
      >
        <color attach="background" args={["#0b0a1a"]} />
        <fog attach="fog" args={["#0e0c20", 14, 60]} />
        <hemisphereLight args={["#4a4a8a", "#1a1020", 0.55]} />
        <ambientLight color="#3a2e4a" intensity={0.45} />
        <Suspense fallback={null}>
          <Physics>
            <Player spawn={spawnPos} spawnYaw={spawn[3]} />
            <Shell />
            <Street />
            <GroundFloor />
            <Upstairs />
          </Physics>
        </Suspense>
      </Canvas>
      <HUD />
      <Overlays />
      <StartScreen />
    </div>
  );
}
