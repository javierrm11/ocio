import { create } from 'zustand';

export interface StoryGroup {
  venue_id: string;
  venue_name: string;
  venue_avatar?: string;
  stories: {
    id?: string;
    venue_id: string;
    media_type: string;
    media_path: string;
    created_at: string;
    expires_at: string;
    venues: { name: string; avatar_path?: string };
  }[];
}

interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  venue_id: string;
  image_path: string | null;
  description: string;
  genres?: Genre[];
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
  rating?: number;
  check_ins?: any[];
  is_favorite?: boolean;
  events?: Event[];
  genres?: Genre[];
  plan?: string;
}



interface AppStore {
  venues: Venue[];
  userFavorites: number[];
  currentUser: any | null;
  loaded: boolean;
  events: Event[];
  storyGroups: StoryGroup[];
  userLocation: { latitude: number; longitude: number } | null;
  locationDenied: boolean;
  mapFlyTarget: { lat: number; lng: number; venueId: string } | null;
  showFilters: boolean;
  hasActiveFilters: boolean;
  setVenues: (v: Venue[]) => void;
  setUserFavorites: (ids: number[]) => void;
  setCurrentUser: (u: any | null) => void;
  setEvents: (events: Event[]) => void;
  setLoaded: (v: boolean) => void;
  setStoryGroups: (groups: StoryGroup[]) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  setLocationDenied: (denied: boolean) => void;
  setMapFlyTarget: (target: { lat: number; lng: number; venueId: string } | null) => void;
  setShowFilters: (v: boolean) => void;
  setHasActiveFilters: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  venues: [],
  userFavorites: [],
  currentUser: null,
  loaded: false,
  events: [],
  storyGroups: [],
  userLocation: null,
  locationDenied: false,
  mapFlyTarget: null,
  showFilters: false,
  hasActiveFilters: false,
  setVenues: (venues) => set({ venues }),
  setUserFavorites: (userFavorites) => set({ userFavorites }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setEvents: (events) => set({ events }),
  setLoaded: (loaded) => set({ loaded }),
  setStoryGroups: (storyGroups) => set({ storyGroups }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setLocationDenied: (locationDenied) => set({ locationDenied }),
  setMapFlyTarget: (mapFlyTarget) => set({ mapFlyTarget }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setHasActiveFilters: (hasActiveFilters) => set({ hasActiveFilters }),
}));