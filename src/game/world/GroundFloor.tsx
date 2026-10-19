"use client";

import { useMemo } from "react";
import { Block, Hotspot } from "./primitives";
import { ShelfUnit } from "./Shelves";
import { textTexture } from "./textures";
import { Cat } from "./Characters";
import { useGame } from "../store";
import { books } from "@/content/books";
import { records } from "@/content/music";

type Vec3 = [number, number, number];

function Pendant({ position, color = "#ffb565", intensity = 8 }: { position: Vec3; color?: string; intensity?: number }) {
  return (
    <group position={position}>
      <Block collide={false} position={[0, 0.35, 0]} size={[0.02, 0.7, 0.02]} color="#222" />
      <Block collide={false} position={[0, 0, 0]} size={[0.5, 0.2, 0.5]} color="#2a4a3a" />
      <Block collide={false} position={[0, -0.12, 0]} size={[0.3, 0.06, 0.3]} color="#ffe0b0" emissive="#ffb060" emissiveIntensity={2} />
      <pointLight color={color} intensity={intensity} distance={10} decay={1.5} position={[0, -0.4, 0]} />
    </group>
  );
}

function Label({ text, position, rotationY = 0, width = 2, color = "#f4d27a", bg = "#2b1a12" }: {
  text: string;
  position: Vec3;
  rotationY?: number;
  width?: number;
  color?: string;
  bg?: string;
}) {
  const t = useMemo(
    () => textTexture(text, { width: Math.round(width * 48), height: 20, color, bg }),
    [text, width, color, bg],
  );
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[width, 0.42]} />
      <meshBasicMaterial map={t} toneMapped={false} />
    </mesh>
  );
}

function Cafe() {
  const openOverlay = useGame((s) => s.openOverlay);
  return (
    <group>
      {/* counter */}
      <Block position={[5.4, 0.55, -4.4]} size={[4.6, 1.1, 0.8]} texture="darkWood" />
      <Block collide={false} position={[5.4, 1.13, -4.4]} size={[4.8, 0.06, 1.0]} color="#c9a27a" />
      {/* espresso machine, pastry case, cups */}
      <Block collide={false} position={[6.6, 1.46, -4.55]} size={[0.7, 0.6, 0.5]} color="#b9b9c4" />
      <Block collide={false} position={[6.6, 1.5, -4.29]} size={[0.5, 0.12, 0.04]} color="#2a2a30" />
      <Block
        collide={false}
        position={[4.3, 1.42, -4.4]}
        size={[1.4, 0.52, 0.7]}
        color="#ffe8c0"
        emissive="#ff9a40"
        emissiveIntensity={0.25}
        transparent
        opacity={0.35}
      />
      {[3.9, 4.3, 4.7].map((x) => (
        <Block key={x} collide={false} position={[x, 1.25, -4.4]} size={[0.25, 0.1, 0.25]} color="#c98a4a" />
      ))}
      {[5.4, 5.6].map((x) => (
        <Block key={x} collide={false} position={[x, 1.2, -4.2]} size={[0.1, 0.12, 0.1]} color="#efe6d6" />
      ))}
      {/* back shelf with jars */}
      <Block position={[5.4, 1.8, -5.6]} size={[4.4, 0.06, 0.4]} texture="darkWood" collide={false} />
      {[3.6, 4.2, 4.8, 5.4, 6.0, 6.6, 7.2].map((x, i) => (
        <Block key={x} collide={false} position={[x, 2.0, -5.6]} size={[0.22, 0.32, 0.22]} color={["#c98a4a", "#7a4a2a", "#e8d4a0"][i % 3]} />
      ))}
      {/* stools */}
      {[4.0, 5.2, 6.4].map((x) => (
        <Block key={x} position={[x, 0.38, -3.45]} size={[0.38, 0.76, 0.38]} texture="darkWood" />
      ))}
      {/* little table by the window */}
      <Block position={[4.6, 0.75, -1.4]} size={[0.8, 0.05, 0.8]} texture="darkWood" />
      <Block collide={false} position={[4.6, 0.37, -1.4]} size={[0.08, 0.74, 0.08]} color="#222" />
      <Block position={[3.6, 0.4, -1.4]} size={[0.5, 0.8, 0.5]} color="#7a3a2a" />
      {/* chalkboard menu on the east wall */}
      <Block collide={false} position={[7.82, 2.2, -2.6]} size={[0.05, 1.2, 1.7]} color="#1d2a24" />
      <Label text="café" position={[7.78, 2.55, -2.6]} rotationY={-Math.PI / 2} width={1.2} color="#f2efe6" bg="#1d2a24" />
      <Hotspot
        id="cafe-menu"
        label="Read the menu"
        position={[7.6, 2.0, -2.6]}
        action={() =>
          openOverlay({
            type: "sign",
            title: "café menu",
            body: "lavender honey latte · rainy-day hot chocolate · earl grey (the cat's favourite) · a slice of whatever's in the case. TODO: Amy's real menu.",
          })
        }
      />
      <Pendant position={[5.4, 3.2, -4.2]} />
    </group>
  );
}

