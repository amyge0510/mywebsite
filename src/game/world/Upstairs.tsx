"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Block, Hotspot } from "./primitives";
import { textTexture } from "./textures";
import { Amy, Cat } from "./Characters";
import { useGame } from "../store";
import { playChime, playHoot } from "../audio";
import { records } from "@/content/music";
import { fortunes } from "@/content/site";

type Vec3 = [number, number, number];
const F = 4; // floor height of Amy's room

function Candle({ position, light = false }: { position: Vec3; light?: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime + seed;
    lightRef.current.intensity = 2.6 + Math.sin(t * 13) * 0.3 + Math.sin(t * 7.3) * 0.25;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.18, 6]} />
        <meshStandardMaterial color="#f3c6e0" emissive="#ff8fc8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.03, 0.06, 0.03]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      {light && <pointLight ref={lightRef} color="#ff9ad0" intensity={2.6} distance={6} decay={1.7} position={[0, 0.35, 0]} />}
    </group>
  );
}

function Pumpkin({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} scale={[1, 0.8, 1]}>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial color="#d9661f" emissive="#ff6a10" emissiveIntensity={0.55} flatShading />
      </mesh>
      <Block collide={false} position={[0, 0.42, 0]} size={[0.04, 0.08, 0.04]} color="#3a5a22" />
    </group>
  );
}

/** Jack-o'-lanterns only appear in October. */
function SeasonalDecor() {
  const october = new Date().getMonth() === 9;
  if (!october) return null;
  return (
    <group>
      <Pumpkin position={[-2.0, F, -0.8]} />
      <Pumpkin position={[-2.4, F, -1.2]} scale={0.7} />
      <Pumpkin position={[-7.2, F, -3.2]} />
      <Pumpkin position={[7.2, F, -8.0]} scale={1.2} />
      <Pumpkin position={[-4.5, F, -18.9]} scale={0.8} />
      <pointLight color="#ff7a2a" intensity={2} distance={4} position={[-2.2, F + 0.4, -1]} />
    </group>
  );
}

function Desk() {
  const openOverlay = useGame((s) => s.openOverlay);
  const screen = useMemo(
    () => textTexture("amyOS", { width: 64, height: 38, color: "#5a3a7a", bg: "#e6d0ff", font: '14px "Pixelify Sans", monospace' }),
    [],
  );
  return (
    <group>
      <Block position={[0, F + 0.37, -0.7]} size={[2.8, 0.74, 0.9]} texture="darkWood" />
      {/* monitor, facing Amy */}
      <Block collide={false} position={[0.45, F + 1.05, -0.45]} size={[0.95, 0.6, 0.06]} color="#2a2238" />
      <mesh position={[0.45, F + 1.05, -0.485]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.85, 0.5]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <Block collide={false} position={[0.45, F + 0.8, -0.42]} size={[0.08, 0.14, 0.06]} color="#2a2238" />
      <Block collide={false} position={[0.45, F + 0.755, -0.85]} size={[0.6, 0.03, 0.2]} color="#3a3048" />
      {/* mug, speaker, book stack */}
      <Block collide={false} position={[0.75, F + 0.82, -0.8]} size={[0.1, 0.13, 0.1]} color="#f2e8f0" />
      <Block collide={false} position={[1.15, F + 0.88, -0.5]} size={[0.18, 0.26, 0.16]} color="#5a3a4a" />
      {[0, 1, 2].map((i) => (
        <Block key={i} collide={false} position={[-1.15, F + 0.78 + i * 0.07, -0.55]} size={[0.32, 0.06, 0.24]} color={["#e7a7d6", "#b46aa8", "#f3c6e0"][i]} />
      ))}
      <pointLight color="#c9a0ff" intensity={6} distance={6} decay={1.4} position={[0.45, F + 1.1, -1.0]} />
      {/* chair */}
      <Block position={[-0.6, F + 0.25, -1.55]} size={[0.6, 0.5, 0.6]} color="#4a2e2a" />
      <Hotspot
        id="computer"
        label="Use Amy's computer"
        position={[0.45, F + 1.05, -0.5]}
        action={() => openOverlay({ type: "computer" })}
        radius={2.4}
      />
      <Amy position={[-0.6, F + 0.05, -1.55]} />
      {/* curtains */}
      <Block collide={false} position={[-1.75, F + 1.95, -0.2]} size={[0.4, 2.3, 0.06]} color="#c87ab8" />
      <Block collide={false} position={[1.75, F + 1.95, -0.2]} size={[0.4, 2.3, 0.06]} color="#c87ab8" />
      <Block collide={false} position={[0, F + 0.98, -0.25]} size={[3.2, 0.06, 0.3]} texture="darkWood" />
      <Cat id="window-cat" position={[1.0, F + 1.01, -0.27]} variant="sit" color="black" />
    </group>
  );
}

