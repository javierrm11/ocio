"use client";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/stores/venueStore";
import "leaflet/dist/leaflet.css";
import { getToken } from "@/lib/hooks/getToken";
import { useAutoCheckin } from "@/lib/hooks/useAutoCheckin";
import { Venue } from "./types";
import { getDistanceKm, getGenreEmoji, getGenreName, getHeatCategory, getHeatStep, getMadridHour, parseDistanceToKm } from "./utils";
import { MapMarkers } from "./MapMarkers";
import { MapFilters } from "./MapFilters";
import { VenuePanel } from "./VenuePanel";
import { MapLoader } from "./MapLoader";

// Centra el mapa solo la primera vez que se obtiene la ubicación
function MapViewSetter({ location }: { location: { latitude: number; longitude: number } | null }) {
  const map = useMap();
  const hasSet = useRef(false);
  useEffect(() => {
    if (location && !hasSet.current) {
      map.setView([location.latitude, location.longitude], map.getZoom());
      hasSet.current = true;
    }
  }, [location, map]);
  return null;
}

// Vuela al venue seleccionado desde la búsqueda
function FlyToHandler({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 1 });
  }, [target, map]);
  return null;
}

// Banner de ubicación denegada con búsqueda de ciudad
function LocationBanner({
  onLocationFound,
}: {
  onLocationFound: (lat: number, lng: number) => void;
}) {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleSearch = async () => {
    const q = city.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } },
      );
      const data = await res.json();
      if (!data.length) { setError("Ciudad no encontrada"); return; }
      onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
      setDismissed(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside role="alert" aria-label="Ubicación no disponible" className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-ozio-dark/95 backdrop-blur border border-white/10 rounded-2xl shadow-xl px-4 py-3">
        <header className="flex items-start justify-between gap-2 mb-2">
          <p className="text-ozio-text text-sm font-semibold leading-snug">
            Ubicación no disponible
          </p>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setDismissed(true)}
            className="text-ozio-text/40 hover:text-ozio-text/80 transition shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <p className="text-ozio-text/50 text-xs mb-3">
          El mapa usa una ubicación por defecto. Introduce tu ciudad para centrarlo correctamente.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ej: Sevilla, Madrid…"
            className="flex-1 bg-white/10 text-ozio-text placeholder-white/30 text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-ozio-blue transition"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !city.trim()}
            className="bg-ozio-blue hover:bg-ozio-blue/80 disabled:opacity-40 text-ozio-text text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            {loading ? "…" : "Ir"}
          </button>
        </div>
        {error && <p className="text-ambience-high text-xs mt-2">{error}</p>}
      </div>
    </aside>
  );
}

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
    locationDenied,
    setLocationDenied,
    mapFlyTarget,
    setMapFlyTarget,
    showFilters,
    setShowFilters,
    setHasActiveFilters,
  } = useAppStore();

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filters, setFilters] = useState({ maxDistance: null as number | null });
  const [generosSeleccionados, setGenerosSeleccionados] = useState<Set<string>>(new Set());
  const [ambientesSeleccionados, setAmbientesSeleccionados] = useState<Set<string>>(new Set());
  const [flyCoords, setFlyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [pointsToast, setPointsToast] = useState<number | null>(null);
  const [autoCheckinToast, setAutoCheckinToast] = useState<string | null>(null);
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
        setLocationDenied(false);
        setVenues(
          venuesRef.current.map((v) => ({
            ...v,
            distance: getDistanceKm(latitude, longitude, v.latitude, v.longitude),
          })),
        );
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setLocationDenied, setVenues]);

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

  useEffect(() => { setHasActiveFilters(hasActiveFilters); }, [hasActiveFilters, setHasActiveFilters]);

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

  // Reacciona a búsqueda: vuela al venue y abre su panel
  useEffect(() => {
    if (!mapFlyTarget) return;
    const venue = venues.find((v) => v.id === mapFlyTarget.venueId);
    if (venue) {
      setFlyCoords({ lat: mapFlyTarget.lat, lng: mapFlyTarget.lng });
      setSelectedVenue(venue);
    }
    setMapFlyTarget(null);
  }, [mapFlyTarget, venues, setMapFlyTarget]);

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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          alert(data.error ?? "No puedes hacer check-in ahora.");
          return null;
        }
        return data;
      })
      .then((data) => {
        if (!data) return;
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

  const showAutoToast = useCallback((msg: string) => {
    setAutoCheckinToast(msg);
    setTimeout(() => setAutoCheckinToast(null), 5000);
  }, []);

  const onAutoCheckIn = useCallback((venueId: string) => {
    const name = venuesRef.current.find((v) => v.id === venueId)?.name ?? "venue";
    onCheckIn(venueId);
    showAutoToast(`Check-in automático en ${name}`);
  }, [onCheckIn, showAutoToast]);

  const onAutoCheckOut = useCallback((venueId: string) => {
    const name = venuesRef.current.find((v) => v.id === venueId)?.name ?? "venue";
    onCheckOut(venueId);
    showAutoToast(`Check-out automático de ${name}`);
  }, [onCheckOut, showAutoToast]);

  useAutoCheckin({
    venues,
    userLocation,
    currentProfileId: isUserProfile ? currentProfileId : undefined,
    onAutoCheckIn,
    onAutoCheckOut,
  });

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
    return <MapLoader />;
  }

  return (
    <>
      {/* Points toast */}
      {pointsToast !== null && (
        <div role="status" aria-live="polite" className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-ozio-orange text-black font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <span>+{pointsToast} puntos ganados</span>
        </div>
      )}

      {/* Auto check-in/out toast */}
      {autoCheckinToast !== null && (
        <div role="status" aria-live="polite" className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-ozio-blue text-white font-semibold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <span>📍 {autoCheckinToast}</span>
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
            keepBuffer={6}
            updateWhenIdle={false}
            updateWhenZooming={false}
          />
          <MapViewSetter location={userLocation} />
          <FlyToHandler target={flyCoords} />
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
        <aside role="status" aria-label="Ruta activa" className="absolute top-16 left-1/2 -translate-x-1/2 z-[999] bg-ozio-blue text-ozio-text text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
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
        </aside>
      )}

      {/* Location denied banner */}
      {locationDenied && !userLocation && (
        <LocationBanner
          onLocationFound={(lat, lng) => {
            setUserLocation({ latitude: lat, longitude: lng });
            setLocationDenied(false);
          }}
        />
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
