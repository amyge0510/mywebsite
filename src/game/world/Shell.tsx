"use client";

import { Barrier, Block } from "./primitives";
import type { TextureName } from "./textures";

// The bookstore building: outer walls, the floor between storeys, and the
// staircase. Layout (metres): the shop spans x −8…8 and z 0…−20, with the
// street in front at z > 0. Ground floor is y 0…4, Amy's room is y 4…7.6.

export const SHOP = { halfWidth: 8, depth: 20, floor2: 4, roof: 7.6, wall: 0.3 };

const T = SHOP.wall;
const BRICK = { texture: "brick" as TextureName, scale: 2 };

type Span = [number, number];

/** A piece of the front facade: brick outside, `inner` texture inside. */
function Front({ x, y, inner }: { x: Span; y: Span; inner: TextureName }) {
  return (
    <Block
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, 0]}
      size={[x[1] - x[0], y[1] - y[0], T]}
      texture={inner}
      scale={inner === "plaster" ? 2 : 1}
      faces={{ pz: BRICK }}
    />
  );
}

function Glass({ x, y, z = 0 }: { x: Span; y: Span; z?: number }) {
  return (
    <Block
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, z]}
      size={[x[1] - x[0], y[1] - y[0], 0.06]}
      color="#ffd9a0"
      emissive="#3a2410"
      transparent
      opacity={0.12}
    />
  );
}

function WindowFrame({ x, y }: { x: Span; y: Span }) {
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const cx = (x[0] + x[1]) / 2;
  const cy = (y[0] + y[1]) / 2;
  const f = 0.08;
  return (
    <>
      <Block collide={false} position={[cx, y[0], 0.18]} size={[w + f, f, 0.1]} color="#3b2418" />
      <Block collide={false} position={[cx, y[1], 0.18]} size={[w + f, f, 0.1]} color="#3b2418" />
      <Block collide={false} position={[x[0], cy, 0.18]} size={[f, h, 0.1]} color="#3b2418" />
      <Block collide={false} position={[x[1], cy, 0.18]} size={[f, h, 0.1]} color="#3b2418" />
      <Block collide={false} position={[cx, cy, 0.18]} size={[0.05, h, 0.06]} color="#3b2418" />
    </>
  );
}

