"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Barrier, Block, Hotspot } from "./primitives";
import { textTexture } from "./textures";
import { playerPosition } from "../Player";
import { useGame } from "../store";
import { playChime } from "../audio";
import { site } from "@/content/site";

type Vec3 = [number, number, number];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A neighbouring building with a scatter of lit and dark windows. */
function Neighbor({
  x,
  z,
  width,
  depth,
  height,
  facing,
  seed,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  facing: 1 | -1;
  seed: number;
}) {
  const windows = useMemo(() => {
    const r = seeded(seed);
    const out: { pos: Vec3; lit: boolean }[] = [];
    const faceZ = z + (facing * depth) / 2 + facing * 0.03;
    for (let wx = x - width / 2 + 1.2; wx < x + width / 2 - 0.8; wx += 2.2) {
      for (let wy = 1.8; wy < height - 1; wy += 2.6) {
        out.push({ pos: [wx, wy, faceZ], lit: r() > 0.45 });
      }
    }
    return out;
  }, [x, z, width, depth, height, facing, seed]);
  return (
    <group>
      <Block position={[x, height / 2, z]} size={[width, height, depth]} texture="brick" scale={2} />
      {windows.map((w, i) => (
        <Block
          key={i}
          collide={false}
          position={w.pos}
          size={[1, 1.4, 0.04]}
          color={w.lit ? "#ffcf86" : "#1c1a2e"}
          emissive={w.lit ? "#ff9d3c" : "#000000"}
          emissiveIntensity={w.lit ? 0.9 : 0}
        />
      ))}
    </group>
  );
}

