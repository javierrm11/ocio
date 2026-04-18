"use client";
import { useRouter } from "next/navigation";
import { Venue, ScheduleDay } from "./types";

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getOpenStatus(schedule: ScheduleDay[] | undefined): { open: boolean; label: string } | null {
  if (!schedule?.length) return null;
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const now = new Date();
  const todayName = dayNames[now.getDay()];
  const today = schedule.find(d => d.day === todayName);
  if (!today) return null;
  if (today.is_closed) return { open: false, label: `Cerrado hoy` };
  const cur = now.getHours() * 60 + now.getMinutes();
  const op = parseTime(today.open);
  const cl = parseTime(today.close);
  const isOpen = cl < op ? (cur >= op || cur < cl) : (cur >= op && cur < cl);
  return {
    open: isOpen,
    label: isOpen ? `Abierto · Cierra ${today.close}` : `Cerrado · Abre ${today.open}`,
  };
}
import {
  getEventStatus,
  getActiveOrSoonEvent,
  formatEventTime,
  parseDistanceToKm,
  getHeatStep,
  getHeatCategory,
  getHeatLabel,
  getMadridHour,
} from "./utils";
import { isPremium } from "@/lib/hooks/plan";

interface VenuePanelProps {
  venue: Venue;
  onClose: () => void;
  onCheckIn: (venueId: string) => void;
  onCheckOut: (venueId: string) => void;
  onToggleFavorite: (venueId: string, isFavorite: boolean) => void;
  isUserProfile: boolean;
  currentProfileId: string | undefined;
  loadingRoute: boolean;
  onFetchRoute: (lat: number, lng: number) => void;
}

