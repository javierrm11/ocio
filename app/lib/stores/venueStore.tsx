import { create } from 'zustand';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  venue_id: string;
  image_path: string | null;
  description: string;
}

interface Venue {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: 'low' | 'medium' | 'high';
  description?: string;
  avatar_path?: string;
  distance?: string;
  genres?: string[];
  rating?: number;
  check_ins?: any[];
  is_favorite?: boolean;
  events?: Event[];
}



interface AppStore {
  venues: Venue[];
  userFavorites: number[];
  currentUser: any | null;
  loaded: boolean;
  setVenues: (v: Venue[]) => void;
  setUserFavorites: (ids: number[]) => void;
  setCurrentUser: (u: any | null) => void;
  setLoaded: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  venues: [],
  userFavorites: [],
  currentUser: null,
  loaded: false,
  setVenues: (venues) => set({ venues }),
  setUserFavorites: (userFavorites) => set({ userFavorites }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setLoaded: (loaded) => set({ loaded }),
}));