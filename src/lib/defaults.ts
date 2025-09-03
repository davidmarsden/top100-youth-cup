import { Settings, Entrant } from './types';
import { uid } from './utils';

export const defaultSettings: Settings = {
  season: 'S26',
  ageCutoffISO: new Date().toISOString().slice(0,10),
  timezone: 'Europe/London',
  pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
  maxGroupSize: 4,
  bestOfThirdsToFill: true,
  doubleRoundRobin: false, // default off
};

export const sampleEntrants: Entrant[] = [
  { id: uid(), manager: 'Regan Thompson', club: 'Atlético Madrid', rating: 78 },
  { id: uid(), manager: 'David Marsden', club: 'Hamburger SV', rating: 77 },
  { id: uid(), manager: 'Glen Mullan', club: 'Inter', rating: 79 },
  { id: uid(), manager: 'Freddie', club: 'Arsenal', rating: 80 },
  { id: uid(), manager: 'Ash', club: 'Juventus', rating: 75 },
  { id: uid(), manager: 'Gianluca', club: 'Roma', rating: 74 },
  { id: uid(), manager: 'Pane', club: 'River Plate', rating: 73 },
];