// Safe, tiny storage helpers (SSR friendly)

export async function load<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}