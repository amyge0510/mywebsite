"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TOTAL_SECRETS, useGame } from "../store";
import { requestLook } from "../input";
import { playBlip } from "../audio";
import { amyDialogue, site } from "@/content/site";
import { books } from "@/content/books";
import { projects } from "@/content/projects";
import { records, type Album } from "@/content/music";
import { NotesBoard } from "./NotesBoard";

function close() {
  useGame.getState().closeOverlay();
  // Clicking a button is a user gesture, so we can grab the mouse again.
  requestAnimationFrame(requestLook);
}

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className="overlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className={`panel ${className}`} role="dialog" aria-label={title}>
        <div className="panel-bar">
          <span>{title}</span>
          <button className="panel-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

function Computer() {
  type Tab = "projects" | "about" | "links";
  const [tab, setTab] = useState<Tab>("projects");
  const icons: { id: Tab; label: string; glyph: string }[] = [
    { id: "projects", label: "projects", glyph: "📁" },
    { id: "about", label: "about me", glyph: "🌙" },
    { id: "links", label: "resume & links", glyph: "🔗" },
  ];
  return (
    <Panel title="amyOS" className="panel-wide computer">
      <div className="desktop">
        <nav className="desktop-icons">
          {icons.map((i) => (
            <button
              key={i.id}
              className={`desktop-icon ${tab === i.id ? "active" : ""}`}
              onClick={() => {
                playBlip();
                setTab(i.id);
              }}
            >
              <span className="glyph">{i.glyph}</span>
              {i.label}
            </button>
          ))}
        </nav>
        <section className="desktop-window">
          {tab === "projects" && (
            <ul className="project-list">
              {projects.map((p) => (
                <li key={p.title}>
                  <h3>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a> : p.title}</h3>
                  <p>{p.blurb}</p>
                  <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
                </li>
              ))}
            </ul>
          )}
          {tab === "about" && (
            <div className="prose">
              <p>hi, i&apos;m {site.name}. welcome to my little corner of the internet.</p>
              <p>TODO: a few lines about you: what you&apos;re into, what you&apos;re making, what you&apos;re curious about.</p>
            </div>
          )}
          {tab === "links" && (
            <ul className="link-list">
              <li>
                <a href={site.links.linkedin} target="_blank" rel="noreferrer">linkedin ↗</a>
              </li>
              <li>
                {site.links.resume ? (
                  <a href={site.links.resume} target="_blank" rel="noreferrer">resume (pdf) ↗</a>
                ) : (
                  <span className="muted">resume — coming soon</span>
                )}
              </li>
              <li>
                {site.links.email ? (
                  <a href={`mailto:${site.links.email}`}>email me ✉</a>
                ) : (
                  <span className="muted">contact form — coming soon</span>
                )}
              </li>
            </ul>
          )}
        </section>
      </div>
    </Panel>
  );
}

function BookView({ bookId }: { bookId: string }) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return null;
  return (
    <Panel title="from the stacks" className="panel-wide">
      <div className="book-spread">
        <div className="book-page book-cover" style={{ background: book.color }}>
          <h2>{book.title}</h2>
          <p>{book.author}</p>
        </div>
        <div className="book-page">
          <blockquote>“{book.excerpt}”</blockquote>
          <p className="book-note">— {book.note}</p>
        </div>
      </div>
    </Panel>
  );
}

function Records() {
  const [picked, setPicked] = useState<Album | null>(null);
  return (
    <Panel title="the record wall" className="panel-wide">
      <div className="records">
        <div className="record-grid">
          {records.map((r) => (
            <button
              key={r.title}
              className={`record ${picked === r ? "active" : ""}`}
              style={{ background: r.color }}
              onClick={() => {
                playBlip();
                setPicked(r);
              }}
              title={`${r.title} — ${r.artist}`}
            >
              <span className="record-label" />
            </button>
          ))}
        </div>
        <div className="now-playing">
          {picked ? (
            <>
              <p className="muted">now spinning</p>
              <h3>{picked.title}</h3>
              <p>{picked.artist}</p>
              {picked.spotifyId ? (
                <iframe
                  title={picked.title}
                  src={`https://open.spotify.com/embed/album/${picked.spotifyId}?theme=0`}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <p className="muted small">(spotify player shows up here once this record has an album id)</p>
              )}
            </>
          ) : (
            <p className="muted">pick a record off the wall ♪</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function AmyTalk() {
  const [line, setLine] = useState(0);
  const next = () => {
    playBlip();
    if (line + 1 >= amyDialogue.length) close();
    else setLine(line + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="overlay overlay-bottom" onPointerDown={(e) => e.stopPropagation()}>
      <div className="dialogue" onClick={next}>
        <span className="dialogue-name">{site.name}</span>
        <p>{amyDialogue[line]}</p>
        <span className="dialogue-next">{line + 1 < amyDialogue.length ? "▼" : "×"}</span>
      </div>
    </div>
  );
}

function Menu() {
  const soundOn = useGame((s) => s.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const found = useGame((s) => s.secretsFound.length);
  return (
    <Panel title="paused">
      <div className="menu">
        <button className="pixel-btn big" onClick={close}>
          keep exploring
        </button>
        <button className="pixel-btn" onClick={toggleSound}>
          sound: {soundOn ? "on" : "off"}
        </button>
        <p className="muted">
          secrets found: {found}/{TOTAL_SECRETS}
        </p>
        <a className="skip-link" href="/about">
          skip to the content →
        </a>
      </div>
    </Panel>
  );
}

export function Overlays() {
  const overlay = useGame((s) => s.overlay);
  if (!overlay) return null;
  switch (overlay.type) {
    case "computer":
      return <Computer />;
    case "book":
      return <BookView bookId={overlay.bookId} />;
    case "records":
      return <Records />;
    case "notes":
      return (
        <Panel title="amy's poster board" className="panel-wide">
          <NotesBoard />
        </Panel>
      );
    case "amy":
      return <AmyTalk />;
    case "fortune":
      return (
        <Panel title="the crystal ball says…">
          <p className="fortune">✦ {overlay.text} ✦</p>
        </Panel>
      );
    case "sign":
      return (
        <Panel title={overlay.title}>
          <p className="prose">{overlay.body}</p>
        </Panel>
      );
    case "menu":
      return <Menu />;
  }
}
