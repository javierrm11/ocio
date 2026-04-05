"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from "@/lib/stores/venueStore";
import { useState, useMemo, useRef, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}
interface Event {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  image_path: string | null;
  event_attendees?: any[];
  genres?: { genre: Genre; genre_id: number }[];
}

interface Venue {
  id: string;
  name: string;
  avatar_path?: string;
}

type FilterType = 'todos' | 'hoy' | 'semana' | 'activos';

export default function Eventos() {
  const router = useRouter();
  const { events, venues, loaded } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('todos');
  const [search, setSearch] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [generosSeleccionados, setGenerosSeleccionados] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const generosDisponibles = useMemo(() => {
    const all = (events as Event[]).flatMap((e) =>
      e.genres?.map((g) => ({ name: g.genre?.name ?? '', emoji: g.genre?.emoji ?? '🎵' })) || []
    );
    const seen = new Set<string>();
    return all.filter(({ name }) => {
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [events]);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFiltrosAbiertos(false);
      }
    }
    if (filtrosAbiertos) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtrosAbiertos]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  const now = new Date();

  const filteredEvents = (() => {
    let result = [...events] as Event[];

    if (search.trim()) {
      result = result.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (generosSeleccionados.size > 0) {
      result = result.filter((e) =>
        e.genres?.some((g) => generosSeleccionados.has(g.genre?.name ?? ''))
      );
    }

    switch (filter) {
      case 'activos':
        result = result.filter((e) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now);
        break;
      case 'hoy': {
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
        result = result.filter((e) => {
          const start = new Date(e.starts_at);
          return start >= startOfDay && start <= endOfDay;
        });
        break;
      }
      case 'semana': {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        result = result.filter((e) => {
          const start = new Date(e.starts_at);
          return start >= now && start <= endOfWeek;
        });
        break;
      }
      default:
        break;
    }

    result.sort((a, b) => {
      const aStart = new Date(a.starts_at).getTime();
      const aEnd = new Date(a.ends_at).getTime();
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      const nowMs = now.getTime();
      const aActive = aStart <= nowMs && aEnd >= nowMs;
      const bActive = bStart <= nowMs && bEnd >= nowMs;
      const aFuture = aStart > nowMs;
      const bFuture = bStart > nowMs;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return aStart - bStart;
    });

    return result;
  })();

  const activeCount = (events as Event[]).filter(
    (e: Event) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
  ).length;

  const todayCount = (events as Event[]).filter((e: Event) => {
    const start = new Date(e.starts_at);
    return start.toDateString() === now.toDateString();
  }).length;

  const weekCount = (events as Event[]).filter((e: Event) => {
    const start = new Date(e.starts_at);
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7);
    return start >= now && start <= endOfWeek;
  }).length;

  const filtrosActivos = (filter !== 'todos' ? 1 : 0) + generosSeleccionados.size;

  const filterOptions = [
    { key: 'todos', label: 'Todos los eventos', icon: '📋', desc: 'Ver toda la agenda completa', count: events.length },
    { key: 'activos', label: 'En curso ahora', icon: '🟢', desc: 'Eventos que están pasando', count: activeCount },
    { key: 'hoy', label: 'Hoy', icon: '📅', desc: 'Solo eventos de hoy', count: todayCount },
    { key: 'semana', label: 'Esta semana', icon: '🗓️', desc: 'Próximos 7 días', count: weekCount },
  ];

  const currentFilter = filterOptions.find(f => f.key === filter);

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">

      {/* Header */}
      <div className="bg-gradient-to-b from-ozio-purple/80 to-ozio-dark px-4 md:px-8 pt-4 pb-2">
        <div className="max-w-4xl mx-auto">

          {/* Título + badge activos */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-3xl font-bold">Eventos</h1>
            {activeCount > 0 && (
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {activeCount} en curso
              </span>
            )}
          </div>

          {/* Buscador + botón filtros */}
          <div className="flex items-center gap-2">
            {/* Input búsqueda */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-ozio-card border border-gray-700/50 rounded-md pl-10 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Botón filtros */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className={`relative flex items-center justify-center w-14 h-12 rounded-md border transition flex-shrink-0 ${
                  filtrosAbiertos || filtrosActivos > 0
                    ? 'bg-ozio-purple border-ozio-purple text-white'
                    : 'bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2M9 16h6" />
                </svg>
                {filtrosActivos > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-ozio-purple text-xs font-bold rounded-full flex items-center justify-center leading-none">
                    {filtrosActivos}
                  </span>
                )}
              </button>

              {/* Panel desplegable */}
              {filtrosAbiertos && (
                <div className="absolute right-0 top-16 w-72 bg-ozio-card border border-gray-700/50 rounded-md shadow-2xl z-30 overflow-hidden">

                  {/* Cabecera */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                    <span className="text-white font-semibold text-sm">Filtrar eventos</span>
                    {filter !== 'todos' && (
                      <button
                        onClick={() => { setFilter('todos'); setFiltrosAbiertos(false); }}
                        className="text-xs text-ozio-blue hover:underline"
                      >
                        Ver todos
                      </button>
                    )}
                  </div>

                  <div className="p-3 flex flex-col gap-2">
                    {filterOptions.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => { setFilter(f.key as FilterType); setFiltrosAbiertos(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                          filter === f.key
                            ? 'bg-ozio-purple/20 border-ozio-purple/50 text-white'
                            : 'bg-ozio-dark border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        <span className="text-lg w-6 text-center flex-shrink-0">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{f.label}</p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">{f.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {f.count > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              filter === f.key
                                ? 'bg-ozio-purple/40 text-purple-200'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {f.count}
                            </span>
                          )}
                          {filter === f.key && (
                            <svg className="w-4 h-4 text-ozio-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {generosDisponibles.length > 0 && (
                    <div className="px-3 pb-3 border-t border-gray-700/50 pt-3">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2 block">Género musical</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setGenerosSeleccionados(new Set())}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                            generosSeleccionados.size === 0
                              ? 'bg-ozio-purple border-ozio-purple/80 text-white'
                              : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
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
                                  ? 'bg-ozio-purple border-ozio-purple/80 text-white'
                                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
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
              )}
            </div>
          </div>

          {/* Chips de filtros activos */}
          {(filter !== 'todos' || generosSeleccionados.size > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {filter !== 'todos' && (
                <span className="flex items-center gap-1.5 bg-ozio-purple/20 border border-ozio-purple/40 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  {currentFilter?.icon} {currentFilter?.label}
                  <button type="button" onClick={() => setFilter('todos')} className="ml-1 hover:text-white transition">×</button>
                </span>
              )}
              {Array.from(generosSeleccionados).map((name) => {
                const g = generosDisponibles.find((x) => x.name === name);
                return (
                  <span key={name} className="flex items-center gap-1.5 bg-ozio-purple/20 border border-ozio-purple/40 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    {g?.emoji} {name}
                    <button
                      type="button"
                      onClick={() => setGenerosSeleccionados((prev) => { const next = new Set(prev); next.delete(name); return next; })}
                      className="ml-1 hover:text-white transition"
                    >×</button>
                  </span>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Lista */}
      <div className="px-4 md:px-8 mt-4">
        <div className="max-w-4xl mx-auto">
          {filteredEvents.length === 0 ? (
            <div className="bg-ozio-card border border-gray-700/50 rounded-md p-12 text-center mt-4">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-white font-semibold mb-1">No hay eventos</p>
              <p className="text-gray-400 text-sm">
                {search ? 'Prueba con otra búsqueda' : 'No hay eventos para este filtro'}
              </p>
              {filter !== 'todos' && (
                <button
                  onClick={() => setFilter('todos')}
                  className="mt-4 text-ozio-blue text-sm hover:underline"
                >
                  Ver todos los eventos
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                {filter !== 'todos' && (
                  <span className="text-gray-600"> · {currentFilter?.label}</span>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((event) => {
                  const venue = venues.find((v: Venue) => String(v.id) === String(event.venue_id));
                  return <EventCard key={event.id} event={event} venue={venue} />;
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, venue }: { event: Event; venue?: Venue }) {
  const router = useRouter();
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const now = new Date();

  const isPast = endDate < now;
  const isActive = startDate <= now && endDate >= now;
  const isSoon = !isActive && !isPast && startDate.getTime() - now.getTime() < 2 * 60 * 60 * 1000;

  const getStatusBadge = () => {
    if (isPast) return (
      <span className="bg-gray-700/90 backdrop-blur-sm text-gray-400 text-xs px-3 py-1.5 rounded-full font-medium border border-gray-600/30 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Finalizado
      </span>
    );
    if (isActive) return (
      <span className="bg-green-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-green-500/30 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        En curso
      </span>
    );
    if (isSoon) return (
      <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-orange-400/30 flex items-center gap-1">
        🕐 Próximamente
      </span>
    );
    if (event.featured) return (
      <span className="bg-ozio-purple/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-ozio-purple/30">
        ⭐ Destacado
      </span>
    );
    return null;
  };

  const isToday = startDate.toDateString() === now.toDateString();
  const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const dayLabel = isToday
    ? 'Hoy'
    : isTomorrow
      ? 'Mañana'
      : startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      className={`bg-ozio-card border rounded-md overflow-hidden transition cursor-pointer group ${
        isPast
          ? 'border-gray-800/50 opacity-60 hover:opacity-80'
          : isActive
            ? 'border-green-500/40 hover:border-green-500/70 shadow-lg shadow-green-500/5'
            : 'border-gray-700/50 hover:border-ozio-blue/50'
      }`}
      onClick={() => {
        const eventData = encodeURIComponent(JSON.stringify(event));
        router.push(`/events/${event.id}?data=${eventData}`);
      }}
    >
      {/* Imagen */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={event.image_path || venue?.avatar_path || 'https://via.placeholder.com/400x200'}
          alt={event.title}
          className={`w-full h-full object-cover transition group-hover:scale-105 duration-500 ${isPast ? 'grayscale opacity-60' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ozio-card/80 via-transparent to-transparent" />

        <div className="absolute top-3 right-3">{getStatusBadge()}</div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
          {dayLabel}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className={`font-bold text-lg mb-1 leading-tight ${isPast ? 'text-gray-400' : 'text-white'}`}>
          {event.title}
        </h3>

        {event.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
        )}
        {/* Géneros del evento */}
        {event.genres && event.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genres.slice(0, 3).map((g) => (
              <span
                key={g.genre_id}
                className="flex items-center gap-1 text-[11px] bg-ozio-purple/10 text-ozio-purple border border-ozio-purple/25 px-2 py-0.5 rounded-full"
              >
                {g.genre?.emoji} {g.genre?.name}
              </span>
            ))}
          </div>
        )}

        {venue && (
          <div className="flex items-center gap-2 mb-3">
            {venue.avatar_path && (
              <img src={venue.avatar_path} alt={venue.name} className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-gray-400 text-xs truncate">{venue.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className={`w-4 h-4 ${isPast ? 'text-gray-600' : 'text-ozio-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
            isPast
              ? 'bg-gray-700/50 text-gray-500 border border-gray-700/30'
              : 'bg-ozio-blue/20 text-ozio-blue border border-ozio-blue/30'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.98 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {event.event_attendees?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}