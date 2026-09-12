import { SEED_LIBRARY } from "./seed";
import type { Library } from "./types";

const KEY = "vinyl-ps5-library-v1";

let cached: Library | null = null;
const listeners = new Set<() => void>();

function readFromDisk(): Library {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(SEED_LIBRARY);
    const parsed = JSON.parse(raw) as Library;
    if (!parsed?.profile || !Array.isArray(parsed.games)) {
      return structuredClone(SEED_LIBRARY);
    }
    return parsed;
  } catch {
    return structuredClone(SEED_LIBRARY);
  }
}

export function getLibrarySnapshot(): Library {
  if (typeof window === "undefined") return SEED_LIBRARY;
  if (!cached) cached = readFromDisk();
  return cached;
}

export function getServerLibrarySnapshot(): Library {
  return SEED_LIBRARY;
}

export function subscribeLibrary(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function writeLibrary(library: Library) {
  cached = library;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(library));
  }
  listeners.forEach((listener) => listener());
}

export function resetLibrary(): Library {
  const next = structuredClone(SEED_LIBRARY);
  writeLibrary(next);
  return next;
}
