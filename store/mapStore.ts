'use client';

import { create } from 'zustand';

export interface ListingFilters {
  minScore: number;
  maxPrice: number;
  minAcres: number;
  state: string;
  ownerFinance: boolean;
  noHoa: boolean;
  hasWater: boolean;
  hasTrees: boolean;
  driveTimeCity: string;
  driveTimeHours: number;
  driveTimeLat: number | null;
  driveTimeLng: number | null;
}

export const DEFAULT_FILTERS: ListingFilters = {
  minScore: 0,
  maxPrice: 35000,
  minAcres: 1,
  state: '',
  ownerFinance: false,
  noHoa: false,
  hasWater: false,
  hasTrees: false,
  driveTimeCity: '',
  driveTimeHours: 2,
  driveTimeLat: null,
  driveTimeLng: null,
};

interface MapState {
  filters: ListingFilters;
  selectedId: string | null;
  bbox: [number, number, number, number] | null;
  listOpen: boolean;
  setFilters: (partial: Partial<ListingFilters>) => void;
  resetFilters: () => void;
  setSelectedId: (id: string | null) => void;
  setBbox: (bbox: [number, number, number, number] | null) => void;
  setListOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  filters: DEFAULT_FILTERS,
  selectedId: null,
  bbox: null,
  listOpen: false,
  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setSelectedId: (id) => set({ selectedId: id }),
  setBbox: (bbox) => set({ bbox }),
  setListOpen: (open) => set({ listOpen: open }),
}));
