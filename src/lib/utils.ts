export const uid = () =>
  Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);

export const save = (k:string, v:any) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(k, JSON.stringify(v));
};

export const load = <T,>(k:string, fallback:T):T => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

export const makeGroupLabels = (n:number) =>
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, n).split("");