"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";
import { CalendarDays, MapPin, Heart } from "lucide-react";

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
  profile_id: string;
  venue_id: string;
  created_at: string;
  active: boolean;
}
interface Genre {
  genre: any;
  id: number;
  name: string;
  slug: string;
  emoji: string;
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
  genres?: Genre[];
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
  const [activeTab, setActiveTab] = useState<"events" | "location">("events");

  const isUserProfile =
    currentUser?.username !== undefined && currentUser?.username !== null;
  const currentProfileId = currentUser?.id;

  useEffect(() => {
    const hasActive = venueFromStore?.check_ins?.some(
      (c: CheckIn) => c.active && (!currentProfileId || c.profile_id === currentProfileId),
    ) ?? false;
    setHasCheckedIn(hasActive);
  }, [venueFromStore, currentProfileId]);

  useEffect(() => {
    if (venue) return;

    const fetchVenueDetail = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/venues/${venueId}`,
          { headers: { Authorization: `Bearer ${token}` } },
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ venue_id: venueId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const created = Array.isArray(data?.data) ? data.data[0] : data?.data;
        if (!created) return;
        setVenues(
          venues.map((v) =>
            v.id === venueId
              ? { ...v, check_ins: [...(v.check_ins || []).filter((c: CheckIn) => c.id !== created.id), created] }
              : v,
          ),
        );
        setVenue((prev) =>
          prev
            ? { ...prev, check_ins: [...(prev.check_ins || []).filter((c: CheckIn) => c.id !== created.id), created] }
            : prev,
        );
      })
      .finally(() => setCheckingIn(false));
  };

  const onCheckOut = () => {
    // Busca el check-in activo del usuario actual
    const myCheckIn = venues
      .find((v) => v.id === venueId)
      ?.check_ins?.find((c: CheckIn) => c.profile_id === currentProfileId);

    if (!myCheckIn) return;
    setCheckingOut(true);
    const token = getToken();

    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins/${myCheckIn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: false }),
    })
      .then((res) => res.json())
      .then(() => {
        // Elimina del estado local (la API ya lo guarda como histórico con active:false)
        setVenues(
          venues.map((v) =>
            v.id === venueId
              ? { ...v, check_ins: (v.check_ins || []).filter((c: CheckIn) => c.id !== myCheckIn.id) }
              : v,
          ),
        );
        setVenue((prev) =>
          prev
            ? { ...prev, check_ins: (prev.check_ins || []).filter((c: CheckIn) => c.id !== myCheckIn.id) }
            : prev,
        );
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

  const now = new Date();

  const activeEvents =
    venue.events?.filter(
      (e) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
    ) || [];

  const upcomingEvents =
    venue.events
      ?.filter((e) => new Date(e.starts_at) > now)
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ) || [];

  const totalCheckIns = venue.check_ins?.length || 0;

  return (
    <div className="bg-ozio-dark">
    <div className="min-h-screen bg-ozio-dark pb-24 max-w-4xl mx-auto">

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      {/* ── Avatar + Stats (estilo Instagram) ── */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-5">

          {/* Avatar con anillo degradado + botón volver */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="absolute -top-1 -left-1 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 flex items-center justify-center z-10 transition"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-[82px] h-[82px] rounded-full p-[2.5px] bg-gradient-to-tr from-ozio-orange via-ozio-purple to-ozio-blue">
              {venue.avatar_path ? (
                <img
                  src={venue.avatar_path}
                  alt={venue.name}
                  className="w-full h-full rounded-full object-cover border-2 border-ozio-dark"
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-ozio-dark bg-gradient-to-br from-ozio-orange to-ozio-purple flex items-center justify-center">
                  <span className="text-white text-2xl font-black">{venue.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-1 items-center justify-around">
            <div className="text-center">
              <p className="text-white text-xl font-black leading-none">{totalCheckIns}</p>
              <p className="text-gray-400 text-xs mt-1">Visitas</p>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <p className="text-white text-xl font-black leading-none">{venue.events?.length || 0}</p>
              <p className="text-gray-400 text-xs mt-1">Eventos</p>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <p className="text-white text-xl font-black leading-none">
                {activeEvents.length > 0 ? (
                  <span className="text-green-400">{activeEvents.length}</span>
                ) : 0}
              </p>
              <p className="text-gray-400 text-xs mt-1">En curso</p>
            </div>
          </div>
        </div>

        {/* ── Nombre + badge + dirección ── */}
        <div className="mt-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-black text-base leading-tight">{venue.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-ozio-orange/10 text-ozio-orange border-ozio-orange/25">
              Local
            </span>
          </div>
          {venue.address && (
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
              <MapPin size={12} className="text-ozio-orange flex-shrink-0" />
              {venue.address}
            </p>
          )}
          {venue.description && (
            <p className="text-gray-300 text-sm mt-1.5 leading-relaxed">{venue.description}</p>
          )}
          {/* ── Géneros musicales (solo venue) ── */}
              {venue.genres && venue.genres.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {venue.genres.map((item) => {
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
        </div>

        {/* ── Botones de acción ── */}
        <div className="flex gap-2 mb-4">
          {isUserProfile && (
            hasCheckedIn ? (
              <button
                onClick={onCheckOut}
                disabled={checkingOut}
                className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {checkingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Quitar check-in
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onCheckIn}
                disabled={checkingIn}
                className="flex-1 py-2 bg-gradient-to-r from-ozio-orange to-red-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {checkingIn ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                ) : (
                  "📍 Hacer Check-in"
                )}
              </button>
            )
          )}
          {isUserProfile && (
            <button
              onClick={toggleFavorite}
              disabled={togglingFavorite}
              className={`w-10 border rounded-xl transition flex items-center justify-center disabled:opacity-70 ${
                venueFromStore?.is_favorite
                  ? "bg-red-600/20 border-red-600/40 text-red-400"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {togglingFavorite ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
              ) : (
                <Heart size={16} fill={venueFromStore?.is_favorite ? "currentColor" : "none"} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs solo iconos ── */}
      <div className="flex border-t border-b border-gray-800">
        <button
          onClick={() => setActiveTab("events")}
          className={`flex-1 py-3 flex justify-center transition ${activeTab === "events" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}
        >
          <CalendarDays size={22} />
        </button>
        <button
          onClick={() => setActiveTab("location")}
          className={`flex-1 py-3 flex justify-center transition ${activeTab === "location" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}
        >
          <MapPin size={22} />
        </button>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 pt-4 space-y-3">

        {/* Eventos */}
        {activeTab === "events" && (
          <>
            {activeEvents.length > 0 && (
              <div className="bg-ozio-card border border-green-500/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    En curso
                  </h2>
                  <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-green-500/30">
                    {activeEvents.length} activo{activeEvents.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {activeEvents.map((event) => (
                    <EventMiniCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold px-1">Próximos</p>
                {upcomingEvents.map((event) => (
                  <EventMiniCard key={event.id} event={event} />
                ))}
              </div>
            ) : activeEvents.length === 0 && (
              <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-white font-semibold mb-1">Sin eventos</p>
                <p className="text-gray-500 text-sm">No hay eventos programados</p>
              </div>
            )}
          </>
        )}

        {/* Ubicación */}
        {activeTab === "location" && (
          <div className="bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="h-72 relative overflow-hidden">
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
                onClick={() => window.open(`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`, "_blank")}
                className="w-full bg-ozio-blue/20 hover:bg-ozio-blue/30 border border-ozio-blue/30 text-ozio-blue py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <MapPin size={18} />
                Abrir en Google Maps
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function EventMiniCard({ event }: { event: Event }) {
  const router = useRouter();
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const now = new Date();
  const isActive = startDate <= now && endDate >= now;

  return (
    <div
      className="bg-ozio-dark border border-gray-700/50 rounded-2xl p-4 hover:border-ozio-blue/50 transition cursor-pointer"
      onClick={() => {
        const eventData = encodeURIComponent(JSON.stringify(event));
        router.push(`/events/${event.id}?data=${eventData}`);
      }}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br ${isActive ? "from-green-600 to-green-700" : "from-ozio-purple to-ozio-blue"}`}>
          {isActive ? (
            <>
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse mb-1" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </>
          ) : (
            <>
              <span className="text-white text-xs font-medium">
                {startDate.toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}
              </span>
              <span className="text-white text-2xl font-bold">{startDate.getDate()}</span>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-gray-400 text-sm line-clamp-1 mb-2">{event.description}</p>
          )}
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {isActive
                ? `Hasta las ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                : startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {event.image_path && (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
            <img src={event.image_path} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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