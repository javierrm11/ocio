"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";

interface Event {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  image_path: string | null;
}

interface CheckIn {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
}

interface Venue {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  avatar_path: string;
  created_at?: string;
  check_ins?: CheckIn[];
  events?: Event[];
  is_favorite?: boolean;
}

export default function VenueDetail() {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  const {
    venues,
    setVenues,
    userFavorites,
    setUserFavorites,
    currentUser,
    events,
  } = useAppStore();

  const venueFromStore = venues.find((v) => String(v.id) === venueId) ?? null;
  const venueWithEvents = venueFromStore
    ? ({
        ...venueFromStore,
        events: events.filter((e) => e.venue_id === venueId),
      } as unknown as Venue)
    : null;

  const [venue, setVenue] = useState<Venue | null>(venueWithEvents);
  const [loading, setLoading] = useState(!venueWithEvents);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const isUserProfile =
    currentUser?.username !== undefined && currentUser?.username !== null;

  // Sincronizar hasCheckedIn con el store
  useEffect(() => {
    console.log(venueFromStore?.check_ins);
    
    if (venueFromStore?.check_ins && venueFromStore.check_ins.length > 0) {
      setHasCheckedIn(true);
    } else {
      setHasCheckedIn(false);
    }
  }, [venueFromStore]);

  useEffect(() => {
    if (venue) return;

    const fetchVenueDetail = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/venues/${venueId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!response.ok) throw new Error("Error al cargar el local");
        const result = await response.json();
        setVenue(result);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetail();
  }, [venueId]);

  const onCheckIn = () => {
    setCheckingIn(true);
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
        setVenues(
          venues.map((v) =>
            v.id === venueId
              ? { ...v, check_ins: [...(v.check_ins || []), data.data] }
              : v,
          ),
        );
        setVenue((prev) =>
          prev
            ? { ...prev, check_ins: [...(prev.check_ins || []), data.data] }
            : prev,
        );
        setHasCheckedIn(true);
      })
      .finally(() => setCheckingIn(false));
  };

  const onCheckOut = () => {
    
    setCheckingOut(true);
    const token = getToken();
    console.log(venueId);

    // Coger el id del check-in desde el store
    const venueFromStore = venues.find((v) => v.id === venueId);
    console.log(venueFromStore);

    const checkInId = venueFromStore?.check_ins?.[0]?.id;
    console.log(checkInId);

    if (!checkInId) {
      setCheckingOut(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${checkInId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: false }),
    })
      .then((res) => res.json())
      .then(() => {
        setVenues(
          venues.map((v) => (v.id === venueId ? { ...v, check_ins: [] } : v)),
        );
        setVenue((prev) => (prev ? { ...prev, check_ins: [] } : prev));
        setHasCheckedIn(false);
      })
      .finally(() => setCheckingOut(false));
  };

  const toggleFavorite = () => {
    setTogglingFavorite(true);
    const token = getToken();
    const isFavorite = venueFromStore?.is_favorite || false;

    if (isFavorite) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => {
          setVenues(
            venues.map((v) =>
              v.id === venueId ? { ...v, is_favorite: false } : v,
            ),
          );
          setUserFavorites(
            userFavorites.filter((id) => String(id) !== venueId),
          );
        })
        .finally(() => setTogglingFavorite(false));
    } else {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ venue_id: venueId }),
      })
        .then(() => {
          setVenues(
            venues.map((v) =>
              v.id === venueId ? { ...v, is_favorite: true } : v,
            ),
          );
          setUserFavorites([...userFavorites, venueId as unknown as number]);
        })
        .finally(() => setTogglingFavorite(false));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-white text-xl font-bold mb-2">
            Local no encontrado
          </h2>
          <p className="text-gray-400 mb-6">
            El local que buscas no existe o ha sido eliminado
          </p>
          <button
            onClick={() => router.back()}
            className="bg-ozio-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-ozio-blue/80 transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents =
    venue.events
      ?.filter((event) => new Date(event.starts_at) > new Date())
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ) || [];

  const totalCheckIns = venue.check_ins?.length || 0;

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* ── Imagen hero ─────────────────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 lg:h-[460px]">
        <img
          src={venue.avatar_path || "https://via.placeholder.com/800x600"}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-ozio-dark" />

        {/* Botones top */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-16 max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition border border-white/10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex gap-2">
            {isUserProfile && (
              <button
                onClick={toggleFavorite}
                disabled={togglingFavorite}
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition border border-white/10 ${
                  venueFromStore?.is_favorite
                    ? "bg-red-600/80"
                    : "bg-black/50 hover:bg-black/70"
                } ${togglingFavorite ? "opacity-70" : ""}`}
              >
                {togglingFavorite ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill={venueFromStore?.is_favorite ? "currentColor" : "none"}
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
                )}
              </button>
            )}
          </div>
        </div>

        {/* Badge visitas */}
        <div className="absolute bottom-4 left-4 md:left-8">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium border border-white/10 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-ozio-orange"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {totalCheckIns} visitas
          </div>
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-6 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* ── Columna izquierda ── */}
          <div className="space-y-6">
            {/* Info principal + acciones */}
            <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
              <h1 className="text-white text-3xl font-bold mb-4">
                {venue.name}
              </h1>

              {venue.description && (
                <p className="text-gray-300 leading-relaxed mb-6">
                  {venue.description}
                </p>
              )}

              {venue.address && (
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-ozio-purple to-ozio-blue rounded-xl flex items-center justify-center flex-shrink-0">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-1">Dirección</p>
                    <p className="text-white font-semibold">{venue.address}</p>
                  </div>
                </div>
              )}

              {isUserProfile &&
                (hasCheckedIn ? (
                  <button
                    onClick={onCheckOut}
                    disabled={checkingOut}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white transition flex items-center justify-center gap-2"
                  >
                    {checkingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        Eliminando check-in...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6"
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
                        Quitar check-in
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onCheckIn}
                    disabled={checkingIn}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-ozio-orange to-red-500 disabled:opacity-70 text-white hover:shadow-2xl hover:scale-[1.02] transition flex items-center justify-center gap-2"
                  >
                    {checkingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        Haciendo check-in...
                      </>
                    ) : (
                      "📍 Hacer Check-in"
                    )}
                  </button>
                ))}
            </div>

            {/* Eventos — columna izquierda en desktop */}
            {upcomingEvents.length > 0 && (
              <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 lg:block hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-lg">
                    Próximos eventos
                  </h2>
                  <span className="bg-ozio-purple/20 text-ozio-purple text-xs px-3 py-1 rounded-full font-medium">
                    {upcomingEvents.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <EventMiniCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* Mapa */}
            <div className="bg-ozio-card border border-gray-700/50 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-white font-bold text-lg">Ubicación</h2>
              </div>
              <div className="h-64 md:h-80 relative overflow-hidden">
                <iframe
                  src={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-4">
                <button
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`,
                      "_blank",
                    )
                  }
                  className="w-full bg-ozio-blue/20 hover:bg-ozio-blue/30 border border-ozio-blue/30 text-ozio-blue py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Abrir en Google Maps
                </button>
              </div>
            </div>

            {/* Eventos — móvil/tablet */}
            {upcomingEvents.length > 0 && (
              <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 lg:hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-lg">
                    Próximos eventos
                  </h2>
                  <span className="bg-ozio-purple/20 text-ozio-purple text-xs px-3 py-1 rounded-full font-medium">
                    {upcomingEvents.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <EventMiniCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventMiniCard({ event }: { event: Event }) {
  const router = useRouter();
  const startDate = new Date(event.starts_at);

  return (
    <div
      className="bg-ozio-dark border border-gray-700/50 rounded-2xl p-4 hover:border-ozio-blue/50 transition cursor-pointer"
      onClick={() => {
        const eventData = encodeURIComponent(JSON.stringify(event));
        router.push(`/events/${event.id}?data=${eventData}`);
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-ozio-purple to-ozio-blue rounded-xl flex flex-col items-center justify-center">
          <span className="text-white text-xs font-medium">
            {startDate
              .toLocaleDateString("es-ES", { month: "short" })
              .toUpperCase()}
          </span>
          <span className="text-white text-2xl font-bold">
            {startDate.getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-gray-400 text-sm line-clamp-1 mb-2">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-gray-400 text-xs">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {startDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {event.image_path && (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
            <img
              src={event.image_path}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-gray-400"
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
      </div>

      {event.featured && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <span className="bg-ozio-blue/20 text-ozio-blue text-xs px-2 py-1 rounded-full font-medium">
            ⭐ Destacado
          </span>
        </div>
      )}
    </div>
  );
}