function RecordCorner() {
  const openOverlay = useGame((s) => s.openOverlay);
  return (
    <group>
      {[
        [-6.7, -2.2],
        [-5.5, -2.2],
        [-6.7, -3.6],
        [-5.5, -3.6],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Block position={[0, 0.35, 0]} size={[1.0, 0.7, 1.0]} texture="darkWood" />
          {Array.from({ length: 9 }, (_, j) => (
            <Block
              key={j}
              collide={false}
              position={[0, 0.88, -0.4 + j * 0.1]}
              size={[0.86, 0.36, 0.02]}
              color={records[(i * 9 + j) % records.length].color}
            />
          ))}
        </group>
      ))}
      {/* listening station */}
      <Block position={[-7.4, 0.5, -5.6]} size={[0.8, 1.0, 1.6]} texture="darkWood" />
      <Block collide={false} position={[-7.4, 1.04, -5.6]} size={[0.6, 0.08, 0.6]} color="#2a2a2a" />
      <mesh position={[-7.4, 1.1, -5.6]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Label text="records" position={[-7.83, 2.5, -3.0]} rotationY={Math.PI / 2} width={1.8} />
      <Hotspot
        id="record-crates"
        label="Flip through the records"
        position={[-6.1, 0.9, -2.9]}
        action={() => openOverlay({ type: "records" })}
        radius={2.8}
      />
      <Pendant position={[-6, 3.2, -3]} />
    </group>
  );
}

function ReadingNook() {
  const openOverlay = useGame((s) => s.openOverlay);
  const current = books.find((b) => b.id === "book-4");
  return (
    <group>
      <Block position={[-6.6, 0.25, -17.8]} size={[1.3, 0.5, 1.1]} color="#8a3a2e" />
      <Block position={[-6.6, 0.8, -18.3]} size={[1.3, 1.0, 0.25]} color="#7a3228" />
      <Block position={[-7.2, 0.6, -17.8]} size={[0.2, 0.6, 1.1]} color="#7a3228" />
      <Block position={[-6.0, 0.6, -17.8]} size={[0.2, 0.6, 1.1]} color="#7a3228" />
      {/* lamp */}
      <Block collide={false} position={[-5.3, 0.8, -18.6]} size={[0.06, 1.6, 0.06]} color="#222" />
      <Block collide={false} position={[-5.3, 1.7, -18.6]} size={[0.45, 0.35, 0.45]} color="#ffe0a8" emissive="#ffa850" emissiveIntensity={1.4} />
      <pointLight color="#ffb060" intensity={5} distance={7} decay={1.6} position={[-5.3, 1.5, -18.2]} />
      {/* side table with the current read */}
      <Block position={[-7.5, 0.3, -16.6]} size={[0.5, 0.6, 0.5]} texture="darkWood" />
      <Block collide={false} position={[-7.5, 0.64, -16.6]} size={[0.3, 0.06, 0.22]} color={current?.color ?? "#4f8a5b"} emissive={current?.color} emissiveIntensity={0.3} />
      <Block collide={false} position={[-7.5, 0.7, -16.6]} size={[0.07, 0.07, 0.07]} color="#efe6d6" />
      {current && (
        <Hotspot
          id="currently-reading"
          label="See what Amy's reading"
          position={[-7.4, 0.7, -16.6]}
          action={() => openOverlay({ type: "book", bookId: current.id })}
          radius={2.2}
        />
      )}
      <Cat id="nook-cat" position={[-6.6, 0.5, -17.65]} variant="loaf" color="orange" />
    </group>
  );
}

export function GroundFloor() {
  const unit = (i: number) => books.filter((b) => b.shelf === i);
  return (
    <group>
      {/* entry rug */}
      <Block collide={false} position={[0, 0.01, -1.6]} size={[2.4, 0.01, 1.6]} texture="rug" />
      {/* window display stacks */}
      {[-5.5, -4.2, -3.0, 3.0, 4.2].map((x, i) => (
        <group key={x} position={[x, 0, -0.55]}>
          <Block position={[0, 0.4, 0]} size={[0.9, 0.8, 0.5]} texture="darkWood" />
          {[0, 1, 2].map((j) => (
            <Block key={j} collide={false} position={[0, 0.86 + j * 0.09, 0]} size={[0.5 - j * 0.04, 0.08, 0.34]} color={["#7a2e2e", "#2e4a7a", "#c9b48a", "#3d6b3d", "#5a3a6e"][(i + j) % 5]} />
          ))}
        </group>
      ))}

      <Cafe />
      <RecordCorner />

      {/* The stacks */}
      <ShelfUnit position={[-5.7, 0, -8]} seed={1} featured={unit(0)} />
      <ShelfUnit position={[-1.6, 0, -8]} seed={2} featured={unit(1)} />
      <ShelfUnit position={[-5.7, 0, -11]} seed={3} featured={unit(2)} />
      <ShelfUnit position={[-1.6, 0, -11]} seed={4} featured={unit(3)} />
      <ShelfUnit position={[-5.7, 0, -14]} seed={5} featured={unit(4)} />
      <ShelfUnit position={[-1.6, 0, -14]} seed={6} featured={unit(5)} />
      <ShelfUnit position={[4.6, 0, -14.3]} rotationY={-Math.PI / 2} length={6} sides="front" depth={0.5} seed={7} />
      <ShelfUnit position={[0.4, 0, -19.6]} length={5} sides="front" depth={0.5} seed={8} />
      <Label text="the stacks" position={[-3.65, 3.1, -6.5]} width={2.2} />

      <ReadingNook />

      {/* Sign over the stairs */}
      <Label text="upstairs · amy's room ↑" position={[6.4, 3.35, -9.85]} width={2.6} />

      <Pendant position={[-3.6, 3.2, -9.5]} />
      <Pendant position={[-3.6, 3.2, -15.5]} />
      <Pendant position={[1.8, 3.2, -6]} intensity={6} />
      <Pendant position={[2.6, 3.2, -16.5]} intensity={6} />
    </group>
  );
}
