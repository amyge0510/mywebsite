"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Barrier, Block, Hotspot } from "./primitives";
import { tex } from "./textures";
import { useGame } from "../store";
import type { Book } from "@/content/books";

type Vec3 = [number, number, number];

const SPINE_COLORS = [
  "#7a2e2e", "#2e4a7a", "#3d6b3d", "#8a6a2e", "#5a3a6e", "#2e6b6b",
  "#a0522d", "#6e2e4a", "#c9b48a", "#3a3a3a", "#8e3b2e", "#46607a",
];

const FEATURED_ROW = 2;
const FEATURED_SLOTS = 10;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type ShelfProps = {
  position: Vec3;
  rotationY?: number;
  length?: number;
  height?: number;
  depth?: number;
  rows?: number;
  sides?: "both" | "front";
  seed: number;
  featured?: Book[];
};

/**
 * A bookshelf packed with books. Featured books (from src/content/books.ts)
 * sit on the front at eye level and glow so visitors can find and open them.
 */
export function ShelfUnit({
  position,
  rotationY = 0,
  length = 3.2,
  height = 2.6,
  depth = 0.6,
  rows = 5,
  sides = "both",
  seed,
  featured = [],
}: ShelfProps) {
  const rowH = height / rows;
  const slotX = (slot: number) => -length / 2 + 0.25 + (slot * (length - 0.5)) / (FEATURED_SLOTS - 1);

  const books = useMemo(() => {
    const r = seeded(seed * 131 + 7);
    const out: { pos: Vec3; size: Vec3; color: string }[] = [];
    const faceList = sides === "both" ? [1, -1] : [1];
    const reserved = featured.map((b) => slotX(b.slot));
    for (const face of faceList) {
      for (let row = 0; row < rows; row++) {
        let x = -length / 2 + 0.06;
        while (x < length / 2 - 0.1) {
          const w = 0.045 + r() * 0.06;
          if (r() < 0.05) {
            x += w * 2;
            continue;
          }
          const cx = x + w / 2;
          const blocked =
            face === 1 && row === FEATURED_ROW && reserved.some((rx) => Math.abs(rx - cx) < 0.09);
          if (!blocked) {
            const h = Math.min(0.28 + r() * 0.16, rowH - 0.06);
            const d = 0.2 + r() * 0.06;
            const zBase = sides === "both" ? 0.02 : -depth / 2 + 0.04;
            out.push({
              pos: [cx, row * rowH + 0.03 + h / 2, face * (zBase + d / 2)],
              size: [w - 0.005, h, d],
              color: SPINE_COLORS[Math.floor(r() * SPINE_COLORS.length)],
            });
          }
          x += w;
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, length, height, depth, rows, sides, featured.length]);

  const instanced = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = instanced.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    books.forEach((b, i) => {
      m.compose(new THREE.Vector3(...b.pos), q, new THREE.Vector3(...b.size));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [books]);

  const spineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex("spine"), roughness: 0.95 }),
    [],
  );

  const toWorld = (local: Vec3): Vec3 => {
    const v = new THREE.Vector3(...local).applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotationY);
    return [v.x + position[0], v.y + position[1], v.z + position[2]];
  };

  return (
    <group>
      <Barrier position={toWorld([0, height / 2, 0])} size={[length, height, depth]} rotation={[0, rotationY, 0]} />
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* frame */}
        {[-1, 1].map((s) => (
          <Block key={s} collide={false} position={[(s * length) / 2, height / 2, 0]} size={[0.06, height, depth]} texture="darkWood" />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <Block key={i} collide={false} position={[0, i * rowH + 0.01, 0]} size={[length, 0.04, depth]} texture="darkWood" />
        ))}
        <Block
          collide={false}
          position={[0, height / 2, sides === "both" ? 0 : -depth / 2 + 0.015]}
          size={[length, height, 0.03]}
          texture="darkWood"
        />

        <instancedMesh ref={instanced} args={[undefined, undefined, books.length]} material={spineMat}>
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>

        {featured.map((b) => (
          <FeaturedBook
            key={b.id}
            book={b}
            position={[slotX(b.slot), FEATURED_ROW * rowH + 0.03 + 0.21, (sides === "both" ? 0.02 : -depth / 2 + 0.04) + 0.14]}
          />
        ))}
      </group>
      {featured.map((b) => (
        <Hotspot
          key={b.id}
          id={b.id}
          label={`Open “${b.title}”`}
          position={toWorld([slotX(b.slot), FEATURED_ROW * rowH + 0.25, 0.3])}
          action={() => useGame.getState().openOverlay({ type: "book", bookId: b.id })}
          radius={2.2}
        />
      ))}
    </group>
  );
}

function FeaturedBook({ book, position }: { book: Book; position: Vec3 }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const focused = useGame((s) => s.prompt?.id === book.id);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!mat.current || !group.current) return;
    const pulse = 0.35 + Math.sin(clock.elapsedTime * 2.2) * 0.2;
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, focused ? 1.6 : pulse, 8, dt);
    // Slide out a little when you look at it, like pulling it off the shelf.
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, focused ? 0.08 : 0, 8, dt);
  });
  return (
    <group position={position}>
      <group ref={group}>
        <mesh>
          <boxGeometry args={[0.09, 0.42, 0.26]} />
          <meshStandardMaterial ref={mat} color={book.color} emissive={book.color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0.131]}>
          <planeGeometry args={[0.06, 0.03]} />
          <meshBasicMaterial color="#f4d27a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
