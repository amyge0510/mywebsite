"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { spriteTexture } from "./textures";
import { Hotspot } from "./primitives";
import { playerPosition } from "../Player";
import { createPurr, playMeow } from "../audio";
import { useGame } from "../store";

type Vec3 = [number, number, number];

// Placeholder pixel sprites drawn as ASCII maps. Replace with real sprite
// sheets from Aseprite later — the components below won't need to change.

const AMY_BACK = [
  ".....HHHHHH.....",
  "....HhhhhhhH....",
  "...HhhhhhhhhH...",
  "..kHhhhhhhhhHk..",
  ".kkHhhhhhhhhHkk.",
  "..kHhhhhhhhhHk..",
  "...HhhhhhhhhH...",
  "...HhhhhhhhhH...",
  "..pHhhhhhhhhHp..",
  ".ppHhhhhhhhhHpp.",
  ".ppHhhhhhhhhHpp.",
  ".spPHhhhhhhHPps.",
  ".s.PPHhhhhHPP.s.",
  "...PPPHhhHPPP...",
  "...PPPPPPPPPP...",
  "...dddddddddd...",
  "..dddddddddddd..",
  "..cccccccccccc..",
  "..c.dd....dd.c..",
  "..c.dd....dd.c..",
  "..c..........c..",
  "..c..........c..",
];
const AMY_PALETTE = {
  H: "#7d1f22",
  h: "#b8322e",
  k: "#2a2238",
  p: "#9a6cc4",
  P: "#6a4592",
  s: "#f0b48a",
  d: "#3a2240",
  c: "#4a2e2a",
};

const CAT_SIT = [
  ".k........k.",
  ".kk......kk.",
  ".kkkkkkkkkk.",
  ".kyykkkkyyk.",
  ".kkkkpkkkkk.",
  "..kkkkkkkk..",
  "...kkkkkk...",
  "..kkkkkkkk..",
  ".kkkkkkkkkk.",
  ".kkkkkkkkkk.",
  ".kkkkkkkkkkk",
  ".kkkkkkkkk.k",
  ".kk.kkkk.kk.",
];
const CAT_LOAF = [
  "..o..o..........",
  ".oooooo.........",
  ".odoodo.ooooo...",
  ".oooooooooooooo.",
  "ooopooooOoooOooo",
  "oOooOooOooOooooo",
  "oooooooooooooooo",
  ".oooooooooooooo.",
];

const ORANGE_CAT = { o: "#d98a3a", O: "#a8612a", d: "#5a3418", p: "#e08aa0" };
const BLACK_CAT = { k: "#1b1424", y: "#f2d04a", p: "#e08aa0" };

function useSprite(rows: string[], palette: Record<string, string>) {
  return useMemo(() => spriteTexture(rows, palette), [rows, palette]);
}

function SpritePlane({
  rows,
  palette,
  height,
  emissive = 0.15,
}: {
  rows: string[];
  palette: Record<string, string>;
  height: number;
  emissive?: number;
}) {
  const { texture, width, height: h } = useSprite(rows, palette);
  const w = (width / h) * height;
  return (
    <mesh position={[0, height / 2, 0]}>
      <planeGeometry args={[w, height]} />
      <meshStandardMaterial
        map={texture}
        alphaTest={0.5}
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={emissive}
      />
    </mesh>
  );
}

/** Pixel-Amy, sitting at her desk with her back to the room. */
export function Amy({ position }: { position: Vec3 }) {
  const openOverlay = useGame((s) => s.openOverlay);
  return (
    <group position={position}>
      <group rotation={[0, Math.PI, 0]}>
        <SpritePlane rows={AMY_BACK} palette={AMY_PALETTE} height={1.35} emissive={0.2} />
      </group>
      <Hotspot
        id="amy"
        label="Talk to Amy"
        position={[position[0], position[1] + 1, position[2]]}
        action={() => openOverlay({ type: "amy" })}
      />
    </group>
  );
}

/**
 * A cat that purrs louder as you get close and can be petted. `facing` turns
 * the sprite toward the player around the vertical axis.
 */
export function Cat({
  id,
  position,
  variant = "sit",
  color = "black",
}: {
  id: string;
  position: Vec3;
  variant?: "sit" | "loaf";
  color?: "black" | "orange";
}) {
  const purr = useRef<ReturnType<typeof createPurr>>(null);
  const started = useGame((s) => s.started);
  const findSecret = useGame((s) => s.findSecret);
  const [pettedAt, setPettedAt] = useState(-10);
  const hearts = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useEffect(() => {
    if (!started) return;
    purr.current = createPurr();
    return () => {
      purr.current?.stop();
      purr.current = null;
    };
  }, [started]);

  const target = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, dt) => {
    clock.current += dt;
    const sincePet = clock.current - pettedAt;
    const dist = playerPosition.distanceTo(target);
    // Same floor only, fades in within ~5m, full purr right after petting.
    const sameFloor = Math.abs(playerPosition.y - target.y) < 2.5;
    let level = sameFloor ? THREE.MathUtils.clamp(1 - (dist - 0.8) / 4.5, 0, 1) * 0.35 : 0;
    if (sincePet < 4) level = Math.max(level, 0.6);
    purr.current?.setLevel(level);

    if (hearts.current) {
      const visible = sincePet < 1.6;
      hearts.current.visible = visible;
      if (visible) {
        hearts.current.children.forEach((h, i) => {
          h.position.y = 0.5 + sincePet * (0.5 + i * 0.15);
          h.position.x = Math.sin(sincePet * 4 + i * 2) * 0.12 + (i - 1) * 0.12;
        });
      }
    }
  });

  const pet = () => {
    setPettedAt(clock.current);
    playMeow();
    findSecret(`pet-${id}`);
  };

  return (
    <group position={position}>
      <Billboard lockX lockZ>
        {variant === "sit" ? (
          <SpritePlane rows={CAT_SIT} palette={color === "black" ? BLACK_CAT : ORANGE_CAT} height={0.42} emissive={0.1} />
        ) : (
          <SpritePlane rows={CAT_LOAF} palette={ORANGE_CAT} height={0.26} emissive={0.12} />
        )}
        <group ref={hearts} visible={false}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <planeGeometry args={[0.08, 0.08]} />
              <meshBasicMaterial color="#ff7aa8" />
            </mesh>
          ))}
        </group>
      </Billboard>
      <Hotspot
        id={id}
        label="Pet the cat"
        position={[position[0], position[1] + 0.25, position[2]]}
        action={pet}
        radius={2.2}
      />
    </group>
  );
}
