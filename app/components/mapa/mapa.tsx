"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicImageUrl } from "@/lib/getImageUrl";
import "leaflet/dist/leaflet.css";

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
  id: number;
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

interface UserProfile {
  id: string;
  username: string;
  role: "user" | "venue";
}

// Helpers para eventos
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
    const endTime = end.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Activo hasta las ${endTime}`;
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

function MyMap() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    try {
      // ✅ Venues siempre se carga, sin token
      const venuesRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/venues`,
      );
      const venuesData = await venuesRes.json();

      // ✅ Solo llamamos a APIs autenticadas si hay token
      if (token) {
        try {
          const [favoritesRes, profileRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const [favoritesData, profileData] = await Promise.all([
            favoritesRes.json(),
            profileRes.json(),
          ]);

          const favoriteIds = favoritesData.map((fav: any) => fav.venue_id);
          setUserFavorites(favoriteIds);
          setCurrentUser(profileData[0]);

          setVenues(
            venuesData.map((venue: Venue) => ({
              ...venue,
              is_favorite: favoriteIds.includes(venue.id),
            })),
          );
        } catch (authErr) {
          // Token inválido/expirado → mostramos venues sin auth
          console.warn("Auth failed, showing venues without user data");
          setVenues(venuesData);
        }
      } else {
        // Sin token → venues sin favoritos
        setVenues(venuesData);
      }
    } catch (err) {
      console.error("Error loading venues:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = (venue: Venue) => setSelectedVenue(venue);
  const closeModal = () => setSelectedVenue(null);

  const onCheckIn = (venueId: any) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
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
        setVenues(
          venues.map((v) =>
            v.id === venueId
              ? { ...v, check_ins: [...(v.check_ins || []), data.data] }
              : v,
          ),
        );
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({
            ...selectedVenue,
            check_ins: [...(selectedVenue.check_ins || []), data.data],
          });
        closeModal();
      });
  };

  const onCheckOut = (venueId: any) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${venueId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() => {
        setVenues(
          venues.map((v) => (v.id === venueId ? { ...v, check_ins: [] } : v)),
        );
        if (selectedVenue && selectedVenue.id === venueId)
          setSelectedVenue({ ...selectedVenue, check_ins: [] });
        closeModal();
      });
  };

  const toggleFavorite = (venueId: number, isFavorite: boolean) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
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

  if (loading) {
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
      <MapContainer
        center={[37.8787857, -4.766206] as [number, number]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {venues.map((venue) => {
          const eventStatus = getEventStatus(venue);

          return (
            <CircleMarker
              key={venue.id}
              center={[venue.latitude, venue.longitude] as [number, number]}
              radius={eventStatus !== "none" ? 11 : 8}
              color={
                eventStatus === "active"
                  ? "#a855f7"
                  : eventStatus === "soon"
                    ? "#f97316"
                    : venue.check_ins?.length === 0
                      ? "#10b981"
                      : (venue.check_ins?.length || 0) < 5
                        ? "#f59e0b"
                        : "#ef4444"
              }
              fillColor={
                eventStatus === "active"
                  ? "#d8b4fe"
                  : eventStatus === "soon"
                    ? "#fdba74"
                    : venue.check_ins?.length === 0
                      ? "#6ee7b7"
                      : (venue.check_ins?.length || 0) < 5
                        ? "#fcd34d"
                        : "#fca5a5"
              }
              fillOpacity={0.85}
              weight={eventStatus === "active" ? 3 : 2}
              className={
                eventStatus === "active"
                  ? "event-active-pulse"
                  : eventStatus === "soon"
                    ? "event-soon-pulse"
                    : ""
              }
              eventHandlers={{ click: () => handleVenueClick(venue) }}
            >
              <Tooltip
                direction="bottom"
                offset={[0, 12] as [number, number]}
                opacity={1}
                permanent
              >
                <div
                  style={{ cursor: "pointer", margin: 0 }}
                  onClick={() => handleVenueClick(venue)}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>{venue.name}</p>
                  {eventStatus === "active" && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        color: "#a855f7",
                        fontWeight: 700,
                      }}
                    >
                      🎉 Evento en curso
                    </p>
                  )}
                  {eventStatus === "soon" && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        color: "#f97316",
                        fontWeight: 700,
                      }}
                    >
                      🕐 Hoy próximamente
                    </p>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {selectedVenue && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[989]"
            onClick={closeModal}
          />

          <div
            className="fixed bottom-0 left-0 right-0 z-[1002] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 rounded-t-3xl max-w-2xl mx-auto">
              <div className="relative h-64 rounded-t-3xl overflow-hidden">
                <img
                  src={selectedVenue.avatar_path}
                  alt={selectedVenue.name}
                  className="w-full h-full object-cover"
                />

                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
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

                <div
                  className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      (selectedVenue.check_ins?.length || 0) === 0
                        ? "#10b981"
                        : (selectedVenue.check_ins?.length || 0) < 5
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                >
                  {(selectedVenue.check_ins?.length || 0) === 0
                    ? "Low Ambience"
                    : (selectedVenue.check_ins?.length || 0) < 5
                      ? "Medium Ambience"
                      : "High Ambience"}
                </div>
                <div
                  id="count-checkins"
                  className="absolute top-4 right-16 text-white text-xs font-bold px-3 py-1 rounded-full bg-gray-700"
                ></div>

                {/* Banner evento activo/próximo */}
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
                            ? "rgba(168, 85, 247, 0.85)"
                            : "rgba(249, 115, 22, 0.85)",
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

              <div className="p-6">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {selectedVenue.name}
                </h2>
                <p id="count-checkins" className="text-white text-sm">
                  {selectedVenue.check_ins?.length || 0} check-ins
                </p>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <span>{selectedVenue.distance || "940m away"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-gray-400 text-sm mb-4">
                  {isUserProfile &&
                    (selectedVenue.check_ins &&
                    selectedVenue.check_ins.length > 0 ? (
                      <button
                        type="button"
                        className="flex-[100%] w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
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
                        className="flex-[100%] w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
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
                  <button
                    type="button"
                    className="flex-10 w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => router.push(`/venues/${selectedVenue.id}`)}
                  >
                    Ver detalles
                  </button>
                  <button
                    type="button"
                    className={`flex-1 w-full font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition ${selectedVenue.is_favorite ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                    onClick={() =>
                      toggleFavorite(
                        selectedVenue.id,
                        selectedVenue.is_favorite || false,
                      )
                    }
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
                </div>
              </div>
            </div>
          </div>
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

        /* Pulso para eventos activos (morado) */
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

        /* Pulso suave para eventos próximos (naranja) */
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
      `}</style>
    </>
  );
}

export default MyMap;