function RecordWall() {
  const openOverlay = useGame((s) => s.openOverlay);
  return (
    <group>
      {records.slice(0, 9).map((r, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const z = -4.6 - col * 1.0;
        const y = F + 2.6 - row * 0.95;
        return (
          <group key={i}>
            <Block collide={false} position={[-7.82, y, z]} size={[0.04, 0.8, 0.8]} color={r.color} />
            <Block collide={false} position={[-7.79, y, z]} size={[0.02, 0.3, 0.3]} color="#1a1420" />
          </group>
        );
      })}
      {/* cabinet + turntable */}
      <Block position={[-7.4, F + 0.4, -5.6]} size={[0.8, 0.8, 1.8]} texture="darkWood" />
      <Block collide={false} position={[-7.4, F + 0.84, -5.6]} size={[0.6, 0.08, 0.6]} color="#3a3048" />
      <mesh position={[-7.4, F + 0.9, -5.6]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Hotspot
        id="record-wall"
        label="Browse the record wall"
        position={[-7.3, F + 1.6, -5.6]}
        action={() => openOverlay({ type: "records" })}
        radius={3.2}
      />
    </group>
  );
}

function PosterBoard() {
  const openOverlay = useGame((s) => s.openOverlay);
  const pinned = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        y: F + 1.1 + ((i * 37) % 13) / 10,
        z: -3.2 - ((i * 53) % 26) / 10,
        color: ["#fff3a8", "#ffc2d9", "#bfe8ff", "#d2f5c4", "#e6d0ff"][i % 5],
        tilt: (((i * 29) % 7) - 3) * 0.06,
      })),
    [],
  );
  return (
    <group>
      <Block collide={false} position={[7.84, F + 1.75, -4.5]} size={[0.06, 2.0, 3.4]} texture="darkWood" />
      <Block collide={false} position={[7.8, F + 1.75, -4.5]} size={[0.04, 1.8, 3.2]} texture="cork" />
      {pinned.map((n, i) => (
        <group key={i} position={[7.77, n.y, n.z]} rotation={[n.tilt, -Math.PI / 2, 0]}>
          <mesh>
            <planeGeometry args={[0.32, 0.32]} />
            <meshStandardMaterial color={n.color} />
          </mesh>
          <mesh position={[0, 0.13, 0.005]}>
            <planeGeometry args={[0.04, 0.04]} />
            <meshBasicMaterial color="#d23a5a" />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[7.76, F + 2.85 - Math.abs(Math.sin(i * 0.55)) * 0.12, -2.9 - i * 0.29]}>
          <boxGeometry args={[0.04, 0.05, 0.05]} />
          <meshBasicMaterial color={["#ffd27a", "#ff9ad0", "#bfe8ff"][i % 3]} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color="#ffc8a0" intensity={7} distance={6} decay={1.4} position={[7.0, F + 2.4, -4.5]} />
      <Hotspot
        id="poster-board"
        label="Read & leave a note"
        position={[7.4, F + 1.6, -4.5]}
        action={() => openOverlay({ type: "notes" })}
        radius={3.2}
      />
    </group>
  );
}

function Curiosities() {
  const openOverlay = useGame((s) => s.openOverlay);
  const findSecret = useGame((s) => s.findSecret);
  const owlHead = useRef<THREE.Group>(null);
  const spinUntil = useRef(0);
  const now = useRef(0);
  useFrame(({ clock }) => {
    now.current = clock.elapsedTime;
    if (!owlHead.current) return;
    const t = clock.elapsedTime;
    owlHead.current.rotation.y = t < spinUntil.current ? (spinUntil.current - t) * Math.PI * 2 : Math.sin(t * 0.4) * 0.3;
  });
  return (
    <group>
      {/* shelves */}
      {[F + 1.3, F + 2.1].map((y) => (
        <Block key={y} collide={false} position={[-7.6, y, -12.5]} size={[0.5, 0.06, 2.6]} texture="darkWood" />
      ))}
      {/* potions */}
      {[-11.6, -12.0, -12.9, -13.3].map((z, i) => (
        <Block
          key={z}
          collide={false}
          position={[-7.6, F + 1.45, z]}
          size={[0.14, 0.24, 0.14]}
          color={["#7dff9a", "#ff7ad0", "#9ad0ff", "#ffd27a"][i]}
          emissive={["#2aff60", "#ff3ab0", "#3a9aff", "#ffaa20"][i]}
          emissiveIntensity={0.7}
          transparent
          opacity={0.85}
        />
      ))}
      {/* crystal ball */}
      <mesh position={[-7.6, F + 1.52, -12.45]}>
        <icosahedronGeometry args={[0.17, 2]} />
        <meshStandardMaterial color="#b48aff" emissive="#7a3aff" emissiveIntensity={1.1} transparent opacity={0.9} flatShading />
      </mesh>
      <pointLight color="#9a6aff" intensity={2} distance={4} position={[-7.2, F + 1.6, -12.4]} />
      <Hotspot
        id="crystal-ball"
        label="Gaze into the crystal ball"
        position={[-7.5, F + 1.5, -12.45]}
        action={() => {
          playChime();
          findSecret("crystal-ball");
          openOverlay({ type: "fortune", text: fortunes[Math.floor(Math.random() * fortunes.length)] });
        }}
        radius={2.4}
      />
      {/* owl */}
      <group position={[-7.6, F + 2.13, -12.9]}>
        <Block collide={false} position={[0, 0.17, 0]} size={[0.26, 0.34, 0.24]} color="#6e4a32" />
        <group ref={owlHead} position={[0, 0.42, 0]}>
          <Block collide={false} position={[0, 0, 0]} size={[0.28, 0.2, 0.24]} color="#7e5a3e" />
          <Block collide={false} position={[0.13, 0.02, 0.05]} size={[0.02, 0.06, 0.06]} color="#ffd24a" emissive="#ffb000" emissiveIntensity={1} />
          <Block collide={false} position={[0.13, 0.02, -0.05]} size={[0.02, 0.06, 0.06]} color="#ffd24a" emissive="#ffb000" emissiveIntensity={1} />
          <Block collide={false} position={[0, 0.13, 0.08]} size={[0.06, 0.06, 0.04]} color="#5a3a26" />
          <Block collide={false} position={[0, 0.13, -0.08]} size={[0.06, 0.06, 0.04]} color="#5a3a26" />
        </group>
      </group>
      <Hotspot
        id="owl"
        label="Boop the owl"
        position={[-7.5, F + 2.4, -12.9]}
        action={() => {
          playHoot();
          findSecret("owl");
          spinUntil.current = now.current + 1;
        }}
        radius={2.6}
      />
    </group>
  );
}

function Bed() {
  return (
    <group position={[-6.5, F, -18.5]}>
      <Block position={[0, 0.25, 0]} size={[2.4, 0.5, 2.6]} texture="darkWood" />
      <Block collide={false} position={[0, 0.58, 0]} size={[2.2, 0.18, 2.4]} color="#6a4a9a" />
      <Block collide={false} position={[0, 0.68, -0.9]} size={[1.4, 0.16, 0.5]} color="#e6d0ff" />
      <Block collide={false} position={[0, 0.69, 0.4]} size={[2.24, 0.06, 1.5]} color="#b46aa8" />
    </group>
  );
}

function Plant({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Block position={[0, 0.25, 0]} size={[0.45, 0.5, 0.45]} color="#7a3a3a" />
      <mesh position={[0, 0.85, 0]}>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#3e6a5a" flatShading />
      </mesh>
    </group>
  );
}

export function Upstairs() {
  return (
    <group>
      <Block collide={false} position={[0, F + 0.01, -6]} size={[4.5, 0.01, 3.4]} texture="rug" scale={1.5} />
      <Desk />
      <RecordWall />
      <PosterBoard />
      <Curiosities />
      <Bed />
      <Plant position={[-3.2, F, -0.6]} />
      <Plant position={[3.2, F, -0.6]} />
      {/* coat rack */}
      <group position={[7.3, F, -1.0]}>
        <Block position={[0, 0.9, 0]} size={[0.08, 1.8, 0.08]} color="#3a2418" />
        <Block collide={false} position={[0, 1.55, 0.12]} size={[0.4, 0.7, 0.18]} color="#2a1e3a" />
      </group>

      <Candle position={[-0.75, F + 0.74, -0.4]} light />
      <Candle position={[-7.6, F + 2.16, -11.6]} />
      <Candle position={[7.2, F + 0.0, -12.0]} light />
      <Candle position={[-5.0, F + 0.0, -18.9]} />
      <SeasonalDecor />

      {/* soft moonlight through the window, and a dim room light */}
      <pointLight color="#6a7aff" intensity={5} distance={8} decay={1.4} position={[0, F + 2.2, 0.6]} />
      <pointLight color="#b07ae0" intensity={14} distance={18} decay={1.2} position={[0, F + 3.0, -9]} />
      <pointLight color="#ff9ad0" intensity={8} distance={12} decay={1.3} position={[-3, F + 2.8, -16]} />
    </group>
  );
}
