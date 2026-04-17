"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from "@/lib/stores/venueStore";
import { useState } from 'react';

interface Venue {
  id: string;
  name: string;
  description?: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  avatar_path?: string;
  check_ins?: any[];
  plan?: string;
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
}

export default function Destacados() {
  const router = useRouter();
  const { venues, events, loaded } = useAppStore();
  const [activeTab, setActiveTab] = useState<'eventos' | 'locales'>('eventos');

  if (!loaded) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  const topVenues = [...venues]
    .sort((a, b) => (b.check_ins?.length || 0) - (a.check_ins?.length || 0))
    .slice(0, 5);

  const featuredEvents = events.filter((e: Event) => e.featured).slice(0, 5);

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header */}
      <header className="bg-gradient-to-b from-ozio-purple to-ozio-card px-4 md:px-8 lg:px-12 py-6 pt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-ozio-blue transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-2xl font-bold">⭐ Destacados</h1>
            <div className="w-6"></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-ozio-card rounded-2xl p-2 border border-ozio-card/50">
            <button
              onClick={() => setActiveTab('eventos')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                activeTab === 'eventos'
                  ? 'bg-ozio-blue text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-ozio-card/50'
              }`}
            >
              🎉 Eventos
            </button>
            <button
              onClick={() => setActiveTab('locales')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                activeTab === 'locales'
                  ? 'bg-ozio-blue text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-ozio-card/50'
              }`}
            >
              🏆 Top Locales
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-8 lg:px-12 mt-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'eventos' && (
            <div className="space-y-4">
              {featuredEvents.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-white font-semibold">Eventos destacados</h2>
                    <span className="bg-ozio-blue/20 text-ozio-blue text-xs px-2 py-1 rounded-full">
                      {featuredEvents.length}
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
                    {featuredEvents.map((event) => (
                      <li key={event.id}><EventCard event={event} /></li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-gray-400">No hay eventos destacados en este momento</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'locales' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-white font-semibold">Locales más populares</h2>
                <span className="bg-ozio-orange/20 text-ozio-orange text-xs px-2 py-1 rounded-full">
                  Top {topVenues.length}
                </span>
              </div>
              <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0">
                {topVenues.map((venue, index) => (
                  <li key={venue.id}><VenueCard venue={venue} rank={index + 1} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);

  const isPastEvent = endDate < new Date();
  const isActiveEvent = startDate <= new Date() && endDate >= new Date();

  const getStatusBadge = () => {
    if (isPastEvent) {
      return (
        <span className="bg-ozio-card/90 backdrop-blur-sm text-gray-400 text-xs px-3 py-1.5 rounded-full font-medium border border-ozio-card/30 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Finalizado
        </span>
      );
    }
    if (isActiveEvent) {
      return (
        <span className="bg-ambience-low/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-ambience-low/30 flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          En curso
        </span>
      );
    }
    return (
      <span className="bg-ozio-blue/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-ozio-blue/30">
        ⭐ Destacado
      </span>
    );
  };

  return (
    <article
      className={`bg-ozio-card border rounded-2xl overflow-hidden transition cursor-pointer ${
        isPastEvent
          ? 'border-ozio-darker/50 opacity-70 hover:opacity-90'
          : 'border-ozio-card/50 hover:border-ozio-blue/50'
      }`}
      onClick={() => {
        const eventData = encodeURIComponent(JSON.stringify(event));
        router.push(`/events/${event.id}?data=${eventData}`);
      }}
    >
      <figure className="relative h-48 m-0">
        <img
          src={event.image_path || 'https://via.placeholder.com/400x200'}
          alt={event.title}
          className={`w-full h-full object-cover ${isPastEvent ? 'grayscale opacity-60' : ''}`}
        />
        {isPastEvent && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-ozio-card/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-xl border border-ozio-card">
              Evento Finalizado
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </figure>

      <div className="p-4">
        <h3 className={`font-bold text-lg mb-2 ${isPastEvent ? 'text-gray-400' : 'text-white'}`}>
          {event.title}
        </h3>

        {event.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <svg className={`w-4 h-4 ${isPastEvent ? 'text-gray-600' : 'text-ozio-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <time dateTime={event.starts_at}>
            {startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </time>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <svg className={`w-4 h-4 ${isPastEvent ? 'text-gray-600' : 'text-ozio-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <time dateTime={event.starts_at}>{startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</time>
            {' - '}
            <time dateTime={event.ends_at}>{endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</time>
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
            isPastEvent
              ? 'bg-ozio-card/50 text-gray-500 border border-ozio-card/30'
              : 'bg-ozio-blue/20 text-ozio-blue border border-ozio-blue/30'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.98 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            {event.event_attendees?.length || 0} asistentes
          </div>
        </div>
      </div>
    </article>
  );
}

function VenueCard({ venue, rank }: { venue: Venue; rank: number }) {
  const router = useRouter();

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-ozio-orange to-ozio-orange/80';
      case 2: return 'from-gray-400 to-gray-500';
      case 3: return 'from-orange-600 to-orange-700';
      default: return 'from-ozio-blue to-ozio-purple';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <article
      className="bg-ozio-card border border-ozio-card/50 rounded-2xl overflow-hidden hover:border-ozio-orange/50 transition cursor-pointer"
      onClick={() => router.push(`/venues/${venue.id}`)}
    >
      <div className="flex gap-4 p-4">
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
            {getRankEmoji(rank)}
          </div>
        </div>

        <img
          src={venue.avatar_path || 'https://via.placeholder.com/80'}
          alt={venue.name}
          className="w-20 h-20 rounded-xl object-cover"
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg truncate">{venue.name}</h3>

          {venue.address && (
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{venue.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="bg-ozio-orange/20 text-ozio-orange text-xs px-3 py-1 rounded-full font-medium border border-ozio-orange/30 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {venue.check_ins?.length || 0} visitas
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </article>
  );
}