/** Falling rain, drawn as short streaks that wrap around the street. */
function Rain({ count = 1400 }: { count?: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const area = { x: [-14, 14], y: [0, 14], z: [0.4, 18] };
  const positions = useMemo(() => {
    const p = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const x = area.x[0] + Math.random() * (area.x[1] - area.x[0]);
      const y = area.y[0] + Math.random() * (area.y[1] - area.y[0]);
      const z = area.z[0] + Math.random() * (area.z[1] - area.z[0]);
      p.set([x, y, z, x, y - 0.35, z], i * 6);
    }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  useFrame((_, dt) => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array as Float32Array;
    const fall = 11 * Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      arr[o + 1] -= fall;
      arr[o + 4] -= fall;
      if (arr[o + 4] < 0) {
        const y = area.y[1] + Math.random() * 2;
        arr[o + 1] = y;
        arr[o + 4] = y - 0.35;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#8fa0d8" transparent opacity={0.35} />
    </lineSegments>
  );
}

/** The shop door swings open as you approach. */
function Door() {
  const hinge = useRef<THREE.Group>(null);
  const openSign = useMemo(
    () => textTexture("OPEN", { width: 48, height: 18, color: "#ffdf9e", bg: "#3a1e14" }),
    [],
  );
  const doorCenter = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useFrame((_, dt) => {
    if (!hinge.current) return;
    const near = playerPosition.distanceTo(doorCenter) < 3.2;
    const target = near ? 1.7 : 0;
    hinge.current.rotation.y = THREE.MathUtils.damp(hinge.current.rotation.y, target, 4, dt);
  });
  return (
    <group ref={hinge} position={[-0.8, 0, 0]}>
      <Block collide={false} position={[0.8, 1.25, 0]} size={[1.58, 2.5, 0.08]} texture="darkWood" />
      <Block
        collide={false}
        position={[0.8, 1.55, 0]}
        size={[1.0, 1.0, 0.09]}
        color="#ffd9a0"
        emissive="#ffa040"
        emissiveIntensity={0.35}
      />
      <mesh position={[0.8, 1.85, 0.06]}>
        <planeGeometry args={[0.5, 0.19]} />
        <meshBasicMaterial map={openSign} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Lantern({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Block collide={false} position={[0, 0.35, 0]} size={[0.03, 0.4, 0.03]} color="#222" />
      <Block collide={false} position={[0, 0, 0]} size={[0.28, 0.36, 0.28]} color="#ffb060" emissive="#ff8a2a" emissiveIntensity={1.6} />
      <pointLight color="#ffab5c" intensity={6} distance={9} decay={1.6} position={[0, -0.2, 0.3]} />
    </group>
  );
}

export function Street() {
  const openOverlay = useGame((s) => s.openOverlay);
  const findSecret = useGame((s) => s.findSecret);
  const sign = useMemo(
    () =>
      textTexture(site.storeName, {
        width: 192,
        height: 24,
        color: "#f4d27a",
        bg: "#1f4a3a",
      }),
    [],
  );

  return (
    <group>
      <Stars radius={90} depth={20} count={1500} factor={3} fade speed={0.4} />
      {/* moon */}
      <mesh position={[24, 34, -70]}>
        <circleGeometry args={[3.2, 12]} />
        <meshBasicMaterial color="#fff2c8" toneMapped={false} />
      </mesh>

      {/* Street + sidewalk */}
      <Block position={[0, -0.1, 10.15]} size={[60, 0.2, 20]} texture="cobble" scale={1.6} />
      <Block position={[0, -0.08, 1.65]} size={[24, 0.2, 3]} texture="cobble" scale={0.9} color="#a7a3b5" collide={false} />

      {/* Neighbours either side, and across the street */}
      <Neighbor x={-14.2} z={-6} width={12} depth={12} height={9} facing={1} seed={3} />
      <Neighbor x={14.2} z={-6} width={12} depth={12} height={10.5} facing={1} seed={7} />
      <Neighbor x={-12} z={21} width={16} depth={6} height={11} facing={-1} seed={11} />
      <Neighbor x={6} z={21} width={20} depth={6} height={9.5} facing={-1} seed={19} />

      {/* Keep visitors on the block */}
      <Barrier position={[-13, 2, 9]} size={[0.5, 4, 18]} />
      <Barrier position={[13, 2, 9]} size={[0.5, 4, 18]} />
      <Barrier position={[0, 2, 17.5]} size={[26, 4, 0.5]} />

      {/* Awning and sign */}
      <Block collide={false} position={[0, 3.75, 0.8]} size={[16.2, 0.12, 1.7]} rotation={[0.32, 0, 0]} texture="awning" scale={0.6} emissive="#0e2a20" />
      <Block collide={false} position={[0, 3.3, 1.6]} size={[16.2, 0.3, 0.05]} texture="awning" scale={0.6} />
      <mesh position={[0, 4.45, 0.17]}>
        <planeGeometry args={[5.6, 0.7]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <Lantern position={[-4.2, 2.9, 1.2]} />
      <Lantern position={[4.2, 2.9, 1.2]} />

      <Door />

      {/* Street lamp */}
      <group position={[-8.5, 0, 4.2]}>
        <Block position={[0, 1.9, 0]} size={[0.14, 3.8, 0.14]} color="#1d1d24" />
        <Block collide={false} position={[0, 3.95, 0]} size={[0.45, 0.4, 0.45]} color="#ffe0a0" emissive="#ffb050" emissiveIntensity={2} />
        <pointLight color="#ffc070" intensity={10} distance={14} decay={1.5} position={[0, 3.6, 0]} />
      </group>

      {/* Bistro table and stools by the door */}
      <group position={[3.6, 0, 1.7]}>
        <Block position={[0, 0.75, 0]} size={[0.8, 0.05, 0.8]} texture="darkWood" />
        <Block collide={false} position={[0, 0.37, 0]} size={[0.08, 0.74, 0.08]} color="#222" />
        <Block position={[-0.8, 0.35, 0]} size={[0.4, 0.7, 0.4]} texture="darkWood" />
        <Block position={[0.8, 0.35, 0]} size={[0.4, 0.7, 0.4]} texture="darkWood" />
        <Block collide={false} position={[0.1, 0.82, 0.1]} size={[0.1, 0.1, 0.1]} color="#e8e0d0" />
      </group>

      {/* Planters */}
      {[-6.8, -3.2].map((x) => (
        <group key={x} position={[x, 0, 1.2]}>
          <Block position={[0, 0.3, 0]} size={[0.7, 0.6, 0.7]} color="#3d4a3a" />
          <mesh position={[0, 0.95, 0]}>
            <icosahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color="#4f7a3a" flatShading />
          </mesh>
        </group>
      ))}

      {/* Vending machine — an easter egg */}
      <group position={[7.0, 0, 1.0]}>
        <Block position={[0, 1.1, 0]} size={[1.1, 2.2, 0.9]} color="#4b5466" />
        <Block collide={false} position={[0, 1.3, 0.46]} size={[0.8, 1.3, 0.02]} color="#bfe8ff" emissive="#5fb8ff" emissiveIntensity={0.7} />
        <pointLight color="#8fd0ff" intensity={2} distance={4} position={[0, 1.4, 0.9]} />
      </group>
      <Hotspot
        id="vending"
        label="Use the vending machine"
        position={[7.0, 1.3, 1.5]}
        action={() => {
          playChime();
          findSecret("vending");
          openOverlay({
            type: "sign",
            title: "*clunk*",
            body: "A can of Moonlight Soda rolls out. It's cold, a little fizzy, and somehow tastes like rain.",
          });
        }}
      />

      <Rain />
    </group>
  );
}
