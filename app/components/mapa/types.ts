export interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  venue_id: string;
  image_path: string | null;
  description: string;
}

export interface Genre {
  genre?: any;
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

export interface Venue {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: "low" | "medium" | "high";
  description?: string;
  avatar_path?: string;
  distance?: string;
  genres?: Genre[];
  rating?: number;
  check_ins?: any[];
  is_favorite?: boolean;
  events?: Event[];
  plan?: string;
}
