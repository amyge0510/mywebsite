"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { input } from "./input";
import { useGame } from "./store";
import { findFocused } from "./interactables";
import { playDoorBell, setRainLevel } from "./audio";

// Where the player is right now, readable by anything in the world (cats use
// it for purring, the shop door for swinging open).
export const playerPosition = new THREE.Vector3();
if (typeof window !== "undefined") {
  // Handy in the browser console while building the world.
  (window as unknown as { __player: THREE.Vector3 }).__player = playerPosition;
}

const WALK_SPEED = 3.0;
const TURN_SPEED = 2.0; // radians/sec for ← → arrow keys
const LOOK_SENSITIVITY = 0.0022;
const GRAVITY = 18;
const CAPSULE_HALF = 0.55;
const CAPSULE_RADIUS = 0.3;
const EYE_HEIGHT = 0.7; // above the capsule centre → ~1.55m eyes

export function Player({ spawn, spawnYaw = 0 }: { spawn: [number, number, number]; spawnYaw?: number }) {
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const { world } = useRapier();
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  const yaw = useRef(spawnYaw);
  const pitch = useRef(0);
  const vy = useRef(0);
  const bob = useRef(0);
  const lastZ = useRef(spawn[2]);

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.enableAutostep(0.3, 0.2, true);
    c.enableSnapToGround(0.35);
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    c.setMinSlopeSlideAngle((60 * Math.PI) / 180);
    controller.current = c;
    camera.rotation.order = "YXZ";
    return () => {
      world.removeCharacterController(c);
      controller.current = null;
    };
  }, [world, camera]);

  // Phones held upright get a wider view so the room doesn't feel like a keyhole.
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = aspect < 1 ? 92 : 72;
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  const move = new THREE.Vector3();
  const forward = new THREE.Vector3();

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const rb = body.current;
    const col = collider.current;
    const ctrl = controller.current;
    if (!rb || !col || !ctrl) return;

    const { overlay, started, setPrompt } = useGame.getState();
    const frozen = !started || overlay !== null;

    // Look
    if (!frozen) {
      yaw.current -= input.look.x * LOOK_SENSITIVITY;
      pitch.current -= input.look.y * LOOK_SENSITIVITY;
    }
    input.look.x = 0;
    input.look.y = 0;

    const k = input.keys;
    let fwd = 0;
    let strafe = 0;
    if (!frozen) {
      if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
      if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
      if (k.has("KeyD")) strafe += 1;
      if (k.has("KeyA")) strafe -= 1;
      if (k.has("ArrowLeft")) yaw.current += TURN_SPEED * dt;
      if (k.has("ArrowRight")) yaw.current -= TURN_SPEED * dt;
      fwd += input.joystick.y;
      strafe += input.joystick.x;
    }
    pitch.current = THREE.MathUtils.clamp(pitch.current, -1.35, 1.35);

    move.set(strafe, 0, -fwd);
    if (move.lengthSq() > 1) move.normalize();
    const speed = move.length();
    move.multiplyScalar(WALK_SPEED * dt).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw.current);

    vy.current -= GRAVITY * dt;
    move.y = vy.current * dt;

    ctrl.computeColliderMovement(col, move);
    const m = ctrl.computedMovement();
    if (ctrl.computedGrounded()) vy.current = 0;

    const p = rb.translation();
    const next = { x: p.x + m.x, y: p.y + m.y, z: p.z + m.z };
    // Safety net: if anything ever goes wrong, put the visitor back outside.
    if (next.y < -10) {
      next.x = spawn[0];
      next.y = spawn[1];
      next.z = spawn[2];
      vy.current = 0;
    }
    rb.setNextKinematicTranslation(next);

    // Gentle head bob while walking.
    bob.current += speed * dt * 9;
    const bobY = Math.sin(bob.current) * 0.035 * Math.min(speed, 1);

    camera.position.set(next.x, next.y + EYE_HEIGHT + bobY, next.z);
    camera.rotation.set(pitch.current, yaw.current, 0);
    playerPosition.set(next.x, next.y, next.z);

    // Door bell when crossing the shop threshold.
    if (Math.abs(next.x) < 1.2 && next.y < 2 && Math.sign(next.z) !== Math.sign(lastZ.current)) {
      playDoorBell();
    }
    lastZ.current = next.z;

    // Rain is loud outside, soft upstairs near the window, quiet in the shop.
    const outside = next.z > 0.2;
    const upstairs = next.y > 3;
    setRainLevel(outside ? 1 : upstairs ? 0.45 : 0.15);

    // What are we looking at?
    if (frozen) {
      input.interact = false;
      return;
    }
    camera.getWorldDirection(forward);
    const focused = findFocused(camera.position, forward);
    setPrompt(focused ? { id: focused.id, label: focused.label } : null);
    if (input.interact) {
      input.interact = false;
      focused?.action();
    }
  });

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      position={spawn}
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={collider} args={[CAPSULE_HALF, CAPSULE_RADIUS]} />
    </RigidBody>
  );
}
