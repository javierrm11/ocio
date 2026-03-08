"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/stores/venueStore';

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
}

export default function VenueDetail() {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  const { venues, events } = useAppStore();

  // ✅ 1. Busca en el store
  const venueFromStore = venues.find((v) => String(v.id) === venueId) ?? null;

  // ✅ Enriquecer con sus eventos del store
  const venueWithEvents = venueFromStore
  ? ({
      ...venueFromStore,
      events: events.filter((e) => e.venue_id === venueId),
    } as unknown as Venue)
  : null;

  // ✅ 2. Si no está en el store, fetch como fallback
  const [venue, setVenue] = useState<Venue | null>(venueWithEvents);
  const [loading, setLoading] = useState(!venueWithEvents);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (venue) return; // ya tenemos datos

    const fetchVenueDetail = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues/${venueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al cargar el local');

        const result = await response.json();
        setVenue(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetail();
  }, [venueId]);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues/${venueId}/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setHasCheckedIn(true);
        // Actualiza el contador localmente sin refetch
        setVenue((prev) =>
          prev
            ? { ...prev, check_ins: [...(prev.check_ins || []), { id: Date.now().toString(), user_id: '', venue_id: venueId, created_at: new Date().toISOString() }] }
            : prev,
        );
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && venue) {
      try {
        await navigator.share({
          title: venue.name,
          text: venue.description || `Visita ${venue.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
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
          <h2 className="text-white text-xl font-bold mb-2">Local no encontrado</h2>
          <p className="text-gray-400 mb-6">El local que buscas no existe o ha sido eliminado</p>
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

  const upcomingEvents = venue.events
    ?.filter((event) => new Date(event.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()) || [];

  const totalCheckIns = venue.check_ins?.length || 0;

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header con imagen */}
      <div className="relative h-80">
        <img
          src={venue.avatar_path || 'https://via.placeholder.com/800x600'}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-ozio-dark"></div>

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-16">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition border border-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium border border-white/10 flex items-center gap-2">
            <svg className="w-5 h-5 text-ozio-orange" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {totalCheckIns} visitas
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 shadow-2xl mb-6">
          <h1 className="text-white text-3xl font-bold mb-4">{venue.name}</h1>

          {venue.description && (
            <p className="text-gray-300 leading-relaxed mb-6">{venue.description}</p>
          )}

          {venue.address && (
            <div className="flex items-start gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-ozio-purple to-ozio-blue rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-1">Dirección</p>
                <p className="text-white font-semibold">{venue.address}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={hasCheckedIn || checkingIn}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow-lg ${
              hasCheckedIn
                ? 'bg-green-600 text-white'
                : checkingIn
                  ? 'bg-gray-600 text-white'
                  : 'bg-gradient-to-r from-ozio-orange to-red-500 text-white hover:shadow-2xl hover:scale-[1.02]'
            }`}
          >
            {hasCheckedIn ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ¡Check-in realizado!
              </span>
            ) : checkingIn ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Haciendo check-in...
              </span>
            ) : (
              '📍 Hacer Check-in'
            )}
          </button>
        </div>

        {/* Mapa */}
        <div className="bg-ozio-card border border-gray-700/50 rounded-3xl overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-700/50">
            <h2 className="text-white font-bold text-lg">Ubicación</h2>
          </div>
          <div className="h-64 relative overflow-hidden">
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
              onClick={() => window.open(`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`, '_blank')}
              className="w-full bg-ozio-blue/20 hover:bg-ozio-blue/30 border border-ozio-blue/30 text-ozio-blue py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Abrir en Google Maps
            </button>
          </div>
        </div>

        {/* Eventos próximos */}
        {upcomingEvents.length > 0 && (
          <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Próximos eventos</h2>
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

      {/* Share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={() => setShowShareMenu(false)}
        >
          <div
            className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-4">Compartir local</h3>
            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full bg-ozio-purple/20 hover:bg-ozio-purple/30 border border-ozio-purple/30 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar enlace
              </button>
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 py-3 rounded-xl font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
            {startDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
          </span>
          <span className="text-white text-2xl font-bold">{startDate.getDate()}</span>
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
            <span>{startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
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