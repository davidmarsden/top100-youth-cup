// src/lib/utils.ts

/**
 * Small persistence helpers that are SSR-safe.
 * We no-op on the server (Netlify build) and only touch localStorage in the browser.
 */

export async function load<T>(
  key: string,
  fallback?: T // ← make optional so callers can pass just the key
): Promise<T | undefined> {
  // During build/prerender there is no window/localStorage
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return; // SSR no-op
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/JSON errors
  }
}

export async function remove(key: string): Promise<void> {
  if (typeof window === "undefined") return; // SSR no-op
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Build a namespaced key (handy when you have per-season storage).
 * Example: ns("entrants", "S26") -> "S26:entrants"
 */
export function ns(key: string, namespace?: string) {
  return namespace ? `${namespace}:${key}` : key;
}