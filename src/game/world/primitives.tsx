"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { tex, type TextureName } from "./textures";
import { registerInteractable } from "../interactables";

type Vec3 = [number, number, number];
type Face = "px" | "nx" | "py" | "ny" | "pz" | "nz";
const FACE_ORDER: Face[] = ["px", "nx", "py", "ny", "pz", "nz"];

type Surface = { texture?: TextureName; color?: string; scale?: number; emissive?: string };

export type BlockProps = {
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  /** Default surface for every face. */
  texture?: TextureName;
  color?: string;
  /** World units per texture tile. */
  scale?: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** Per-face overrides, e.g. a brick outside face on an interior wall. */
  faces?: Partial<Record<Face, Surface>>;
  collide?: boolean;
  transparent?: boolean;
  opacity?: number;
};

function faceDims(size: Vec3, face: Face): [number, number] {
  const [x, y, z] = size;
  if (face === "px" || face === "nx") return [z, y];
  if (face === "py" || face === "ny") return [x, z];
  return [x, y];
}

function makeMaterial(s: Surface, dims: [number, number], extra: Partial<BlockProps>) {
  const scale = s.scale ?? 1;
  return new THREE.MeshStandardMaterial({
    map: s.texture ? tex(s.texture, dims[0] / scale, dims[1] / scale) : null,
    color: s.color ?? "#ffffff",
    emissive: s.emissive ?? "#000000",
    emissiveIntensity: extra.emissiveIntensity ?? 1,
    roughness: 0.9,
    metalness: 0,
    transparent: extra.transparent ?? false,
    opacity: extra.opacity ?? 1,
    depthWrite: !extra.transparent,
  });
}

/** A textured box, solid to the player unless `collide={false}`. */
export function Block(props: BlockProps) {
  const { position, size, rotation = [0, 0, 0], collide = true } = props;
  const material = useMemo(() => {
    const def: Surface = {
      texture: props.texture,
      color: props.color,
      scale: props.scale,
      emissive: props.emissive,
    };
    if (!props.faces) {
      // One material; tile by the two largest dimensions.
      const dims = [...size].sort((a, b) => b - a) as Vec3;
      return makeMaterial(def, [dims[0], dims[1]], props);
    }
    return FACE_ORDER.map((f) =>
      makeMaterial({ ...def, ...props.faces?.[f] }, faceDims(size, f), props),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(size), props.texture, props.color, props.scale, props.emissive, JSON.stringify(props.faces)]);

  const mesh = (
    <mesh material={material}>
      <boxGeometry args={size} />
    </mesh>
  );

  if (!collide) {
    return (
      <group position={position} rotation={rotation}>
        {mesh}
      </group>
    );
  }
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      {mesh}
    </RigidBody>
  );
}

/** An invisible wall. */
export function Barrier({ position, size, rotation }: { position: Vec3; size: Vec3; rotation?: Vec3 }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  );
}

/** Registers a point in the world the visitor can interact with. */
export function useInteractable(
  id: string,
  label: string,
  position: Vec3,
  action: () => void,
  radius = 2.6,
) {
  useEffect(
    () =>
      registerInteractable({
        id,
        label,
        position: new THREE.Vector3(...position),
        radius,
        action,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, label, position[0], position[1], position[2], radius],
  );
}

export function Hotspot(props: {
  id: string;
  label: string;
  position: Vec3;
  action: () => void;
  radius?: number;
}) {
  useInteractable(props.id, props.label, props.position, props.action, props.radius);
  return null;
}