export function Shell() {
  const W = SHOP.halfWidth;
  const D = SHOP.depth;
  const F2 = SHOP.floor2;
  const R = SHOP.roof;
  return (
    <group>
      {/* ── Front facade, ground floor: two shop windows and the door ── */}
      <Front x={[-W, -6.5]} y={[0, F2]} inner="plaster" />
      <Front x={[-6.5, -2]} y={[0, 0.8]} inner="plaster" />
      <Front x={[-6.5, -2]} y={[3.2, F2]} inner="plaster" />
      <Front x={[-2, -0.8]} y={[0, F2]} inner="plaster" />
      <Front x={[-0.8, 0.8]} y={[2.5, F2]} inner="plaster" />
      <Front x={[0.8, 2]} y={[0, F2]} inner="plaster" />
      <Front x={[2, 6.5]} y={[0, 0.8]} inner="plaster" />
      <Front x={[2, 6.5]} y={[3.2, F2]} inner="plaster" />
      <Front x={[6.5, W]} y={[0, F2]} inner="plaster" />
      <Glass x={[-6.5, -2]} y={[0.8, 3.2]} />
      <Glass x={[2, 6.5]} y={[0.8, 3.2]} />
      <WindowFrame x={[-6.5, -2]} y={[0.8, 3.2]} />
      <WindowFrame x={[2, 6.5]} y={[0.8, 3.2]} />

      {/* ── Front facade, upstairs: Amy's window above her desk ── */}
      <Front x={[-W, -1.5]} y={[F2, R]} inner="wallpaper" />
      <Front x={[1.5, W]} y={[F2, R]} inner="wallpaper" />
      <Front x={[-1.5, 1.5]} y={[F2, 5]} inner="wallpaper" />
      <Front x={[-1.5, 1.5]} y={[6.8, R]} inner="wallpaper" />
      <Glass x={[-1.5, 1.5]} y={[5, 6.8]} />
      <WindowFrame x={[-1.5, 1.5]} y={[5, 6.8]} />

      {/* ── Side and back walls ── */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <Block
            position={[side * W, F2 / 2, -D / 2]}
            size={[T, F2, D + T]}
            texture="plaster"
            scale={2}
            faces={{ [side > 0 ? "px" : "nx"]: BRICK }}
          />
          <Block
            position={[side * W, (F2 + R) / 2, -D / 2]}
            size={[T, R - F2, D + T]}
            texture="wallpaper"
            faces={{ [side > 0 ? "px" : "nx"]: BRICK }}
          />
        </group>
      ))}
      <Block position={[0, F2 / 2, -D]} size={[2 * W, F2, T]} texture="plaster" scale={2} />
      <Block position={[0, (F2 + R) / 2, -D]} size={[2 * W, R - F2, T]} texture="wallpaper" />

      {/* ── Ground floor, the floor between storeys, and the roof ── */}
      <Block position={[0, -0.1, -D / 2]} size={[2 * W, 0.2, D]} texture="woodFloor" scale={2} />
      <Slab x={[-W, W]} z={[-10, 0]} />
      <Slab x={[-W, 4.6]} z={[-18, -10]} />
      <Slab x={[-W, W]} z={[-D, -18]} />
      <Block
        position={[0, R + 0.1, -D / 2]}
        size={[2 * W + T, 0.2, D + T]}
        texture="beams"
        scale={1.5}
        faces={{ py: { color: "#2a2030" } }}
      />

      <Stairs />
    </group>
  );
}

function Slab({ x, z }: { x: Span; z: Span }) {
  return (
    <Block
      position={[(x[0] + x[1]) / 2, SHOP.floor2 - 0.1, (z[0] + z[1]) / 2]}
      size={[x[1] - x[0], 0.2, z[1] - z[0]]}
      texture="beams"
      scale={1.5}
      faces={{ py: { texture: "woodFloor", scale: 2, color: "#b49ac8" } }}
    />
  );
}

/**
 * 16 steps from the back of the shop up to Amy's room. The steps are visual
 * only; you actually walk on a smooth invisible ramp so climbing feels nice.
 */
function Stairs() {
  const steps = 16;
  const rise = SHOP.floor2 / steps;
  const run = 0.5;
  const x = 6.4;
  const width = 2.6;
  const startZ = -10;
  const length = Math.hypot(steps * run, SHOP.floor2);
  const angle = Math.atan2(SHOP.floor2, steps * run);
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => {
        const top = (i + 1) * rise;
        return (
          <Block
            key={i}
            collide={false}
            position={[x, top / 2, startZ - run * i - run / 2]}
            size={[width, top, run]}
            texture="darkWood"
            faces={{ py: { texture: "woodFloor", scale: 2 } }}
          />
        );
      })}
      <Barrier
        position={[x, SHOP.floor2 / 2, startZ - (steps * run) / 2]}
        size={[width, 0.1, length]}
        rotation={[angle, 0, 0]}
      />
      {/* Stairwell wall on the shop side, so you climb from the front. */}
      <Block position={[5.0, SHOP.floor2 / 2, -14.25]} size={[0.2, SHOP.floor2, 7.5]} texture="plaster" scale={2} />
      {/* Railings around the opening upstairs. */}
      <Block position={[4.5, SHOP.floor2 + 0.5, -14]} size={[0.1, 1, 8]} texture="darkWood" />
      <Block position={[6.2, SHOP.floor2 + 0.5, -9.95]} size={[3.3, 1, 0.1]} texture="darkWood" />
    </group>
  );
}
