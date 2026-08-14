// Lightweight `localStorage` store using `useSyncExternalStore` for auth-less demo persistence
// and instant cross-component sync via event listeners.
const STORAGE_KEY = "the-block:watchlist";

let watched = new Set<string>();
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) watched = new Set(JSON.parse(raw));
  } catch {
    // Corrupt or inaccessible storage — fall back to an empty watchlist.
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...watched]));
  } catch {
    // Falls back to in-memory state if `localStorage` is blocked or unavailable.
  }
}

export function isWatched(vehicleId: string): boolean {
  hydrate();
  return watched.has(vehicleId);
}

export function toggleWatched(vehicleId: string): void {
  hydrate();
  if (watched.has(vehicleId)) {
    watched.delete(vehicleId);
  } else {
    watched.add(vehicleId);
  }
  persist();
  listeners.forEach((listener) => listener());
}

export function subscribeWatchlist(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
