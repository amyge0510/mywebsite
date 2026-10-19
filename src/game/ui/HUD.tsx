"use client";

import { useEffect, useRef, useState } from "react";
import { TOTAL_SECRETS, useGame } from "../store";
import { input } from "../input";

const stop = (e: React.PointerEvent) => e.stopPropagation();

/** On-screen joystick in the lower-right corner (touch screens). */
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const RADIUS = 48;

  const update = (e: React.PointerEvent) => {
    const rect = base.current!.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    input.joystick.x = dx / RADIUS;
    input.joystick.y = -dy / RADIUS;
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.joystick.x = 0;
    input.joystick.y = 0;
  };

  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        e.stopPropagation();
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function SecretToast() {
  const found = useGame((s) => s.secretsFound.length);
  const [shown, setShown] = useState<number | null>(null);
  const prev = useRef(found);
  useEffect(() => {
    if (found > prev.current) {
      setShown(found);
      const t = setTimeout(() => setShown(null), 2600);
      prev.current = found;
      return () => clearTimeout(t);
    }
    prev.current = found;
  }, [found]);
  if (shown === null) return null;
  return (
    <div className="toast">
      ✦ secret found · {shown}/{TOTAL_SECRETS}
    </div>
  );
}

export function HUD() {
  const started = useGame((s) => s.started);
  const overlay = useGame((s) => s.overlay);
  const prompt = useGame((s) => s.prompt);
  const isTouch = useGame((s) => s.isTouch);
  const openOverlay = useGame((s) => s.openOverlay);
  if (!started) return null;
  const playing = overlay === null;

  return (
    <div className="hud">
      {playing && <div className={`crosshair ${prompt ? "crosshair-active" : ""}`} />}
      {playing && prompt && !isTouch && (
        <div className="prompt">
          <kbd>E</kbd> {prompt.label}
        </div>
      )}
      {playing && isTouch && (
        <>
          <Joystick />
          {prompt && (
            <button
              className="pixel-btn interact-btn"
              onPointerDown={(e) => {
                e.stopPropagation();
                input.interact = true;
              }}
            >
              ✋ {prompt.label}
            </button>
          )}
        </>
      )}
      {playing && (
        <button
          className="pixel-btn menu-btn"
          onPointerDown={stop}
          onClick={() => openOverlay({ type: "menu" })}
          aria-label="Menu"
        >
          ☰
        </button>
      )}
      <SecretToast />
    </div>
  );
}
