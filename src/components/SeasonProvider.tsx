'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Season = { id: string; code: string; age_cutoff?: string; timezone?: string };

type Ctx = {
  code: string;                // e.g., "S26"
  season: Season | null;       // full row if you need more fields
  refresh: () => void;         // refetch
  loading: boolean;
  error: string | null;
};

// default shows a sensible placeholder (so pages render immediately)
const SeasonCtx = createContext<Ctx>({
  code: 'S26',
  season: null,
  refresh: () => {},
  loading: false,
  error: null,
});

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchSeason = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/seasons/current', { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setSeason(j.season ?? null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load season');
      setSeason(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeason();
  }, []);

  const value: Ctx = {
    code: season?.code ?? 'S26',
    season,
    refresh: fetchSeason,
    loading,
    error,
  };

  return <SeasonCtx.Provider value={value}>{children}</SeasonCtx.Provider>;
}

export function useSeason(): string {
  return useContext(SeasonCtx).code;
}

export function useSeasonDetails() {
  return useContext(SeasonCtx);
}