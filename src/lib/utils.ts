// src/lib/utils.ts

// Narrow, SSR-safe guard
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Load a value from localStorage (browser only).
 * Returns the parsed value or the provided fallback (default null).
 */
export async function load<T>(key: string, fallback: T | null = null): Promise<T | null> {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save a value to localStorage (browser only).
 */
export async function save<T>(key: string, value: T): Promise<void> {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/serialization errors
  }
}

/**
 * Remove a key from localStorage (browser only).
 */
export function clear(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}