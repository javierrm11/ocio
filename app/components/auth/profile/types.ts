export interface CheckInHistory {
  id: string;
  venue_id: string;
  profile_id: string;
  created_at: string;
  venues: {
    id: string;
    name: string;
    avatar_path?: string;
    address?: string | null;
  };
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

export interface ScheduleDay {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  description?: string;
  avatar_path?: string | null;
  role: "user" | "venue";
  created_at: string;
  updated_at: string;
  check_ins?: any[];
  favorites?: any[];
  following?: number;
  events?: any[];
  checkInHistory?: CheckInHistory[];
  genres?: { genre: Genre; genre_id: number }[];
  plan?: string;
  points?: number;
}

export interface PointTransaction {
  id: string;
  type: "checkin_validated" | "checkout_confirmed" | "extended_stay";
  points: number;
  created_at: string;
  check_in_id: string | null;
}

export const SCHEDULE_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const DEFAULT_SCHEDULE: ScheduleDay[] = SCHEDULE_DAYS.map(day => ({ day, open: '21:00', close: '04:00', is_closed: false }));

export const POINT_TYPE_LABEL: Record<PointTransaction["type"], string> = {
  checkin_validated: "Check-in validado",
  checkout_confirmed: "Check-out confirmado",
  extended_stay: "Permanencia +1h",
};

export const POINT_TYPE_ICON: Record<PointTransaction["type"], string> = {
  checkin_validated: "📍",
  checkout_confirmed: "✅",
  extended_stay: "⏱️",
};
