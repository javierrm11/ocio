"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import "leaflet/dist/leaflet.css";
import { getToken } from '@/lib/hooks/getToken';

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
  ambience_level: "low" | "medium" | "high";
  description?: string;
  avatar_path?: string;
  distance?: string;
  genres?: string[];
  rating?: number;
  check_ins?: any[];
  is_favorite?: boolean;
  events?: Event[];
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
  const startTime = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours === 0) return `Empieza en ${diffMins}min`;
  return `Empieza a las ${startTime} (en ${diffHours}h)`;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
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

function getHeatStep(checkins: number, maxReference: number): number {
  if (checkins <= 0) return 0;
  const ratio = Math.min(checkins / maxReference, 1);
  return Math.max(1, Math.min(10, Math.ceil(ratio * 10)));
}

function getHeatLabel(checkins: number): string {
  if (checkins === 0) return "Tranquilo";
  if (checkins < 5) return "Animado";
  return "Muy animado";
}

function getHeatGradient(checkins: number): string {
  if (checkins === 0) return "from-emerald-400 via-lime-400 to-green-500";
  if (checkins < 5) return "from-yellow-400 via-orange-400 to-amber-500";
  return "from-orange-500 via-red-500 to-rose-500";
}

function getMarkerRadius(checkins: number, maxReference: number, eventStatus: "active" | "soon" | "none"): number {
  const minRadius = 7;
  const maxRadius = 16;
  const normalized = Math.min(checkins / maxReference, 1);
  const baseRadius = minRadius + normalized * (maxRadius - minRadius);

  const eventBoost = eventStatus === "active" ? 2 : eventStatus === "soon" ? 1 : 0;
  return Number((baseRadius + eventBoost).toFixed(1));
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
    minCheckins: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const currentProfileId = currentUser?.id;

  const hasActiveFilters =
    filters.maxDistance !== null ||
    filters.minCheckins > 0;

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
            distance: getDistanceKm(latitude, longitude, v.latitude, v.longitude),
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ venue_id: venueId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const createdCheckIn = Array.isArray(data?.data) ? data.data[0] : data?.data;
        if (!createdCheckIn) return;

        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId
            ? {
                ...v,
                check_ins: [
                  ...(v.check_ins || []).filter(
                    (c: any) =>
                      c.id !== createdCheckIn.id &&
                      !(currentProfileId && c.profile_id === currentProfileId && c.active),
                  ),
                  createdCheckIn,
                ],
              }
            : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);

        setSelectedVenue((prev) => {
          if (!prev || prev.id !== venueId) return prev;
          return {
            ...prev,
            check_ins: [
              ...(prev.check_ins || []).filter(
                (c: any) =>
                  c.id !== createdCheckIn.id &&
                  !(currentProfileId && c.profile_id === currentProfileId && c.active),
              ),
              createdCheckIn,
            ],
          };
        });
      });
  };

  const onCheckOut = (venueId: any) => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${venueId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((payload) => {
        const deletedCheckInId = payload?.data?.id;

        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId
            ? {
                ...v,
                check_ins: (v.check_ins || []).filter((c: any) => {
                  if (deletedCheckInId) return c.id !== deletedCheckInId;
                  if (currentProfileId) return !(c.profile_id === currentProfileId && c.active);
                  return c.active;
                }),
              }
            : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);

        setSelectedVenue((prev) => {
          if (!prev || prev.id !== venueId) return prev;
          return {
            ...prev,
            check_ins: (prev.check_ins || []).filter((c: any) => {
              if (deletedCheckInId) return c.id !== deletedCheckInId;
              if (currentProfileId) return !(c.profile_id === currentProfileId && c.active);
              return c.active;
            }),
          };
        });
      });
  };

  const toggleFavorite = (venueId: any, isFavorite: boolean) => {
    const token = getToken();
    if (isFavorite) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setVenues(venues.map((v) => v.id === venueId ? { ...v, is_favorite: false } : v));
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, is_favorite: false });
        setUserFavorites(userFavorites.filter((id) => id !== venueId));
      });
    } else {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ venue_id: venueId }),
      }).then(() => {
        setVenues(venues.map((v) => v.id === venueId ? { ...v, is_favorite: true } : v));
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, is_favorite: true });
        setUserFavorites([...userFavorites, venueId]);
      });
    }
  };

  const isUserProfile =
    currentUser?.username !== undefined && currentUser?.username !== null;

  const filteredVenues = venues.filter((v) => {
    const dist = parseDistanceToKm(v.distance);
    if (filters.maxDistance !== null && dist > filters.maxDistance) return false;

    const checkins = v.check_ins?.length || 0;
    if (checkins < filters.minCheckins) return false;

    return true;
  });

  const selectedCheckins = selectedVenue?.check_ins?.length || 0;
  const maxCheckinsReference = Math.max(
    10,
    ...venues.map((v) => v.check_ins?.length || 0),
  );
  const selectedHeatStep = getHeatStep(selectedCheckins, maxCheckinsReference);
  const selectedHeatLabel = getHeatLabel(selectedCheckins);
  const selectedHeatGradient = getHeatGradient(selectedCheckins);
  const heatState = selectedCheckins === 0 ? "cool" : selectedCheckins < 5 ? "warm" : "hot";
  const hasUserActiveCheckIn = Boolean(
    selectedVenue?.check_ins?.some(
      (c: any) => c.active && (!currentProfileId || c.profile_id === currentProfileId),
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
        <p className="text-white text-lg font-semibold mt-6 animate-pulse">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <>
      {/* ─── MAPA ─── */}
      <div className="fixed inset-0 md:right-0 md:left-0">
        <MapContainer
          center={userLocation ? [userLocation.latitude, userLocation.longitude] : [37.8787857, -4.766206]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {userLocation && (
            <CircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={8}
              pathOptions={{ color: "#3b82f6", fillColor: "#60a5fa", fillOpacity: 0.9, weight: 3 }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>📍 Tu ubicación</Tooltip>
            </CircleMarker>
          )}

          {filteredVenues.map((venue) => {
            const eventStatus = getEventStatus(venue);
            const checkinsCount = venue.check_ins?.length || 0;
            return (
              <CircleMarker
                key={`${venue.id}-${venue.check_ins?.length || 0}`}
                center={[venue.latitude, venue.longitude] as [number, number]}
                radius={getMarkerRadius(checkinsCount, maxCheckinsReference, eventStatus)}
                color={
                  eventStatus === "active" ? "#a855f7"
                  : eventStatus === "soon" ? "#f97316"
                  : venue.check_ins?.length === 0 ? "#10b981"
                  : (venue.check_ins?.length || 0) < 5 ? "#f59e0b"
                  : "#ef4444"
                }
                fillColor={
                  eventStatus === "active" ? "#d8b4fe"
                  : eventStatus === "soon" ? "#fdba74"
                  : venue.check_ins?.length === 0 ? "#6ee7b7"
                  : (venue.check_ins?.length || 0) < 5 ? "#fcd34d"
                  : "#fca5a5"
                }
                fillOpacity={0.85}
                weight={eventStatus === "active" ? 3 : 2}
                className={
                  eventStatus === "active" ? "event-active-pulse"
                  : eventStatus === "soon" ? "event-soon-pulse"
                  : ""
                }
                eventHandlers={{ click: () => handleVenueClick(venue) }}
              >
                <Tooltip direction="bottom" offset={[0, 12] as [number, number]} opacity={1} permanent>
                  <div style={{ cursor: "pointer", margin: 0 }} onClick={() => handleVenueClick(venue)}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{venue.name}</p>
                    {eventStatus === "active" && (
                      <p style={{ margin: 0, fontSize: "10px", color: "#a855f7", fontWeight: 700 }}>
                        🎉 Evento en curso
                      </p>
                    )}
                    {eventStatus === "soon" && (
                      <p style={{ margin: 0, fontSize: "10px", color: "#f97316", fontWeight: 700 }}>
                        🕐 Hoy próximamente
                      </p>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* ─── FILTROS RESPONSIVE ─── */}
      <div className="absolute top-16 right-3 z-[1000] pointer-events-none">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="pointer-events-auto bg-gray-900/95 text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-xl border border-gray-700 hover:bg-gray-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
          </svg>
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/60 z-[1001] md:hidden" onClick={() => setShowFilters(false)} />
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
              <p className="text-xs text-gray-400">Afina tu búsqueda rápidamente</p>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      maxDistance: null,
                      minCheckins: 0,
                    })
                  }
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Distancia máxima</label>
                <span className="text-blue-400 text-xs font-medium">
                  {filters.maxDistance !== null ? `${filters.maxDistance} km` : "Sin límite"}
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
                    maxDistance: parseFloat(e.target.value) === 20 ? null : parseFloat(e.target.value),
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
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">Ambiente mínimo</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Todos", value: 0 },
                  { label: "🟡 Medio", value: 5 },
                  { label: "🔴 Alto", value: 10 },
                ].map((option) => {
                  const active = filters.minCheckins === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, minCheckins: option.value }))}
                      className={`text-xs py-2 rounded-xl border transition font-medium ${
                        active
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-700 bg-gray-900/95">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Locales visibles</span>
              <span className="text-white text-sm font-bold">
                {filteredVenues.length}
                <span className="text-gray-500 font-normal"> / {venues.length}</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── PANEL LATERAL / MODAL VENUE ─── */}
      {selectedVenue && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[989] md:hidden" onClick={closeModal} />

          <div
            className="fixed z-[1002] bg-gray-900 overflow-y-auto bottom-0 left-0 right-0 rounded-t-3xl max-h-[90dvh] animate-slide-up md:bottom-0 md:top-0 md:left-auto md:right-0 md:rounded-none md:w-96 md:max-h-full md:h-full md:animate-slide-right lg:w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen cabecera */}
            <div className="relative h-56 md:h-64 lg:h-72 overflow-hidden rounded-t-3xl md:rounded-none flex-shrink-0">
              <img src={selectedVenue.avatar_path} alt={selectedVenue.name} className="w-full h-full object-cover" />

              <button
                onClick={closeModal}
                aria-label="Cerrar panel"
                title="Cerrar panel"
                className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Badge ambiente */}
              <div
                className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    (selectedVenue.check_ins?.length || 0) === 0 ? "#10b981"
                    : (selectedVenue.check_ins?.length || 0) < 5 ? "#f59e0b"
                    : "#ef4444",
                }}
              >
                {(selectedVenue.check_ins?.length || 0) === 0 ? "Tranquilo"
                  : (selectedVenue.check_ins?.length || 0) < 5 ? "Animado"
                  : "Muy Animado"}
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
                      backgroundColor: status === "active" ? "rgba(168,85,247,0.85)" : "rgba(249,115,22,0.85)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span className="text-base">{status === "active" ? "🎉" : "🕐"}</span>
                    <div>
                      <p className="font-bold leading-tight">{event.title}</p>
                      <p className="opacity-90 leading-tight">{formatEventTime(event)}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-white text-2xl font-bold mb-1">{selectedVenue.name}</h2>

                {/* 🌡️ Temperatura — Feature Principal */}
                <div className={`mt-3 rounded-2xl p-4 border heat-card-${heatState}`}>
                  {/* Fila superior: icono + label + contador */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl leading-none">
                        {selectedCheckins >= 5 ? '🔥' : selectedCheckins > 0 ? '✨' : '🌿'}
                      </span>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Ambiente ahora</p>
                        <p className="text-white text-xl font-black leading-tight">{selectedHeatLabel}</p>
                      </div>
                    </div>
                    <div className={`rounded-xl px-3 py-2 text-center min-w-[52px] heat-badge-${heatState}`}>
                      <p className={`text-2xl font-black leading-none heat-count-${heatState}`}>
                        {selectedCheckins}
                      </p>
                      <p className="text-white/35 text-[9px] uppercase tracking-wide mt-0.5">aquí</p>
                    </div>
                  </div>

                  {/* Barra de temperatura protagonista */}
                  <div className="relative h-5 w-full rounded-full bg-black/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${selectedHeatGradient} ${HEAT_BAR_WIDTH_CLASSES[selectedHeatStep]} transition-all duration-700 ease-out animate-heat-pulse heat-bar-glow-${heatState}`}
                    />
                    <div className="absolute inset-y-0 w-16 bg-white/10 blur-md animate-heat-shine" />
                  </div>

                  {/* Escala */}
                  <div className="flex justify-between mt-2 px-0.5">
                    <span className="text-[10px] text-white/25 font-medium">Tranquilo</span>
                    <span className="text-[10px] text-white/25 font-medium">Llenazo</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                  <span>{selectedVenue.distance || "Desconocida"}</span>
                </div>
              </div>

              {selectedVenue.genres && selectedVenue.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedVenue.genres.map((genre) => (
                    <span key={genre} className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {selectedVenue.description && (
                <p className="text-gray-400 text-sm leading-relaxed hidden md:block line-clamp-4">
                  {selectedVenue.description}
                </p>
              )}

              {/* ─── EVENTOS ACTIVOS ─── */}
              {(() => {
                const now = new Date();
                const activeEvents = selectedVenue.events?.filter(
                  (e) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
                ) || [];
                if (activeEvents.length === 0) return null;
                return (
                  <div className="bg-gray-800 border border-green-500/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <h3 className="text-white font-semibold text-sm">Evento en curso</h3>
                    </div>
                    <div className="space-y-2">
                      {activeEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            router.push(`/events/${event.id}`);
                          }}
                        >
                          {event.image_path ? (
                            <img src={event.image_path} alt={event.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">🎉</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{event.title}</p>
                            <p className="text-green-400 text-xs">{formatEventTime(event)}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                const soonEvents = selectedVenue.events?.filter((e) => {
                  const start = new Date(e.starts_at);
                  return start > now && start <= in24h;
                }) || [];
                if (soonEvents.length === 0) return null;
                return (
                  <div className="bg-gray-800 border border-orange-500/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-orange-400 text-sm">🕐</span>
                      <h3 className="text-white font-semibold text-sm">Próximamente hoy</h3>
                    </div>
                    <div className="space-y-2">
                      {soonEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            const eventData = encodeURIComponent(JSON.stringify(event));
                            router.push(`/events/${event.id}?data=${eventData}`);
                          }}
                        >
                          {event.image_path ? (
                            <img src={event.image_path} alt={event.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">🕐</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{event.title}</p>
                            <p className="text-orange-400 text-xs">{formatEventTime(event)}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  ) : (
                  <button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => onCheckIn(selectedVenue.id)}
                  >
                    Hacer check-in
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  ))}

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => router.push(`/venues/${selectedVenue.id}`)}
                  >
                    Ver detalles
                  </button>

                  {isUserProfile && (
                    <button
                      type="button"
                      aria-label={selectedVenue.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                      title={selectedVenue.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                      className={`aspect-square py-3 px-4 rounded-full flex items-center justify-center transition ${
                        selectedVenue.is_favorite
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-600 hover:bg-gray-500 text-white"
                      }`}
                      onClick={() => toggleFavorite(selectedVenue.id, selectedVenue.is_favorite || false)}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={selectedVenue.is_favorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block fixed inset-0 z-[988]" onClick={closeModal} />
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
          .leaflet-control-zoom { right: calc(24rem + 24px) !important; }
        }
        @media (min-width: 1024px) {
          .leaflet-control-zoom { right: calc(420px + 24px) !important; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes slide-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slide-right 0.3s ease-out; }
        @keyframes event-pulse {
          0%, 100% { stroke-opacity: 1; stroke-width: 3px; }
          50% { stroke-opacity: 0.2; stroke-width: 10px; }
        }
        .event-active-pulse path, .event-active-pulse circle {
          animation: event-pulse 1.5s ease-in-out infinite;
        }
        @keyframes soon-pulse {
          0%, 100% { stroke-opacity: 0.9; stroke-width: 2px; }
          50% { stroke-opacity: 0.4; stroke-width: 6px; }
        }
        .event-soon-pulse path, .event-soon-pulse circle {
          animation: soon-pulse 2.5s ease-in-out infinite;
        }
        .leaflet-bottom.leaflet-right { display: none; }
        @keyframes heat-shine {
          0% { transform: translateX(-180%); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateX(650%); opacity: 0; }
        }
        .animate-heat-shine {
          animation: heat-shine 2.2s linear infinite;
        }
        @keyframes heat-pulse {
          0%, 100% { filter: saturate(1); }
          50% { filter: saturate(1.25); }
        }
        .animate-heat-pulse {
          animation: heat-pulse 1.8s ease-in-out infinite;
        }
        /* Heat card states */
        .heat-card-cool {
          background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,10,20,0.85) 100%);
          border-color: rgba(52,211,153,0.35);
          box-shadow: 0 0 28px rgba(52,211,153,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .heat-card-warm {
          background: linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(10,10,20,0.85) 100%);
          border-color: rgba(251,146,60,0.35);
          box-shadow: 0 0 28px rgba(251,146,60,0.15), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .heat-card-hot {
          background: linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(10,10,20,0.85) 100%);
          border-color: rgba(239,68,68,0.4);
          box-shadow: 0 0 32px rgba(239,68,68,0.22), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        /* Heat badge backgrounds */
        .heat-badge-cool { background: rgba(52,211,153,0.13); }
        .heat-badge-warm { background: rgba(251,146,60,0.13); }
        .heat-badge-hot  { background: rgba(239,68,68,0.16); }
        /* Heat count colors */
        .heat-count-cool { color: #34d399; }
        .heat-count-warm { color: #fb923c; }
        .heat-count-hot  { color: #f87171; }
        /* Heat bar glow */
        .heat-bar-glow-cool { box-shadow: 0 0 14px rgba(52,211,153,0.9), 0 0 28px rgba(52,211,153,0.4); }
        .heat-bar-glow-warm { box-shadow: 0 0 14px rgba(251,146,60,0.9), 0 0 28px rgba(251,146,60,0.45); }
        .heat-bar-glow-hot  { box-shadow: 0 0 16px rgba(239,68,68,1),    0 0 32px rgba(239,68,68,0.55); }
      `}</style>
    </>
  );
}

export default MyMap;