export function VenuePanel({
  venue,
  onClose,
  onCheckIn,
  onCheckOut,
  onToggleFavorite,
  isUserProfile,
  currentProfileId,
  loadingRoute,
  onFetchRoute,
}: VenuePanelProps) {
  const router = useRouter();

  const checkins = venue.check_ins?.length || 0;
  const heatStep = getHeatStep(checkins);
  const heatCategory = getHeatCategory(heatStep);
  const heatLabel = getHeatLabel(heatStep);
  const heatState =
    heatCategory === "tranquilo" ? "cool"
    : heatCategory === "animado" ? "warm"
    : heatCategory === "muy_animado" ? "hot"
    : "full";

  const hasUserActiveCheckIn = Boolean(
    venue.check_ins?.some(
      (c: any) => c.active && (!currentProfileId || c.profile_id === currentProfileId),
    ),
  );

  const eventStatus = getEventStatus(venue);
  const activeOrSoonEvent = getActiveOrSoonEvent(venue);

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const activeEvents = venue.events?.filter(
    (e) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
  ) || [];
  const soonEvents = venue.events?.filter((e) => {
    const start = new Date(e.starts_at);
    return start > now && start <= in24h;
  }) || [];

  const distKm = parseDistanceToKm(venue.distance);
  const isKnownDist = distKm !== Number.POSITIVE_INFINITY;
  const distLabel = isKnownDist
    ? distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`
    : "Desconocida";
  const driveMin = isKnownDist ? Math.round(distKm * 0.6) : null;

  const trendDelta =
    heatState === "full"
      ? Math.max(6, Math.round(checkins * 2))
      : heatState === "hot"
        ? Math.max(3, Math.round(checkins * 1.5))
        : heatState === "warm"
          ? Math.round(checkins * 0.6)
          : 0;
  const direction =
    heatState === "full" ? "Llenazo"
    : heatState === "hot" ? "Subiendo"
    : heatState === "warm" ? "Estable"
    : "Bajando";
  const directionColor =
    heatState === "full" ? "text-ambience-high"
    : heatState === "hot" ? "text-orange-400"
    : heatState === "warm" ? "text-ozio-orange"
    : "text-ambience-low";
  const dirArrow =
    heatState === "full" ? "↑↑" : heatState === "hot" ? "↑" : heatState === "warm" ? "→" : "↓";

  const openStatus = getOpenStatus(venue.schedule);

  const currentHour = getMadridHour();
  const peakHourNum = venue.peak_hour ? parseInt(venue.peak_hour) : null;
  const hourDiff = peakHourNum !== null
    ? Math.min(Math.abs(currentHour - peakHourNum), 24 - Math.abs(currentHour - peakHourNum))
    : null;
  const peakContext =
    hourDiff === null ? null
    : hourDiff === 0 ? { label: "¡Es ahora!", color: "text-ozio-orange" }
    : hourDiff <= 2 ? { label: `En ${hourDiff}h`, color: "text-yellow-400" }
    : { label: venue.peak_hour!, color: "text-ozio-text-muted" };

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[989] md:hidden" onClick={onClose} />

      {/* Panel */}
      <aside
        className="fixed z-[1002] bg-ozio-dark overflow-y-auto bottom-0 left-0 right-0 rounded-t-3xl max-h-[90dvh] animate-slide-up md:bottom-0 md:top-0 md:left-auto md:right-0 md:rounded-none md:w-96 md:max-h-full md:h-full md:animate-slide-right lg:w-[420px]"
        aria-label={`Detalles de ${venue.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <figure className="relative h-56 md:h-64 lg:h-72 overflow-hidden rounded-t-3xl md:rounded-none flex-shrink-0 m-0">
          <img
            src={venue.avatar_path}
            alt={venue.name}
            className="w-full h-full object-cover"
          />

          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            title="Cerrar panel"
            className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
          >
            <svg className="w-6 h-6 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Heat badge */}
          <div
            className="absolute top-4 left-4 text-ozio-text text-xs font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor:
                heatState === "full"   ? "#b91c1c"
                : heatState === "hot"  ? "#ef4444"
                : heatState === "warm" ? "#f59e0b"
                :                       "#10b981",
            }}
          >
            {heatLabel}
          </div>

          {/* Active/upcoming event banner */}
          {activeOrSoonEvent && eventStatus !== "none" && (
            <div
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-ozio-text text-xs font-semibold"
              style={{
                backgroundColor:
                  eventStatus === "active"
                    ? "rgba(168,85,247,0.85)"
                    : "rgba(249,115,22,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="text-base">{eventStatus === "active" ? "🎉" : "🕐"}</span>
              <div>
                <p className="font-bold leading-tight">{activeOrSoonEvent.title}</p>
                <p className="opacity-90 leading-tight">{formatEventTime(activeOrSoonEvent)}</p>
              </div>
            </div>
          )}
        </figure>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            {/* Name + premium */}
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-ozio-text text-2xl font-bold">{venue.name}</h2>
              {isPremium(venue) && <span className="premium-badge">👑 PREMIUM</span>}
            </div>

            {/* Open status */}
            {openStatus && (
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${openStatus.open ? 'bg-ambience-low/15 text-ambience-low border border-ambience-low/30' : 'bg-white/5 text-ozio-text-muted border border-white/10'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${openStatus.open ? 'bg-ambience-low animate-pulse' : 'bg-ozio-text-muted'}`} />
                  {openStatus.label}
                </span>
              </div>
            )}

            {/* Distance */}
            <div className="flex items-center gap-3 text-ozio-text-muted text-sm mt-1">
              <span className="flex items-center gap-1">📍 A {distLabel}</span>
              <span>-</span>
              {driveMin !== null && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-ozio-text-subtle" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                  {driveMin} min
                </span>
              )}
            </div>

            {/* Heat card */}
            <div className={`mt-3 rounded-2xl p-3 border heat-card-${heatState}`}>
              {/* Segments */}
              <div className="flex gap-1.5 mb-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-4 rounded-full transition-all duration-500 ${
                      i < heatStep
                        ? `heat-seg-pos-${i} heat-seg-anim heat-seg-delay-${i}`
                        : "bg-white/8"
                    }`}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {heatState === "full" ? "🔴" : heatState === "hot" ? "🟠" : heatState === "warm" ? "🟡" : "🟢"}
                  </span>
                  <span className="text-ozio-text font-black text-base">{heatLabel}</span>
                </div>
                <span className={`text-sm font-black heat-count-${heatState}`}>
                  {heatStep * 10}%
                </span>
              </div>
            </div>

            {/* Trend indicators */}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                <span className="text-lg">{trendDelta > 0 ? "📈" : "📉"}</span>
                <div>
                  <p className="text-ozio-text/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">15 min</p>
                  <p className={`text-xs font-black ${trendDelta > 0 ? "text-ambience-low" : "text-ambience-high"}`}>
                    {trendDelta > 0 ? `+${trendDelta} personas` : "Sin cambios"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                <span className={`text-xl font-black leading-none ${directionColor}`}>{dirArrow}</span>
                <div>
                  <p className="text-ozio-text/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">Tendencia</p>
                  <p className={`text-xs font-black ${directionColor}`}>{direction}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 px-3 py-2.5">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-ozio-text/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">Hora pico</p>
                  <p className="text-ozio-text text-xs font-black">{venue.peak_hour ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-ozio-blue/10 border border-ozio-blue/20 px-3 py-2.5">
                <span className="text-lg">🕑</span>
                <div>
                  <p className="text-ozio-text/35 text-[9px] uppercase tracking-widest font-semibold mb-0.5">Ahora</p>
                  {peakContext
                    ? <p className={`text-xs font-black ${peakContext.color}`}>{peakContext.label}</p>
                    : <p className="text-ozio-text-muted text-xs font-black">Sin datos</p>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Genres */}
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

          {/* Active events */}
          {activeEvents.length > 0 && (
            <section className="bg-ozio-card border border-ambience-low/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-ambience-low rounded-full animate-pulse" />
                <h3 className="text-ozio-text font-semibold text-sm">Evento en curso</h3>
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
                      <img src={event.image_path} alt={event.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ambience-low to-ambience-low/70 flex items-center justify-center flex-shrink-0">
                        <span className="text-ozio-text text-lg">🎉</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-ozio-text text-sm font-semibold truncate">{event.title}</p>
                      <p className="text-ambience-low text-xs">{formatEventTime(event)}</p>
                    </div>
                    <svg className="w-4 h-4 text-ozio-text-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming events */}
          {soonEvents.length > 0 && (
            <section className="bg-ozio-card border border-ozio-orange/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-400 text-sm">🕐</span>
                <h3 className="text-ozio-text font-semibold text-sm">Próximamente hoy</h3>
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
                        <span className="text-ozio-text text-lg">🕐</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-ozio-text text-sm font-semibold truncate">{event.title}</p>
                      <p className="text-orange-400 text-xs">{formatEventTime(event)}</p>
                    </div>
                    <svg className="w-4 h-4 text-ozio-text-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="flex flex-wrap items-center gap-2" aria-label="Acciones">
            {isUserProfile &&
              (hasUserActiveCheckIn ? (
                <button
                  type="button"
                  className="w-full bg-ambience-high hover:bg-ambience-high/80 text-ozio-text font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                  onClick={() => onCheckOut(venue.id)}
                >
                  Quitar check-in
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full bg-ozio-blue hover:bg-ozio-blue/80 text-ozio-text font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                  onClick={() => onCheckIn(venue.id)}
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
                className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                onClick={() => router.push(`/venues/${venue.id}`)}
              >
                Ir ahora
              </button>
              <button
                type="button"
                disabled={loadingRoute}
                className="flex-1 bg-ozio-blue hover:bg-ozio-blue/80 disabled:opacity-60 text-ozio-text font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                onClick={() => onFetchRoute(venue.latitude, venue.longitude)}
              >
                {loadingRoute ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : ""}
                {loadingRoute ? "Calculando..." : "Cómo llegar"}
              </button>

              {isUserProfile && (
                <button
                  type="button"
                  aria-label={venue.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                  title={venue.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                  className={`aspect-square py-3 px-4 rounded-full flex items-center justify-center transition ${
                    venue.is_favorite
                      ? "bg-ambience-high hover:bg-ambience-high/80 text-ozio-text"
                      : "bg-ozio-card hover:bg-ozio-card/80 text-ozio-text"
                  }`}
                  onClick={() => onToggleFavorite(venue.id, venue.is_favorite || false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill={venue.is_favorite ? "currentColor" : "none"}
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
          </section>
        </div>
      </aside>

      {/* Desktop backdrop */}
      <div className="hidden md:block fixed inset-0 z-[988]" onClick={onClose} />
    </>
  );
}
