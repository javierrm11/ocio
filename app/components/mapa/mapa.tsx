"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
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
    const endTime = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return `Activo hasta las ${endTime}`;
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
    maxCheckins: null as number | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filters.maxDistance !== null ||
    filters.minCheckins > 0 ||
    filters.maxCheckins !== null;

  const handleVenueClick = (venue: Venue) => setSelectedVenue(venue);
  const closeModal = () => setSelectedVenue(null);

  const venuesRef = useRef(venues);
  useEffect(() => {
    venuesRef.current = venues;
  }, [venues]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

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
  }, []);

  const onCheckIn = (venueId: any) => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ venue_id: venueId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setVenues(
          venues.map((v) =>
            v.id === venueId ? { ...v, check_ins: [...(v.check_ins || []), data.data] } : v,
          ),
        );
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, check_ins: [...(selectedVenue.check_ins || []), data.data] });
        closeModal();
      });
  };

  const onCheckOut = (venueId: any) => {
    const token = getToken();
    const venue = venues.find((v) => v.id === venueId);
    const checkInId = venue?.check_ins?.[0]?.id;
    if (!checkInId) return;
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${checkInId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: false }),
    })
      .then((res) => res.json())
      .then(() => {
        setVenues(venues.map((v) => (v.id === venueId ? { ...v, check_ins: [] } : v)));
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, check_ins: [] });
        closeModal();
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
    const dist =
      typeof v.distance === "number" ? v.distance : parseFloat(v.distance || "0");
    if (filters.maxDistance !== null && dist > filters.maxDistance) return false;
    const checkins = v.check_ins?.length || 0;
    if (checkins < filters.minCheckins) return false;
    if (filters.maxCheckins !== null && checkins > filters.maxCheckins) return false;
    return true;
  });

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
            return (
              <CircleMarker
                key={`${venue.id}-${venue.check_ins?.length || 0}`}
                center={[venue.latitude, venue.longitude] as [number, number]}
                radius={eventStatus !== "none" ? 11 : 8}
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

      {/* ─── BOTÓN + DROPDOWN FILTROS ─── */}
      <div ref={dropdownRef} className="absolute top-15 right-4 z-[999]">

        {/* Botón trigger */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`bg-gray-900 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border transition ${
            showFilters ? "border-blue-500 bg-gray-800" : "border-gray-700 hover:bg-gray-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
          </svg>
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 origin-top-right ${
            showFilters
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-white font-semibold text-sm">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ maxDistance: null, minCheckins: 0, maxCheckins: null })}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Resetear
              </button>
            )}
          </div>

          <div className="px-4 py-4 flex flex-col gap-5">
            {/* Distancia máxima */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
                  Distancia máxima
                </label>
                <span className="text-blue-400 text-xs font-medium">
                  {filters.maxDistance !== null ? `${filters.maxDistance} km` : "Sin límite"}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                value={filters.maxDistance ?? 20}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxDistance: parseFloat(e.target.value) === 20 ? null : parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>500m</span>
                <span>Sin límite</span>
              </div>
            </div>

            {/* Ambiente mínimo */}
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">
                Ambiente mínimo
              </label>
              <div className="flex gap-2">
                {[
                  { label: "Todos", value: 0 },
                  { label: "🟡 Medio", value: 5 },
                  { label: "🔴 Alto", value: 10 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters((f) => ({ ...f, minCheckins: opt.value }))}
                    className={`flex-1 text-xs py-2 rounded-xl border transition font-medium ${
                      filters.minCheckins === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contador */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-800">
              <span className="text-gray-500 text-xs">Locales visibles</span>
              <span className="text-white text-sm font-bold">
                {filteredVenues.length}
                <span className="text-gray-500 font-normal"> / {venues.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PANEL LATERAL / MODAL VENUE ─── */}
      {selectedVenue && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[989] md:hidden" onClick={closeModal} />

          <div
            className="fixed z-[1002] bg-gray-900 overflow-y-auto bottom-0 left-0 right-0 rounded-t-3xl max-h-[90dvh] animate-slide-up md:bottom-0 md:top-0 md:left-auto md:right-0 md:rounded-none md:w-96 md:max-h-full md:h-full md:animate-slide-right lg:w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 md:h-64 lg:h-72 overflow-hidden rounded-t-3xl md:rounded-none flex-shrink-0">
              <img src={selectedVenue.avatar_path} alt={selectedVenue.name} className="w-full h-full object-cover" />

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

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

            <div className="p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-white text-2xl font-bold mb-1">{selectedVenue.name}</h2>
                <p className="text-gray-400 text-sm">{selectedVenue.check_ins?.length || 0} check-ins</p>
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

              <div className="flex flex-wrap items-center gap-2">
                {isUserProfile &&
                  (selectedVenue.check_ins && selectedVenue.check_ins.length > 0 ? (
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
      `}</style>
    </>
  );
}

export default MyMap;