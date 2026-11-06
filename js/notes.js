/* Bulletin-board storage.
   - If SITE.supabaseUrl + SITE.supabaseAnonKey are set, notes are shared
     between all visitors through a Supabase table called `notes`.
   - Otherwise they live in this browser's localStorage. */
window.NotesStore = (() => {
  const LS_KEY = "room-notes-v1";
  const SEED = [
    { id: "seed-2", name: "me", topic: "project idea", message: "what should I build next? tell me here!", created_at: "2026-01-02T00:00:00Z" }
  ];
  let client = null, loading = null;

  function cfg() { return window.SITE || {}; }
  function remote() { return !!(cfg().supabaseUrl && cfg().supabaseAnonKey); }

  function loadClient() {
    if (client) return Promise.resolve(client);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.onload = () => { client = window.supabase.createClient(cfg().supabaseUrl, cfg().supabaseAnonKey); resolve(client); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return loading;
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      // the old "grab a coffee" welcome note was retired along with the coffee station
      return raw ? JSON.parse(raw).filter((n) => n.id !== "seed-1") : SEED.slice();
    } catch (e) { return SEED.slice(); }
  }
  function writeLocal(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
  }

  async function list(limit = 40) {
    if (remote()) {
      try {
        const c = await loadClient();
        const { data, error } = await c.from("notes")
          .select("id,name,topic,message,created_at")
          .order("created_at", { ascending: false }).limit(limit);
        if (error) throw error;
        return data;
      } catch (e) { console.warn("notes: falling back to local", e); }
    }
    return readLocal().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  }

  async function add({ name, topic, message }) {
    const note = {
      name: (name || "anonymous").trim().slice(0, 24) || "anonymous",
      topic: (topic || "hello").slice(0, 24),
      message: (message || "").trim().slice(0, 140)
    };
    if (!note.message) throw new Error("empty note");
    if (remote()) {
      const c = await loadClient();
      const { data, error } = await c.from("notes").insert(note).select().single();
      if (error) throw error;
      return data;
    }
    const full = { ...note, id: "local-" + Date.now(), created_at: new Date().toISOString() };
    const all = readLocal(); all.push(full); writeLocal(all);
    return full;
  }

  return { list, add, isShared: remote };
})();
