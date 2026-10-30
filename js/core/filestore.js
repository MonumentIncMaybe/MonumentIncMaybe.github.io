/* filestore.js - XP.files: a tiny IndexedDB store for files the visitor uploads and wants to keep
 * (currently: custom desktop backgrounds). localStorage is too small for pictures.
 *
 *   await XP.files.put(file)        -> { id, name, type, size }     (file is a File / Blob)
 *   await XP.files.get(id)          -> Blob | null
 *   await XP.files.list()           -> [{ id, name, type, size, added }]
 *   await XP.files.remove(id)
 *
 * If IndexedDB is unavailable (private window, blocked) it falls back to memory, so uploads still
 * work until the page is closed. Nothing here ever leaves the browser.
 * The music player does NOT use this: its files are temporary on purpose (js/apps/wmp.js).
 */
window.XP = window.XP || {};

(function () {
  const DB = "xp-files", STORE = "files";
  const mem = new Map();
  let dbp = null;

  function db() {
    if (dbp) return dbp;
    dbp = new Promise(res => {
      try {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
        req.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
    return dbp;
  }

  const tx = (d, mode, fn) => new Promise(res => {
    try {
      const t = d.transaction(STORE, mode), r = fn(t.objectStore(STORE));
      t.oncomplete = () => res(r && "result" in r ? r.result : undefined);
      t.onerror = t.onabort = () => res(undefined);
    } catch (e) { res(undefined); }
  });

  XP.files = {
    async put(file) {
      const rec = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name || "Untitled", type: file.type || "", size: file.size || 0, added: Date.now(), blob: file };
      const d = await db();
      if (d) { await tx(d, "readwrite", s => s.put(rec)); }
      mem.set(rec.id, rec);
      return { id: rec.id, name: rec.name, type: rec.type, size: rec.size };
    },
    async get(id) {
      if (mem.has(id)) return mem.get(id).blob;
      const d = await db();
      const rec = d && await tx(d, "readonly", s => s.get(id));
      if (rec) mem.set(id, rec);
      return rec ? rec.blob : null;
    },
    async list() {
      const d = await db();
      const all = d ? ((await tx(d, "readonly", s => s.getAll())) || []) : [];
      all.forEach(r => mem.set(r.id, r));
      return [...mem.values()].sort((a, b) => a.added - b.added).map(({ blob, ...m }) => m);
    },
    async remove(id) {
      mem.delete(id);
      const d = await db();
      if (d) await tx(d, "readwrite", s => s.delete(id));
    }
  };
})();
