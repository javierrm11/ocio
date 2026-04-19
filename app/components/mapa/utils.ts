import L from "leaflet";
import { Event, Genre, Venue } from "./types";

export function getEventStatus(venue: Venue): "active" | "soon" | "none" {
  if (!venue.events || venue.events.length === 0) return "none";
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  for (const event of venue.events) {
    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);
    if (now >= start && now <= end) return "active";
  }
  for (const event of venue.events) {
    const start = new Date(event.starts_at);
    if (start > now && start <= in24h) return "soon";
  }
  return "none";
}

export function getActiveOrSoonEvent(venue: Venue): Event | null {
  if (!venue.events || venue.events.length === 0) return null;
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  for (const event of venue.events) {
    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);
    if (now >= start && now <= end) return event;
  }
  for (const event of venue.events) {
    const start = new Date(event.starts_at);
    if (start > now && start <= in24h) return event;
  }
  return null;
}

export function formatEventTime(event: Event): string {
  const now = new Date();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  if (now >= start && now <= end) {
    return `Activo hasta las ${end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const startTime = start.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours === 0) return `Empieza en ${diffMins}min`;
  return `Empieza a las ${startTime} (en ${diffHours}h)`;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function parseDistanceToKm(distance?: string): number {
  if (!distance) return Number.POSITIVE_INFINITY;
  const normalized = distance.toLowerCase().trim();
  const value = parseFloat(normalized);
  if (Number.isNaN(value)) return Number.POSITIVE_INFINITY;
  if (normalized.endsWith("km")) return value;
  if (normalized.endsWith("m")) return value / 1000;
  return value;
}

export const HEAT_BAR_WIDTH_CLASSES = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full",
];

export function getHeatStep(checkins: number): number {
  return Math.min(checkins, 10);
}

export function getHeatCategory(checkins: number): "tranquilo" | "animado" | "muy_animado" | "lleno" {
  if (checkins <= 3) return "tranquilo";
  if (checkins <= 6) return "animado";
  if (checkins <= 9) return "muy_animado";
  return "lleno";
}

export function getHeatLabel(checkins: number): string {
  const cat = getHeatCategory(getHeatStep(checkins));
  if (cat === "tranquilo") return "Tranquilo";
  if (cat === "animado") return "Animado";
  if (cat === "muy_animado") return "Muy animado";
  return "Lleno";
}

export function getHeatGradient(checkins: number): string {
  if (checkins === 0) return "from-emerald-400 via-lime-400 to-green-500";
  if (checkins < 5) return "from-yellow-400 via-orange-400 to-amber-500";
  return "from-orange-500 via-red-500 to-rose-500";
}

export function getMarkerRadius(
  checkins: number,
  maxReference: number,
  eventStatus: "active" | "soon" | "none",
): number {
  const minRadius = 7;
  const maxRadius = 16;
  const normalized = Math.min(checkins / maxReference, 1);
  const baseRadius = minRadius + normalized * (maxRadius - minRadius);
  const eventBoost =
    eventStatus === "active" ? 2 : eventStatus === "soon" ? 1 : 0;
  return Number((baseRadius + eventBoost).toFixed(1));
}

export function createVenueIcon(
  avatarPath: string | null,
  checkins: number,
  eventStatus: "active" | "soon" | "none",
  premium = false,
): L.DivIcon {
  const cat = getHeatCategory(getHeatStep(checkins));

  const bg =
    eventStatus === "active"
      ? "linear-gradient(135deg,#8B5CF6,#6d28d9)"
      : eventStatus === "soon"
        ? "linear-gradient(135deg,#FF8A00,#ea580c)"
        : cat === "lleno"
          ? "linear-gradient(135deg,#dc2626,#b91c1c)"
          : cat === "muy_animado"
            ? "linear-gradient(135deg,#ef4444,#dc2626)"
            : cat === "animado"
              ? "linear-gradient(135deg,#f59e0b,#d97706)"
              : "linear-gradient(135deg,#10b981,#059669)";

  const baseGlow =
    eventStatus === "active"
      ? "rgba(139,92,246,0.65)"
      : eventStatus === "soon"
        ? "rgba(255,138,0,0.65)"
        : cat === "lleno"
          ? "rgba(185,28,28,0.75)"
          : cat === "muy_animado"
            ? "rgba(239,68,68,0.65)"
            : cat === "animado"
              ? "rgba(245,158,11,0.60)"
              : "rgba(16,185,129,0.55)";

  const glow = premium ? "rgba(251,191,36,0.85)" : baseGlow;

  const tip =
    eventStatus === "active"
      ? "#6d28d9"
      : eventStatus === "soon"
        ? "#ea580c"
        : cat === "lleno"
          ? "#b91c1c"
          : cat === "muy_animado"
            ? "#dc2626"
            : cat === "animado"
              ? "#d97706"
            : "#059669";

  const size = Math.max(38, Math.min(54, 38 + checkins * 2)) + (premium ? 14 : 0);
  const border = premium
    ? "5px solid #fbbf24; outline: 2px solid rgba(251,191,36,0.4); outline-offset: 2px;"
    : "4.5px solid rgba(255,255,255,0.22)";

  const crownBadge = premium
    ? `<div style="
        position:absolute;top:-6px;right:-4px;
        width:18px;height:18px;border-radius:50%;
        background:linear-gradient(135deg,#f59e0b,#fbbf24);
        border:1.5px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;line-height:1;
        box-shadow:0 2px 6px rgba(251,191,36,0.7);
      ">👑</div>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 6px 20px ${glow});">
      <div style="position:relative;">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${bg};
          border:${border};
          display:flex;align-items:center;justify-content:center;
          ${premium ? "box-shadow:0 0 0 3px rgba(251,191,36,0.25);" : ""}
        ">
          <img src="${avatarPath || null}" alt="" role="presentation" style="width:100%;height:100%;object-fit:cover;border-radius:50%;filter:brightness(0.9);" />
        </div>
        ${crownBadge}
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${premium ? "#fbbf24" : tip};"></div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size + 8] as L.PointExpression,
    iconAnchor: [size / 2, size + 8] as L.PointExpression,
    tooltipAnchor: [size / 2 - 4, -(size / 2 + 4)] as L.PointExpression,
  });
}

export function getGenreName(g: Genre): string { return g.genre?.name ?? g.name ?? ""; }
export function getGenreEmoji(g: Genre): string { return g.genre?.emoji ?? g.emoji ?? "🎵"; }

export function getMadridHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
}

export function isVenueOpen(venue: Venue): boolean {
  if (venue.events) {
    const now = new Date();
    for (const event of venue.events) {
      if (now >= new Date(event.starts_at) && now <= new Date(event.ends_at)) return true;
    }
  }

  if (!venue.schedule || venue.schedule.length === 0) return false;

  const now = new Date();
  const madridNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const todayName = dayNames[madridNow.getDay()];
  const today = venue.schedule.find((d) => d.day === todayName);

  if (!today || today.is_closed) return false;

  const parseTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const cur = madridNow.getHours() * 60 + madridNow.getMinutes();
  const op = parseTime(today.open);
  const cl = parseTime(today.close);

  return cl < op ? cur >= op || cur < cl : cur >= op && cur < cl;
}
