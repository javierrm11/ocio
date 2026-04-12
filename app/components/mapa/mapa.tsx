"use client";
import { MapContainer, TileLayer } from "react-leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/stores/venueStore";
import "leaflet/dist/leaflet.css";
import { getToken } from "@/lib/hooks/getToken";
import { Venue } from "./types";
import { getDistanceKm, getGenreEmoji, getGenreName, getHeatCategory, getHeatStep, getMadridHour, parseDistanceToKm } from "./utils";
import { MapMarkers } from "./MapMarkers";
import { MapFilters } from "./MapFilters";
import { VenuePanel } from "./VenuePanel";

function MyMap() {
  const {
    venues,
    setVenues,
    userFavorites,
    setUserFavorites,
    currentUser,
    setCurrentUser,
    loaded,
    userLocation,
    setUserLocation,
  } = useAppStore();

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filters, setFilters] = useState({ maxDistance: null as number | null });
  const [showFilters, setShowFilters] = useState(false);
  const [generosSeleccionados, setGenerosSeleccionados] = useState<Set<string>>(new Set());
  const [ambientesSeleccionados, setAmbientesSeleccionados] = useState<Set<string>>(new Set());
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [pointsToast, setPointsToast] = useState<number | null>(null);
  const [isNight, setIsNight] = useState(() => {
    const h = getMadridHour();
    return h >= 21 || h < 7;
  });

  const currentProfileId = currentUser?.id;
  const isUserProfile = currentUser?.username !== undefined && currentUser?.username !== null;

  const venuesRef = useRef(venues);
  useEffect(() => { venuesRef.current = venues; }, [venues]);

  // Night mode check
  useEffect(() => {
    const check = () => {
      const h = getMadridHour();
      setIsNight(h >= 21 || h < 7);
    };
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Geolocation
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

  const generosDisponibles = useMemo(() => {
    const all = venues.flatMap((v) =>
      v.genres?.map((g) => ({ name: getGenreName(g), emoji: getGenreEmoji(g) })) || []
    );
    const seen = new Set<string>();
    return all.filter(({ name }) => {
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [venues]);

  const hasActiveFilters = useMemo(
    () => filters.maxDistance !== null || ambientesSeleccionados.size > 0 || generosSeleccionados.size > 0,
    [filters.maxDistance, ambientesSeleccionados, generosSeleccionados],
  );

  const filteredVenues = useMemo(() => venues.filter((v) => {
    const dist = parseDistanceToKm(v.distance);
    if (filters.maxDistance !== null && dist > filters.maxDistance) return false;
    if (ambientesSeleccionados.size > 0) {
      const nivel = getHeatCategory(getHeatStep(v.check_ins?.length || 0));
      if (!ambientesSeleccionados.has(nivel)) return false;
    }
    if (generosSeleccionados.size > 0 && !v.genres?.some((g) => generosSeleccionados.has(getGenreName(g))))
      return false;
    return true;
  }), [venues, filters.maxDistance, ambientesSeleccionados, generosSeleccionados]);

  const showPointsToast = useCallback((points: number) => {
    setPointsToast(points);
    setTimeout(() => setPointsToast(null), 4000);
  }, []);

  const closeModal = useCallback(() => setSelectedVenue(null), []);

  const fetchRoute = useCallback(async (destLat: number, destLng: number) => {
    if (!userLocation) {
      alert("Activa tu ubicación para calcular la ruta");
      return;
    }
    setLoadingRoute(true);
    try {
      const { latitude: oLat, longitude: oLng } = userLocation;
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        const points: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        setRoutePoints(points);
        closeModal();
      }
    } catch (e) {
      console.error("Error calculando ruta", e);
    } finally {
      setLoadingRoute(false);
    }
  }, [userLocation, closeModal]);

  const onCheckIn = useCallback((venueId: any) => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        venue_id: venueId,
        user_lat: userLocation?.latitude ?? null,
        user_lng: userLocation?.longitude ?? null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const createdCheckIn = Array.isArray(data?.data) ? data.data[0] : data?.data;
        if (!createdCheckIn) return;
        const addCheckIn = (list: any[]) => [
          ...list.filter(
            (c: any) => c.id !== createdCheckIn.id && !(currentProfileId && c.profile_id === currentProfileId),
          ),
          createdCheckIn,
        ];
        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId ? { ...v, check_ins: addCheckIn(v.check_ins || []) } : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);
        setSelectedVenue((prev) =>
          prev && prev.id === venueId ? { ...prev, check_ins: addCheckIn(prev.check_ins || []) } : prev,
        );
      });
  }, [userLocation, currentProfileId, setVenues]);

  const onCheckOut = useCallback((venueId: any) => {
    const myCheckIn = venuesRef.current
      .find((v) => v.id === venueId)
      ?.check_ins?.find((c: any) => c.profile_id === currentProfileId);
    if (!myCheckIn) return;
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${myCheckIn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: false }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.points_earned > 0) {
          showPointsToast(result.points_earned);
          if (result.total_points !== null && currentUser) {
            setCurrentUser({ ...currentUser, points: result.total_points });
          }
        }
        const removeCheckIn = (list: any[]) => list.filter((c) => c.id !== myCheckIn.id);
        const nextVenues = venuesRef.current.map((v) =>
          v.id === venueId ? { ...v, check_ins: removeCheckIn(v.check_ins || []) } : v,
        );
        venuesRef.current = nextVenues;
        setVenues(nextVenues);
        setSelectedVenue((prev) =>
          prev && prev.id === venueId ? { ...prev, check_ins: removeCheckIn(prev.check_ins || []) } : prev,
        );
      });
  }, [currentProfileId, currentUser, setCurrentUser, setVenues, showPointsToast]);

  const toggleFavorite = useCallback((venueId: any, isFavorite: boolean) => {
    const token = getToken();
    if (isFavorite) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setVenues(venues.map((v) => v.id === venueId ? { ...v, is_favorite: false } : v));
        if (selectedVenue && selectedVenue.id === venueId) setSelectedVenue({ ...selectedVenue, is_favorite: false });
        setUserFavorites(userFavorites.filter((id) => id !== venueId));
      });
    } else {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ venue_id: venueId }),
      }).then(() => {
        setVenues(venues.map((v) => v.id === venueId ? { ...v, is_favorite: true } : v));
        if (selectedVenue && selectedVenue.id === venueId) setSelectedVenue({ ...selectedVenue, is_favorite: true });
        setUserFavorites([...userFavorites, venueId]);
      });
    }
  }, [venues, userFavorites, selectedVenue, setVenues, setUserFavorites]);

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
      {/* Points toast */}
      {pointsToast !== null && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-yellow-400 text-black font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <span>+{pointsToast} puntos ganados</span>
        </div>
      )}

      {/* Map */}
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
          <MapMarkers
            filteredVenues={filteredVenues}
            userLocation={userLocation}
            routePoints={routePoints}
            onVenueClick={setSelectedVenue}
          />
        </MapContainer>
      </div>

      {/* Active route banner */}
      {routePoints.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
          <span>🗺️ Ruta activa</span>
          <button
            type="button"
            aria-label="Cancelar ruta"
            onClick={() => setRoutePoints([])}
            className="bg-white/20 hover:bg-white/30 rounded-full p-0.5 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <MapFilters
        filters={filters}
        setFilters={setFilters}
        generosDisponibles={generosDisponibles}
        generosSeleccionados={generosSeleccionados}
        setGenerosSeleccionados={setGenerosSeleccionados}
        ambientesSeleccionados={ambientesSeleccionados}
        setAmbientesSeleccionados={setAmbientesSeleccionados}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filteredCount={filteredVenues.length}
        totalCount={venues.length}
      />

      {/* Venue panel */}
      {selectedVenue && (
        <VenuePanel
          venue={selectedVenue}
          onClose={closeModal}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onToggleFavorite={toggleFavorite}
          isUserProfile={isUserProfile}
          currentProfileId={currentProfileId}
          loadingRoute={loadingRoute}
          onFetchRoute={fetchRoute}
        />
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
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes slide-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-right { animation: slide-right 0.3s ease-out; }
        @keyframes event-pulse {
          0%, 100% { stroke-opacity: 1; stroke-width: 3px; }
          50%       { stroke-opacity: 0.2; stroke-width: 10px; }
        }
        .event-active-pulse path, .event-active-pulse circle {
          animation: event-pulse 1.5s ease-in-out infinite;
        }
        @keyframes soon-pulse {
          0%, 100% { stroke-opacity: 0.9; stroke-width: 2px; }
          50%       { stroke-opacity: 0.4; stroke-width: 6px; }
        }
        .event-soon-pulse path, .event-soon-pulse circle {
          animation: soon-pulse 2.5s ease-in-out infinite;
        }
        .leaflet-bottom.leaflet-right { display: none; }
        @keyframes heat-shine {
          0%   { transform: translateX(-180%); opacity: 0; }
          20%  { opacity: 0.8; }
          100% { transform: translateX(650%); opacity: 0; }
        }
        .animate-heat-shine { animation: heat-shine 2.2s linear infinite; }
        @keyframes heat-pulse {
          0%, 100% { filter: saturate(1); }
          50%       { filter: saturate(1.25); }
        }
        .animate-heat-pulse { animation: heat-pulse 1.8s ease-in-out infinite; }
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
        .heat-count-cool  { color: #4ade80; }
        .heat-count-warm  { color: #fde047; }
        .heat-count-hot   { color: #fb923c; }
        .heat-count-full  { color: #f87171; }
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
          50%       { opacity: 0.65; transform: scaleY(0.75); }
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
        .heat-bar-glow-cool {
          box-shadow: 0 0 14px rgba(52, 211, 153, 0.9), 0 0 28px rgba(52, 211, 153, 0.4);
        }
        .heat-bar-glow-warm {
          box-shadow: 0 0 14px rgba(251, 146, 60, 0.9), 0 0 28px rgba(251, 146, 60, 0.45);
        }
        .heat-bar-glow-hot {
          box-shadow: 0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.55);
        }
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
        .venue-tooltip {
          background: rgba(10, 14, 26, 0.96) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
          padding: 7px 11px !important;
          backdrop-filter: blur(8px) !important;
        }
        .venue-tooltip::before { display: none !important; }
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
        .vt-event--active { color: #a78bfa; }
        .vt-event--soon   { color: #fb923c; }
      `}</style>
    </>
  );
}

export default MyMap;
