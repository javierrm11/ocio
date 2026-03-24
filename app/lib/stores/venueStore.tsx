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
  id: string;
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
  events: Event[];
  userLocation: { latitude: number; longitude: number } | null;
  setVenues: (v: Venue[]) => void;
  setUserFavorites: (ids: number[]) => void;
  setCurrentUser: (u: any | null) => void;
  setEvents: (events: Event[]) => void;
  setLoaded: (v: boolean) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  venues: [],
  userFavorites: [],
  currentUser: null,
  loaded: false,
  events: [],
  userLocation: null,
  setVenues: (venues) => set({ venues }),
  setUserFavorites: (userFavorites) => set({ userFavorites }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setEvents: (events) => set({ events }),
  setLoaded: (loaded) => set({ loaded }),
  setUserLocation: (userLocation) => set({ userLocation }),
}));