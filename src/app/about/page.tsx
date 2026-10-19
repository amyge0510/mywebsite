import type { Metadata } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { books } from "@/content/books";
import { records } from "@/content/music";

export const metadata: Metadata = {
  title: "Amy's Bookstore — the quick version",
};

// The "skip the walk" page: everything from the world, as a plain page.
export default function About() {
  return (
    <main className="plain">
      <a className="skip-link" href="/">
        ← back to the bookstore
      </a>
      <h1>{site.storeName}</h1>
      <p className="muted">the quick version, no walking required.</p>

      <section>
        <h2>projects</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.title}>
              <strong>{p.url ? <a href={p.url}>{p.title}</a> : p.title}</strong> — {p.blurb}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>reading</h2>
        <ul>
          {books.map((b) => (
            <li key={b.id}>
              <strong>{b.title}</strong> by {b.author} — {b.note}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>listening</h2>
        <ul>
          {records.map((r) => (
            <li key={r.title}>
              {r.title} — {r.artist}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>find me</h2>
        <ul>
          <li>
            <a href={site.links.linkedin}>linkedin</a>
          </li>
          {site.links.resume && (
            <li>
              <a href={site.links.resume}>resume</a>
            </li>
          )}
          {site.links.email && (
            <li>
              <a href={`mailto:${site.links.email}`}>email</a>
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
