'use client';

import React, { createContext, useContext, useMemo } from 'react';

type SeasonContextValue = { season: string };

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined);

export function SeasonProvider({
  season,
  children,
}: {
  season: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ season }), [season]);
  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used within a SeasonProvider');
  return ctx;
}

export default SeasonContext;