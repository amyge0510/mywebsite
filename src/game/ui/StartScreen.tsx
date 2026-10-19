"use client";

import { useGame } from "../store";
import { initAudio } from "../audio";
import { requestLook } from "../input";
import { site } from "@/content/site";

export function StartScreen() {
  const started = useGame((s) => s.started);
  const isTouch = useGame((s) => s.isTouch);
  const start = useGame((s) => s.start);
  if (started) return null;

  const enter = () => {
    initAudio();
    start();
    requestLook();
  };

  return (
    <div className="start" onPointerDown={(e) => e.stopPropagation()}>
      <div className="start-card">
        <p className="start-kicker">welcome to</p>
        <h1>{site.storeName}</h1>
        <p className="start-tagline">{site.tagline} · it&apos;s raining tonight</p>
        <button className="pixel-btn big" onClick={enter} autoFocus>
          step inside
        </button>
        <div className="controls-help">
          {isTouch ? (
            <>
              <span>joystick (bottom right) · walk</span>
              <span>drag · look around</span>
              <span>tap the hand button · interact</span>
            </>
          ) : (
            <>
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>↑</kbd><kbd>↓</kbd> · walk</span>
              <span><kbd>←</kbd><kbd>→</kbd> or mouse · turn &amp; look</span>
              <span><kbd>E</kbd> or click · interact</span>
              <span><kbd>Esc</kbd> · menu</span>
            </>
          )}
        </div>
        <a className="skip-link" href="/about">
          just want the content? skip the walk →
        </a>
      </div>
    </div>
  );
}
