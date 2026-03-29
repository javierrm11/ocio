"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from "@/lib/stores/venueStore";
import { useState, useMemo } from 'react';

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

  if (!loaded) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  const filteredEvents = (() => {
    const now = new Date();
    let result = [...events] as Event[];

    // Filtro búsqueda
    if (search.trim()) {
      result = result.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filtro temporal
    switch (filter) {
      case 'activos':
        result = result.filter((e) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now);
        break;
      case 'hoy': {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
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
        // todos — mostrar próximos primero, luego pasados
        break;
    }

    // Ordenar: activos primero, luego próximos, luego pasados
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

  const now = new Date();

  const activeCount = events.filter(
    (e: Event) => new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
  ).length;

  const todayCount = events.filter((e: Event) => {
    const start = new Date(e.starts_at);
    return start.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-ozio-purple/80 to-ozio-dark px-4 md:px-8 pt-14 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-bold">🎉 Eventos</h1>
            {activeCount > 0 && (
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {activeCount} en curso
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ozio-card border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: 'todos', label: '📋 Todos' },
              { key: 'activos', label: '🟢 En curso', count: activeCount },
              { key: 'hoy', label: '📅 Hoy', count: todayCount },
              { key: 'semana', label: '🗓️ Esta semana' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as FilterType)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition border ${
                  filter === f.key
                    ? 'bg-ozio-blue border-ozio-blue text-white'
                    : 'bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-gray-700'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 md:px-8 mt-4">
        <div className="max-w-4xl mx-auto">
          {filteredEvents.length === 0 ? (
            <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-12 text-center mt-4">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-white font-semibold mb-1">No hay eventos</p>
              <p className="text-gray-400 text-sm">
                {search ? 'Prueba con otra búsqueda' : 'No hay eventos para este filtro'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
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

  // Agrupar por día para mostrar separadores
  const isToday = startDate.toDateString() === now.toDateString();
  const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const dayLabel = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      className={`bg-ozio-card border rounded-2xl overflow-hidden transition cursor-pointer group ${
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

        {/* Badge estado */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>

        {/* Badge fecha esquina inferior izquierda */}
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

        {/* Local */}
        {venue && (
          <div className="flex items-center gap-2 mb-3">
            {venue.avatar_path && (
              <img src={venue.avatar_path} alt={venue.name} className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-gray-400 text-xs truncate">{venue.name}</span>
          </div>
        )}

        {/* Hora */}
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

          {/* Asistentes */}
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