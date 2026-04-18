"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";
import { CalendarDays, MapPin, Heart, Clock } from "lucide-react";
import Header from "@/components/layout/header";

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
interface Story {
  id?: string;
  venue_id: string;
  media_type: string;
  media_path: string;
  created_at: string;
  expires_at: string;
  venues: { name: string; avatar_path?: string };
}
interface Genre {
  genre: any;
  id: number;
  name: string;
  slug: string;
  emoji: string;
}
interface ScheduleDay {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
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
  plan?: string;
  schedule?: ScheduleDay[];
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
  const [activeTab, setActiveTab] = useState<"events" | "location" | "schedule">("events");
  const [venueStories, setVenueStories] = useState<Story[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

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
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories?venue_id=${venueId}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setVenueStories(data); })
      .catch(() => {});
  }, [venueId]);

  const hasStories = venueStories.length > 0;
  const currentStory = venueStories[storyIndex] ?? null;

  const openStories = () => { setShowStoryViewer(true); setStoryIndex(0); };
  const closeStories = () => { setShowStoryViewer(false); setStoryIndex(0); };
  const nextStory = () => {
    if (storyIndex < venueStories.length - 1) setStoryIndex((i) => i + 1);
    else closeStories();
  };
  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex((i) => i - 1);
  };

  useEffect(() => {
    if (!showStoryViewer) return;
    const timer = setTimeout(nextStory, 15000);
    return () => clearTimeout(timer);
  }, [showStoryViewer, storyIndex]);

  useEffect(() => {
    if (!venue) return;

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
      <main className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-ozio-text text-xl font-bold mb-2">
            Local no encontrado
          </h1>
          <p className="text-ozio-text-muted mb-6">
            El local que buscas no existe o ha sido eliminado
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-ozio-blue text-ozio-text px-6 py-3 rounded-xl font-medium hover:bg-ozio-blue/80 transition"
          >
            Volver
          </button>
        </div>
      </main>
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

      {/* Spacer for fixed header */}
      <Header/>
      <main className="min-h-screen bg-ozio-dark pb-24 max-w-4xl mx-auto">

      {/* ── Avatar + Stats (estilo Instagram) ── */}
      <header className="px-4 pt-4">
        <div className="flex items-center gap-5">

          {/* Avatar con anillo degradado + botón volver */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="absolute -top-1 -left-1 w-6 h-6 bg-ozio-card hover:bg-ozio-card/70 rounded-full border border-ozio-card/70 flex items-center justify-center z-10 transition"
            >
              <svg className="w-3.5 h-3.5 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              className={`w-[82px] h-[82px] rounded-full p-[2.5px] transition ${hasStories ? "bg-gradient-to-tr from-ozio-blue/70 to-ozio-blue cursor-pointer" : "bg-gradient-to-tr from-ozio-orange via-ozio-purple to-ozio-blue"}`}
              onClick={hasStories ? openStories : undefined}
            >
              {venue.avatar_path ? (
                <img
                  src={venue.avatar_path}
                  alt={venue.name}
                  className="w-full h-full rounded-full object-cover border-2 border-ozio-dark"
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-ozio-dark bg-gradient-to-br from-ozio-orange to-ozio-purple flex items-center justify-center">
                  <span className="text-ozio-text text-2xl font-black">{venue.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-1 items-center justify-around">
            <div className="text-center">
              <p className="text-ozio-text text-xl font-black leading-none">{totalCheckIns}</p>
              <p className="text-ozio-text-muted text-xs mt-1">Visitas</p>
            </div>
            <div className="w-px h-8 bg-ozio-card" />
            <div className="text-center">
              <p className="text-ozio-text text-xl font-black leading-none">{venue.events?.length || 0}</p>
              <p className="text-ozio-text-muted text-xs mt-1">Eventos</p>
            </div>
            
          </div>
        </div>

        {/* ── Nombre + badge + dirección ── */}
        <div className="mt-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-ozio-text font-black text-base leading-tight">{venue.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-ozio-orange/10 text-ozio-orange border-ozio-orange/25">
              Local
            </span>
          </div>
          {venue.address && (
            <address className="text-ozio-text-subtle text-sm mt-0.5 flex items-center gap-1 not-italic">
              <MapPin size={12} className="text-ozio-orange flex-shrink-0" />
              {venue.address}
            </address>
          )}
          {venue.description && (
            <p className="text-ozio-text-secondary text-sm mt-1.5 leading-relaxed">{venue.description}</p>
          )}
          {/* ── Géneros musicales (solo venue) ── */}
              {venue.genres && venue.genres.length > 0 && (
                <div className="mt-3">
                  <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                    {venue.genres.map((item) => {
                      const genre = item.genre || item;
                      return (
                        <li key={genre.slug}>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-ozio-purple/10 text-ozio-purple border border-ozio-purple/25">
                            <span>{genre.emoji}</span>
                            <span>{genre.name}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
        </div>

        {/* ── Botones de acción ── */}
        <div className="flex gap-2 mb-4">
          {isUserProfile && (
            hasCheckedIn ? (
              <button
                type="button"
                onClick={onCheckOut}
                disabled={checkingOut}
                className="flex-1 py-2 bg-ambience-high/20 hover:bg-ambience-high/30 border border-ambience-high/40 text-ambience-high text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {checkingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-ambience-high" />
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
                type="button"
                onClick={onCheckIn}
                disabled={checkingIn}
                className="flex-1 py-2 bg-gradient-to-r from-ozio-orange to-ambience-high hover:opacity-90 text-ozio-text text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-70"
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
              type="button"
              onClick={toggleFavorite}
              disabled={togglingFavorite}
              className={`w-10 border rounded-xl transition flex items-center justify-center disabled:opacity-70 ${
                venueFromStore?.is_favorite
                  ? "bg-ambience-high/20 border-ambience-high/40 text-ambience-high"
                  : "bg-ozio-card border-ozio-card/70 text-ozio-text-secondary hover:bg-ozio-card/70"
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
      </header>

      {/* ── Tabs solo iconos ── */}
      <nav className="flex border-t border-b border-ozio-darker" aria-label="Navegación del local">
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          aria-label="Eventos"
          aria-current={activeTab === "events" ? "page" : undefined}
          className={`flex-1 py-3 flex justify-center transition ${activeTab === "events" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}
        >
          <CalendarDays size={22} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("location")}
          aria-label="Ubicación"
          aria-current={activeTab === "location" ? "page" : undefined}
          className={`flex-1 py-3 flex justify-center transition ${activeTab === "location" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}
        >
          <MapPin size={22} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          aria-label="Horarios"
          aria-current={activeTab === "schedule" ? "page" : undefined}
          className={`flex-1 py-3 flex justify-center transition ${activeTab === "schedule" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}
        >
          <Clock size={22} />
        </button>
      </nav>

      {/* ── Tab content ── */}
      <section className="px-4 pt-4 space-y-3">

        {/* Eventos */}
        {activeTab === "events" && (
          <>
            {activeEvents.length > 0 && (
              <section className="bg-ozio-card border border-ambience-low/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-ozio-text font-bold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-ambience-low rounded-full animate-pulse" />
                    En curso
                  </h2>
                  <span className="bg-ambience-low/20 text-ambience-low text-[10px] px-2 py-0.5 rounded-full font-medium border border-ambience-low/30">
                    {activeEvents.length} activo{activeEvents.length > 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="space-y-3">
                  {activeEvents.map((event) => (
                    <li key={event.id}>
                      <EventMiniCard event={event} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-ozio-text-subtle text-xs uppercase tracking-widest font-semibold px-1">Próximos</h2>
                <ul className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <EventMiniCard event={event} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : activeEvents.length === 0 && (
              <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-ozio-text font-semibold mb-1">Sin eventos</p>
                <p className="text-ozio-text-subtle text-sm">No hay eventos programados</p>
              </div>
            )}
          </>
        )}

        {/* Horarios */}
        {activeTab === "schedule" && (
          <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl overflow-hidden">
            {venue.schedule?.length ? (
              <ScheduleTable schedule={venue.schedule} />
            ) : (
              <div className="p-10 text-center">
                <p className="text-4xl mb-3">🕐</p>
                <p className="text-ozio-text font-semibold mb-1">Sin horario configurado</p>
                <p className="text-ozio-text-subtle text-sm">El local aún no ha publicado sus horarios</p>
              </div>
            )}
          </div>
        )}

        {/* Ubicación */}
        {activeTab === "location" && (
          <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl overflow-hidden">
            <div className="h-72 relative overflow-hidden">
              <iframe
                title={`Mapa de ${venue.name}`}
                src={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`}
                width="100%"
                height="100%"
                className="border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-4">
              <button
                type="button"
                onClick={() => window.open(`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`, "_blank")}
                className="w-full bg-ozio-blue/20 hover:bg-ozio-blue/30 border border-ozio-blue/30 text-ozio-blue py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <MapPin size={18} />
                Abrir en Google Maps
              </button>
            </div>
          </div>
        )}
      </section>
    </main>

    {/* ── Story Viewer ── */}
    {showStoryViewer && currentStory && (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={`Historias de ${venue.name}`}
      >
        {/* Barras de progreso */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
          {venueStories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-ozio-card rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                index < storyIndex ? "bg-white w-full" :
                index === storyIndex ? "bg-white animate-story-progress" : "w-0"
              }`} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-ozio-blue/70 to-ozio-blue p-0.5">
              {venue.avatar_path ? (
                <img src={venue.avatar_path} alt={venue.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-ozio-card/70 flex items-center justify-center text-ozio-text text-xs font-bold">
                  {venue.name[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-ozio-text font-semibold text-sm">{venue.name}</span>
            <span className="text-ozio-text-muted text-xs">
              {storyIndex + 1}/{venueStories.length} · {new Date(currentStory.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <button type="button" onClick={closeStories} aria-label="Cerrar historias" className="text-ozio-text hover:text-ozio-text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.media_type === "video" ? (
            <video
              key={currentStory.media_path}
              src={currentStory.media_path}
              className="max-w-full max-h-full object-contain"
              autoPlay
              onEnded={nextStory}
            />
          ) : (
            <img
              key={currentStory.media_path}
              src={currentStory.media_path}
              alt="Historia"
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Zonas táctiles */}
          <div className="absolute inset-0 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
            <div className="w-1/3 h-full" />
            <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
          </div>
        </div>
      </div>
    )}

    <style>{`
      @keyframes story-progress { from { width: 0% } to { width: 100% } }
      .animate-story-progress { animation: story-progress 15s linear forwards; }
    `}</style>
    </div>
  );
}

function ScheduleTable({ schedule }: { schedule: ScheduleDay[] }) {
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const todayName = dayNames[new Date().getDay()];

  function parseTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function isOpenNow(d: ScheduleDay): boolean {
    if (d.is_closed) return false;
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    const op = parseTime(d.open);
    const cl = parseTime(d.close);
    return cl < op ? (cur >= op || cur < cl) : (cur >= op && cur < cl);
  }

  return (
    <div className="divide-y divide-ozio-darker">
      {schedule.map((d) => {
        const isToday = d.day === todayName;
        const openNow = isToday && isOpenNow(d);
        return (
          <div key={d.day} className={`flex items-center justify-between px-5 py-3.5 ${isToday ? 'bg-ozio-blue/5' : ''}`}>
            <div className="flex items-center gap-2">
              {isToday && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${openNow ? 'bg-ambience-low animate-pulse' : 'bg-ozio-text-muted'}`} />}
              <span className={`text-sm capitalize font-medium ${isToday ? 'text-ozio-text' : 'text-ozio-text-secondary'}`}>{d.day}</span>
              {isToday && <span className="text-[10px] text-ozio-blue font-semibold uppercase tracking-wide">hoy</span>}
            </div>
            {d.is_closed ? (
              <span className="text-ozio-text-muted text-sm">Cerrado</span>
            ) : (
              <span className={`text-sm ${isToday ? 'text-ozio-text font-semibold' : 'text-ozio-text-secondary'}`}>
                {d.open} – {d.close}
              </span>
            )}
          </div>
        );
      })}
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
    <article
      className="bg-ozio-dark border border-ozio-card/50 rounded-2xl p-4 hover:border-ozio-blue/50 transition cursor-pointer"
      onClick={() => {
        const eventData = encodeURIComponent(JSON.stringify(event));
        router.push(`/events/${event.id}?data=${eventData}`);
      }}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br ${isActive ? "from-ambience-low to-ambience-low/70" : "from-ozio-purple to-ozio-blue"}`}>
          {isActive ? (
            <>
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse mb-1" />
              <span className="text-ozio-text text-xs font-bold">LIVE</span>
            </>
          ) : (
            <time dateTime={event.starts_at} className="flex flex-col items-center">
              <span className="text-ozio-text text-xs font-medium">
                {startDate.toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}
              </span>
              <span className="text-ozio-text text-2xl font-bold">{startDate.getDate()}</span>
            </time>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-ozio-text font-bold truncate mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-ozio-text-muted text-sm line-clamp-1 mb-2">{event.description}</p>
          )}
          <div className="flex items-center gap-2 text-ozio-text-muted text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <time dateTime={isActive ? event.ends_at : event.starts_at}>
              {isActive
                ? `Hasta las ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                : startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
        </div>

        {event.image_path && (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
            <img src={event.image_path} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center">
          <svg className="w-5 h-5 text-ozio-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {event.featured && (
        <div className="mt-3 pt-3 border-t border-ozio-card/50">
          <span className="bg-ozio-blue/20 text-ozio-blue text-xs px-2 py-1 rounded-full font-medium">
            ⭐ Destacado
          </span>
        </div>
      )}
    </article>
  );
}