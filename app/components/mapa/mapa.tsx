"use client";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import "leaflet/dist/leaflet.css";
import { getToken } from "@/lib/hooks/getToken";
import { isPremium } from "@/lib/hooks/plan";

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
interface Genre {
  genre?: any; // Para compatibilidad con venues que tienen un array de { genre: {...} }
  id: number;
  name: string;
  slug: string;
  emoji: string;
}
interface Venue {
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

function getEventStatus(venue: Venue): "active" | "soon" | "none" {
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

function getActiveOrSoonEvent(venue: Venue): Event | null {
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

function formatEventTime(event: Event): string {
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

function getDistanceKm(
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

function parseDistanceToKm(distance?: string): number {
  if (!distance) return Number.POSITIVE_INFINITY;

  const normalized = distance.toLowerCase().trim();
  const value = parseFloat(normalized);

  if (Number.isNaN(value)) return Number.POSITIVE_INFINITY;
  if (normalized.endsWith("km")) return value;
  if (normalized.endsWith("m")) return value / 1000;
  return value;
}

const HEAT_BAR_WIDTH_CLASSES = [
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

function getHeatStep(checkins: number): number {
  return Math.min(checkins, 10);
}

function getHeatCategory(checkins: number): "tranquilo" | "animado" | "muy_animado" | "lleno" {
  if (checkins <= 3) return "tranquilo";
  if (checkins <= 6) return "animado";
  if (checkins <= 9) return "muy_animado";
  return "lleno";
}

function getHeatLabel(checkins: number): string {
  const cat = getHeatCategory(getHeatStep(checkins));
  if (cat === "tranquilo") return "Tranquilo";
  if (cat === "animado") return "Animado";
  if (cat === "muy_animado") return "Muy animado";
  return "Lleno";
}

function getHeatGradient(checkins: number): string {
  if (checkins === 0) return "from-emerald-400 via-lime-400 to-green-500";
  if (checkins < 5) return "from-yellow-400 via-orange-400 to-amber-500";
  return "from-orange-500 via-red-500 to-rose-500";
}

function getMarkerRadius(
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

function createVenueIcon(
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

  // Premio: anillo dorado exterior + tamaño ligeramente mayor
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
          <img src="${avatarPath || "https://via.placeholder.com/40?text=?"}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;filter:brightness(0.9);" />
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

function MyMap() {
  const router = useRouter();
  const {
    venues,
    setVenues,
    userFavorites,
    setUserFavorites,
    currentUser,
    loaded,
    userLocation,
    setUserLocation,
  } = useAppStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filters, setFilters] = useState({
    maxDistance: null as number | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [generosSeleccionados, setGenerosSeleccionados] = useState<Set<string>>(new Set());
  const [ambientesSeleccionados, setAmbientesSeleccionados] = useState<Set<string>>(new Set());
  const currentProfileId = currentUser?.id;

  const getGenreName = (g: Genre): string => g.genre?.name ?? g.name ?? "";
  const getGenreEmoji = (g: Genre): string => g.genre?.emoji ?? g.emoji ?? "🎵";

  const generosDisponibles = useMemo(() => {
    const all = venues.flatMap((v) =>
      v.genres?.map((g) => ({
        name: getGenreName(g),
        emoji: getGenreEmoji(g),
      })) || []
    );
    const seen = new Set<string>();
    return all.filter(({ name }) => {
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [venues]);

  const hasActiveFilters =
    filters.maxDistance !== null || ambientesSeleccionados.size > 0 || generosSeleccionados.size > 0;

  const venuesRef = useRef(venues);
  useEffect(() => {
    venuesRef.current = venues;
  }, [venues]);

  const handleVenueClick = (venue: Venue) => setSelectedVenue(venue);
  const closeModal = () => setSelectedVenue(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setVenues(
          venuesRef.current.map((v) => ({
            ...v,
            distance: getDistanceKm(
              latitude,
              longitude,
              v.latitude,
              v.longitude,
            ),
          })),
        );
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setVenues]);

  const onCheckIn = (venueId: any) => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ venue_id: venueId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const createdCheckIn = Array.isArray(data?.data)
          ? data.data[0]
          : data?.data;
        if (!createdCheckIn) return;

        // Elimina cualquier check-in previo del mismo usuario antes de añadir el nuevo
        const addCheckIn = (list: any[]) => [
          ...list.filter(
            (c: any) =>
              c.id !== createdCheckIn.id &&
              !(currentProfileId && c.profile_id === currentProfileId),
          ),
          createdCheckIn,
        ];

        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId
            ? { ...v, check_ins: addCheckIn(v.check_ins || []) }
            : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);
        setSelectedVenue((prev) =>
          prev && prev.id === venueId
            ? { ...prev, check_ins: addCheckIn(prev.check_ins || []) }
            : prev,
        );
      });
  };

  const onCheckOut = (venueId: any) => {
    // Busca el check-in activo del usuario actual en este venue
    const myCheckIn = venuesRef.current
      .find((v) => v.id === venueId)
      ?.check_ins?.find((c: any) => c.profile_id === currentProfileId);

    if (!myCheckIn) return;
    const token = getToken();

    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${myCheckIn.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: false }),
    })
      .then((res) => res.json())
      .then(() => {
        // Elimina del estado local (la API lo guarda como histórico con active:false)
        const removeCheckIn = (list: any[]) =>
          list.filter((c: any) => c.id !== myCheckIn.id);

        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId
            ? { ...v, check_ins: removeCheckIn(v.check_ins || []) }
            : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);
        setSelectedVenue((prev) =>
          prev && prev.id === venueId
            ? { ...prev, check_ins: removeCheckIn(prev.check_ins || []) }
            : prev,
        );
      });
  };

  const toggleFavorite = (venueId: any, isFavorite: boolean) => {
    const token = getToken();
    if (isFavorite) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setVenues(
          venues.map((v) =>
            v.id === venueId ? { ...v, is_favorite: false } : v,
          ),
        );
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, is_favorite: false });
        setUserFavorites(userFavorites.filter((id) => id !== venueId));
      });
    } else {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ venue_id: venueId }),
      }).then(() => {
        setVenues(
          venues.map((v) =>
            v.id === venueId ? { ...v, is_favorite: true } : v,
          ),
        );
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, is_favorite: true });
        setUserFavorites([...userFavorites, venueId]);
      });
    }
  };

  const isUserProfile =
    currentUser?.username !== undefined && currentUser?.username !== null;

  const getMadridHour = () =>
    parseInt(
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
      10,
    );

  const [isNight, setIsNight] = useState(() => {
    const h = getMadridHour();
    return h >= 21 || h < 7;
  });

  useEffect(() => {
    const check = () => {
      const h = getMadridHour();
      setIsNight(h >= 21 || h < 7);
    };
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  const filteredVenues = venues.filter((v) => {
    const dist = parseDistanceToKm(v.distance);
    if (filters.maxDistance !== null && dist > filters.maxDistance)
      return false;

    if (ambientesSeleccionados.size > 0) {
      const checkins = v.check_ins?.length || 0;
      const nivel = getHeatCategory(getHeatStep(checkins));
      if (!ambientesSeleccionados.has(nivel)) return false;
    }

    if (generosSeleccionados.size > 0 && !v.genres?.some((g) => generosSeleccionados.has(getGenreName(g))))
      return false;

    return true;
  });

  const selectedCheckins = selectedVenue?.check_ins?.length || 0;
  const maxCheckinsReference = Math.max(
    10,
    ...venues.map((v) => v.check_ins?.length || 0),
  );
  const selectedHeatStep = getHeatStep(selectedCheckins);
  const selectedHeatCategory = getHeatCategory(selectedHeatStep);
  const selectedHeatLabel = getHeatLabel(selectedHeatStep);
  const selectedHeatGradient = getHeatGradient(selectedCheckins);
  const heatState =
    selectedHeatCategory === "tranquilo" ? "cool"
    : selectedHeatCategory === "animado" ? "warm"
    : selectedHeatCategory === "muy_animado" ? "hot"
    : "full";
  const hasUserActiveCheckIn = Boolean(
    selectedVenue?.check_ins?.some(
      (c: any) =>
        c.active && (!currentProfileId || c.profile_id === currentProfileId),
    ),
  );

  if (!loaded) {
    return (
      <div className="fixed inset-0 bg-ozio-dark flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-ozio-blue"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-ozio-blue to-ozio-purple rounded-full opacity-50"></div>
          </div>
        </div>
        <p className="text-white text-lg font-semibold mt-6 animate-pulse">
          Cargando mapa...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ─── MAPA ─── */}
      <div className="fixed inset-0 md:right-0 md:left-0">
        <MapContainer
          center={
            userLocation
              ? [userLocation.latitude, userLocation.longitude]
              : [37.8787857, -4.766206]
          }
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            key={isNight ? "night" : "day"}
            url={
              isNight
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={
              isNight
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : "© OpenStreetMap contributors"
            }
          />
          {userLocation && (
            <CircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={8}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#60a5fa",
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                📍 Tu ubicación
              </Tooltip>
            </CircleMarker>
          )}

          {filteredVenues.map((venue) => {
            const eventStatus = getEventStatus(venue);
            const checkinsCount = venue.check_ins?.length || 0;
            return (
              <Marker
                key={`${venue.id}-${checkinsCount}`}
                position={[venue.latitude, venue.longitude] as [number, number]}
                icon={createVenueIcon(
                  venue.avatar_path || null,
                  checkinsCount,
                  eventStatus,
                  isPremium(venue),
                )}
                eventHandlers={{ click: () => handleVenueClick(venue) }}
              >
                <Tooltip direction="top" opacity={1} className="venue-tooltip">
                  <p className="vt-name">{venue.name}</p>
                  {eventStatus === "active" && (
                    <p className="vt-event vt-event--active">
                      🎉 Evento en curso
                    </p>
                  )}
                  {eventStatus === "soon" && (
                    <p className="vt-event vt-event--soon">
                      🕐 Hoy próximamente
                    </p>
                  )}
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ─── FILTROS RESPONSIVE ─── */}
      <div className="absolute bottom-20 right-3 z-[992] pointer-events-none max-w-xl">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="pointer-events-auto bg-gray-900/95 text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-xl border border-gray-700 hover:bg-gray-800 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h18M7 8h10M11 12h2"
            />
          </svg>
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Backdrop móvil */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/60 z-[1001] md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Drawer móvil + sidebar desktop */}
      <aside
        className={`fixed top-0 right-0 z-[1002] h-full w-full md:w-80 lg:w-96 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ${
          showFilters ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Filtros</h3>
              <p className="text-xs text-gray-400">
                Afina tu búsqueda rápidamente
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ maxDistance: null });
                    setAmbientesSeleccionados(new Set());
                    setGenerosSeleccionados(new Set());
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Resetear
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800"
                aria-label="Cerrar filtros"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
                  Distancia máxima
                </label>
                <span className="text-blue-400 text-xs font-medium">
                  {filters.maxDistance !== null
                    ? `${filters.maxDistance} km`
                    : "Sin límite"}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                title="Distancia máxima"
                value={filters.maxDistance ?? 20}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxDistance:
                      parseFloat(e.target.value) === 20
                        ? null
                        : parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>500m</span>
                <span>20km+</span>
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">
                Ambiente
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAmbientesSeleccionados(new Set())}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    ambientesSeleccionados.size === 0
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                  }`}
                >
                  Todos
                </button>
                {[
                  { key: "tranquilo",  label: "🌿 Tranquilo" },
                  { key: "animado",    label: "✨ Animado" },
                  { key: "muy_animado", label: "🔥 Muy animado" },
                ].map(({ key, label }) => {
                  const active = ambientesSeleccionados.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setAmbientesSeleccionados((prev) => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        active
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {generosDisponibles.length > 0 && (
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">
                  Género musical
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setGenerosSeleccionados(new Set())}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      generosSeleccionados.size === 0
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                    }`}
                  >
                    Todos
                  </button>
                  {generosDisponibles.map(({ name, emoji }) => {
                    const active = generosSeleccionados.has(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setGenerosSeleccionados((prev) => {
                            const next = new Set(prev);
                            if (next.has(name)) next.delete(name);
                            else next.add(name);
                            return next;
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                          active
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                        }`}
                      >
                        {emoji} {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-700 bg-gray-900/95">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Locales visibles</span>
              <span className="text-white text-sm font-bold">
                {filteredVenues.length}
                <span className="text-gray-500 font-normal">
                  {" "}
                  / {venues.length}
                </span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── PANEL LATERAL / MODAL VENUE ─── */}
      {selectedVenue && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[989] md:hidden"
            onClick={closeModal}
          />

          <div
            className="fixed z-[1002] bg-gray-900 overflow-y-auto bottom-0 left-0 right-0 rounded-t-3xl max-h-[90dvh] animate-slide-up md:bottom-0 md:top-0 md:left-auto md:right-0 md:rounded-none md:w-96 md:max-h-full md:h-full md:animate-slide-right lg:w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen cabecera */}
            <div className="relative h-56 md:h-64 lg:h-72 overflow-hidden rounded-t-3xl md:rounded-none flex-shrink-0">
              <img
                src={selectedVenue.avatar_path}
                alt={selectedVenue.name}
                className="w-full h-full object-cover"
              />

              <button
                onClick={closeModal}
                aria-label="Cerrar panel"
                title="Cerrar panel"
                className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Badge ambiente */}
              <div
                className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    heatState === "full"   ? "#b91c1c"
                    : heatState === "hot"  ? "#ef4444"
                    : heatState === "warm" ? "#f59e0b"
                    :                       "#10b981",
                }}
              >
                {selectedHeatLabel}
              </div>

              {/* Banner evento activo/próximo en imagen */}
              {(() => {
                const status = getEventStatus(selectedVenue);
                const event = getActiveOrSoonEvent(selectedVenue);
                if (!event || status === "none") return null;
                return (
                  <div
                    className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold"
                    style={{
                      backgroundColor:
                        status === "active"
                          ? "rgba(168,85,247,0.85)"
                          : "rgba(249,115,22,0.85)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span className="text-base">
                      {status === "active" ? "🎉" : "🕐"}
                    </span>
                    <div>
                      <p className="font-bold leading-tight">{event.title}</p>
                      <p className="opacity-90 leading-tight">
                        {formatEventTime(event)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white text-2xl font-bold">
                    {selectedVenue.name}
                  </h2>
                  {isPremium(selectedVenue) && (
                    <span className="premium-badge">
                      👑 PREMIUM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
                  {(() => {
                    const distKm = parseDistanceToKm(selectedVenue.distance);
                    const isKnown = distKm !== Number.POSITIVE_INFINITY;
                    const label = isKnown
                      ? distKm < 1
                        ? `${Math.round(distKm * 1000)} m`
                        : `${distKm.toFixed(1)} km`
                      : "Desconocida";
                    const driveMin = isKnown ? Math.round(distKm * 0.6) : null;
                    return (
                      <>
                        <span className="flex items-center gap-1">
                          📍 A {label}
                        </span>
                        <span className="flex items-center gap-1">-</span>
                        {driveMin !== null && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                            </svg>
                            {driveMin} min
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 🌡️ Temperatura — Feature Principal */}
                <div className={`mt-3 rounded-2xl p-3 border heat-card-${heatState}`}>
                  {/* Segmentos */}
                  <div className="flex gap-1.5 mb-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-4 rounded-full transition-all duration-500 ${
                          i < selectedHeatStep
                            ? `heat-seg-pos-${i} heat-seg-anim heat-seg-delay-${i}`
                            : "bg-white/8"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Pie: emoji + label + conteo */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {heatState === "full" ? "🔴" : heatState === "hot" ? "🟠" : heatState === "warm" ? "🟡" : "🟢"}
                      </span>
                      <span className="text-white font-black text-base">
                        {selectedHeatLabel}
                      </span>
                    </div>
                    <span className={`text-sm font-black heat-count-${heatState}`}>
                      {selectedHeatStep * 10}%
                    </span>
                  </div>
                </div>

                {/* ── Indicador de tendencia ── */}
                {(() => {
                  const trendDelta =
                    heatState === "full"
                      ? Math.max(6, Math.round(selectedCheckins * 2))
                      : heatState === "hot"
                        ? Math.max(3, Math.round(selectedCheckins * 1.5))
                        : heatState === "warm"
                          ? Math.round(selectedCheckins * 0.6)
                          : 0;
                  const direction =
                    heatState === "full" ? "Llenazo"
                    : heatState === "hot" ? "Subiendo"
                    : heatState === "warm" ? "Estable"
                    : "Bajando";
                  const directionColor =
                    heatState === "full" ? "text-red-400"
                    : heatState === "hot" ? "text-orange-400"
                    : heatState === "warm" ? "text-yellow-400"
                    : "text-emerald-400";
                  const dirArrow =
                    heatState === "full" ? "↑↑" : heatState === "hot" ? "↑" : heatState === "warm" ? "→" : "↓";
                  return (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {/* Tendencia */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                        <span className="text-lg">
                          {trendDelta > 0 ? "📈" : "📉"}
                        </span>
                        <div>
                          <p className="text-white/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">
                            15 min
                          </p>
                          <p className={`text-xs font-black ${trendDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {trendDelta > 0 ? `+${trendDelta} personas` : "Sin cambios"}
                          </p>
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                        <span className={`text-xl font-black leading-none ${directionColor}`}>
                          {dirArrow}
                        </span>
                        <div>
                          <p className="text-white/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">
                            Tendencia
                          </p>
                          <p className={`text-xs font-black ${directionColor}`}>
                            {direction}
                          </p>
                        </div>
                      </div>

                      {/* Pico */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                        <span className="text-lg">🔥</span>
                        <div>
                          <p className="text-white/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">
                            Pico hoy
                          </p>
                          <p className="text-white text-xs font-black">02:00</p>
                        </div>
                      </div>

                      {/* Mejor hora */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-[#2E5CFF]/10 border border-[#2E5CFF]/20 px-3 py-2.5">
                        <span className="text-lg">🕑</span>
                        <div>
                          <p className="text-white/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">
                            Mejor hora
                          </p>
                          <p className="text-[#6b9fff] text-xs font-black">01:30</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* ── Géneros musicales (solo venue) ── */}
              {selectedVenue.genres && selectedVenue.genres.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVenue.genres.map((item) => {
                      const genre = item.genre || item;
                      return (
                        <span
                          key={genre.slug}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-ozio-purple/10 text-ozio-purple border border-ozio-purple/25"
                        >
                          <span>{genre.emoji}</span>
                          <span>{genre.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── EVENTOS ACTIVOS ─── */}
              {(() => {
                const now = new Date();
                const activeEvents =
                  selectedVenue.events?.filter(
                    (e) =>
                      new Date(e.starts_at) <= now &&
                      new Date(e.ends_at) >= now,
                  ) || [];
                if (activeEvents.length === 0) return null;
                return (
                  <div className="bg-gray-800 border border-green-500/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <h3 className="text-white font-semibold text-sm">
                        Evento en curso
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {activeEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            const eventData = encodeURIComponent(JSON.stringify(event));
                            router.push(`/events/${event.id}?data=${eventData}`);
                          }}
                        >
                          {event.image_path ? (
                            <img
                              src={event.image_path}
                              alt={event.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">🎉</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {event.title}
                            </p>
                            <p className="text-green-400 text-xs">
                              {formatEventTime(event)}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-gray-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ─── EVENTOS PRÓXIMOS (hoy) ─── */}
              {(() => {
                const now = new Date();
                const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const soonEvents =
                  selectedVenue.events?.filter((e) => {
                    const start = new Date(e.starts_at);
                    return start > now && start <= in24h;
                  }) || [];
                if (soonEvents.length === 0) return null;
                return (
                  <div className="bg-gray-800 border border-orange-500/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-orange-400 text-sm">🕐</span>
                      <h3 className="text-white font-semibold text-sm">
                        Próximamente hoy
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {soonEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            const eventData = encodeURIComponent(
                              JSON.stringify(event),
                            );
                            router.push(
                              `/events/${event.id}?data=${eventData}`,
                            );
                          }}
                        >
                          {event.image_path ? (
                            <img
                              src={event.image_path}
                              alt={event.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">🕐</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {event.title}
                            </p>
                            <p className="text-orange-400 text-xs">
                              {formatEventTime(event)}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-gray-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Acciones */}
              <div className="flex flex-wrap items-center gap-2">
                {isUserProfile &&
                  (hasUserActiveCheckIn ? (
                    <button
                      type="button"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                      onClick={() => onCheckOut(selectedVenue.id)}
                    >
                      Quitar check-in
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                      onClick={() => onCheckIn(selectedVenue.id)}
                    >
                      Hacer check-in
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => router.push(`/venues/${selectedVenue.id}`)}
                  >
                    Ir ahora 🔥
                  </button>

                  {isUserProfile && (
                    <button
                      type="button"
                      aria-label={
                        selectedVenue.is_favorite
                          ? "Quitar de favoritos"
                          : "Añadir a favoritos"
                      }
                      title={
                        selectedVenue.is_favorite
                          ? "Quitar de favoritos"
                          : "Añadir a favoritos"
                      }
                      className={`aspect-square py-3 px-4 rounded-full flex items-center justify-center transition ${
                        selectedVenue.is_favorite
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-600 hover:bg-gray-500 text-white"
                      }`}
                      onClick={() =>
                        toggleFavorite(
                          selectedVenue.id,
                          selectedVenue.is_favorite || false,
                        )
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill={
                          selectedVenue.is_favorite ? "currentColor" : "none"
                        }
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="hidden md:block fixed inset-0 z-[988]"
            onClick={closeModal}
          />
        </>
      )}

      <style jsx global>{`
        .leaflet-control-zoom {
          position: fixed !important;
          top: 50% !important;
          right: 20px !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
        }
        @media (min-width: 768px) {
          .leaflet-control-zoom {
            right: calc(24rem + 24px) !important;
          }
        }
        @media (min-width: 1024px) {
          .leaflet-control-zoom {
            right: calc(420px + 24px) !important;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes slide-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-right {
          animation: slide-right 0.3s ease-out;
        }
        @keyframes event-pulse {
          0%,
          100% {
            stroke-opacity: 1;
            stroke-width: 3px;
          }
          50% {
            stroke-opacity: 0.2;
            stroke-width: 10px;
          }
        }
        .event-active-pulse path,
        .event-active-pulse circle {
          animation: event-pulse 1.5s ease-in-out infinite;
        }
        @keyframes soon-pulse {
          0%,
          100% {
            stroke-opacity: 0.9;
            stroke-width: 2px;
          }
          50% {
            stroke-opacity: 0.4;
            stroke-width: 6px;
          }
        }
        .event-soon-pulse path,
        .event-soon-pulse circle {
          animation: soon-pulse 2.5s ease-in-out infinite;
        }
        .leaflet-bottom.leaflet-right {
          display: none;
        }
        @keyframes heat-shine {
          0% {
            transform: translateX(-180%);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(650%);
            opacity: 0;
          }
        }
        .animate-heat-shine {
          animation: heat-shine 2.2s linear infinite;
        }
        @keyframes heat-pulse {
          0%,
          100% {
            filter: saturate(1);
          }
          50% {
            filter: saturate(1.25);
          }
        }
        .animate-heat-pulse {
          animation: heat-pulse 1.8s ease-in-out infinite;
        }
        /* Heat card states */
        .heat-card-cool {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(10, 10, 20, 0.85) 100%);
          border-color: rgba(74, 222, 128, 0.3);
          box-shadow: 0 0 28px rgba(74, 222, 128, 0.1), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .heat-card-warm {
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(10, 10, 20, 0.85) 100%);
          border-color: rgba(234, 179, 8, 0.35);
          box-shadow: 0 0 28px rgba(234, 179, 8, 0.15), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .heat-card-hot {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(10, 10, 20, 0.85) 100%);
          border-color: rgba(249, 115, 22, 0.38);
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.18), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .heat-card-full {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(10, 10, 20, 0.85) 100%);
          border-color: rgba(239, 68, 68, 0.45);
          box-shadow: 0 0 34px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        /* Heat count colors */
        .heat-count-cool  { color: #4ade80; }
        .heat-count-warm  { color: #fde047; }
        .heat-count-hot   { color: #fb923c; }
        .heat-count-full  { color: #f87171; }
        /* Heat segments por posición — termómetro verde→amarillo→naranja→rojo */
        .heat-seg-pos-0, .heat-seg-pos-1, .heat-seg-pos-2 {
          background: linear-gradient(90deg, #22c55e, #4ade80);
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.9), 0 0 18px rgba(74, 222, 128, 0.45);
        }
        .heat-seg-pos-3, .heat-seg-pos-4, .heat-seg-pos-5 {
          background: linear-gradient(90deg, #ca8a04, #fde047);
          box-shadow: 0 0 8px rgba(253, 224, 71, 0.85), 0 0 18px rgba(253, 224, 71, 0.4);
        }
        .heat-seg-pos-6, .heat-seg-pos-7 {
          background: linear-gradient(90deg, #ea580c, #fb923c);
          box-shadow: 0 0 8px rgba(251, 146, 60, 0.9), 0 0 18px rgba(251, 146, 60, 0.5);
        }
        .heat-seg-pos-8, .heat-seg-pos-9 {
          background: linear-gradient(90deg, #dc2626, #f87171);
          box-shadow: 0 0 10px rgba(239, 68, 68, 1), 0 0 22px rgba(239, 68, 68, 0.6);
        }
        @keyframes seg-pulse {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.65; transform: scaleY(0.75); }
        }
        .heat-seg-anim { animation: seg-pulse 1.6s ease-in-out infinite; }
        .heat-seg-delay-0 { animation-delay: 0ms; }
        .heat-seg-delay-1 { animation-delay: 100ms; }
        .heat-seg-delay-2 { animation-delay: 200ms; }
        .heat-seg-delay-3 { animation-delay: 300ms; }
        .heat-seg-delay-4 { animation-delay: 400ms; }
        .heat-seg-delay-5 { animation-delay: 500ms; }
        .heat-seg-delay-6 { animation-delay: 600ms; }
        .heat-seg-delay-7 { animation-delay: 700ms; }
        .heat-seg-delay-8 { animation-delay: 800ms; }
        .heat-seg-delay-9 { animation-delay: 900ms; }
        /* Heat bar glow (legacy, kept for filter use) */
        .heat-bar-glow-cool {
          box-shadow:
            0 0 14px rgba(52, 211, 153, 0.9),
            0 0 28px rgba(52, 211, 153, 0.4);
        }
        .heat-bar-glow-warm {
          box-shadow:
            0 0 14px rgba(251, 146, 60, 0.9),
            0 0 28px rgba(251, 146, 60, 0.45);
        }
        .heat-bar-glow-hot {
          box-shadow:
            0 0 16px rgba(239, 68, 68, 1),
            0 0 32px rgba(239, 68, 68, 0.55);
        }
        /* Premium badge */
        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #1a0a00;
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
        }
        /* Venue tooltip */
        .venue-tooltip {
          background: rgba(10, 14, 26, 0.96) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
          padding: 7px 11px !important;
          backdrop-filter: blur(8px) !important;
        }
        .venue-tooltip::before {
          display: none !important;
        }
        .vt-name {
          margin: 0;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          line-height: 1.3;
        }
        .vt-event {
          margin: 3px 0 0;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
        }
        .vt-event--active {
          color: #a78bfa;
        }
        .vt-event--soon {
          color: #fb923c;
        }
      `}</style>
    </>
  );
}

export default MyMap;
