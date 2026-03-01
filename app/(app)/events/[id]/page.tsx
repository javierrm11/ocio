"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Venue {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  avatar_path: string;
}

interface Event {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  featured: boolean;
  image_path: string | null;
  created_at?: string;
  venue: Venue;
}

export default function EventDetail() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar el evento');
      }

      const result = await response.json();
      setEvent(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsRegistered(true);
        // Mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description ?? '',
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
    // Mostrar toast de confirmación
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-white text-xl font-bold mb-2">Evento no encontrado</h2>
          <p className="text-gray-400 mb-6">El evento que buscas no existe o ha sido eliminado</p>
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

  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const now = new Date();
  const isUpcoming = startDate > now;
  const isOngoing = startDate <= now && endDate >= now;
  const isPast = endDate < now;

  const getEventStatus = () => {
    if (isPast) return { text: 'Finalizado', color: 'bg-gray-600' };
    if (isOngoing) return { text: 'En curso', color: 'bg-green-600' };
    return { text: 'Próximamente', color: 'bg-ozio-blue' };
  };

  const status = getEventStatus();

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header con imagen */}
      <div className="relative h-80">
        {/* Imagen de fondo */}
        <img
          src={event.image_path || 'https://via.placeholder.com/800x600'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-ozio-dark"></div>

        {/* Botones superiores */}
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

            <button
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status badge y Featured */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className={`${status.color} text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm border border-white/10`}>
            {status.text}
          </span>
          {event.featured && (
            <span className="bg-ozio-purple/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-ozio-purple/30">
              ⭐ Destacado
            </span>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 -mt-6 relative z-10">
        {/* Card principal */}
        <div className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
          {/* Título */}
          <h1 className="text-white text-3xl font-bold mb-4">{event.title}</h1>

          {/* Información principal */}
          <div className="space-y-4 mb-6">
            {/* Fecha */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ozio-purple to-ozio-blue rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-1">Fecha</p>
                <p className="text-white font-semibold">
                  {startDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Hora */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ozio-orange to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-1">Horario</p>
                <p className="text-white font-semibold">
                  {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
                  {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Venue */}
            <div 
              className="flex items-start gap-3 cursor-pointer hover:bg-gray-700/30 -mx-2 px-2 py-2 rounded-xl transition"
              onClick={() => router.push(`/venues/${event.venue.id}`)}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={event.venue?.avatar_path || 'https://via.placeholder.com/80'}
                  alt={event.venue?.name || 'Venue'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-1">Lugar</p>
                <p className="text-white font-semibold">{event.venue ?.name}</p>
                {event.venue?.address && (
                  <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue?.address}
                  </p>
                )}
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Descripción */}
          {event.description && (
            <div className="mb-6">
              <h2 className="text-white font-bold text-lg mb-3">Descripción</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Botón de registro */}
          {isUpcoming && (
            <button
              onClick={handleRegister}
              disabled={isRegistered}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow-lg ${
                isRegistered
                  ? 'bg-green-600 text-white'
                  : 'bg-gradient-to-r from-ozio-blue to-ozio-purple text-white hover:shadow-2xl hover:scale-[1.02]'
              }`}
            >
              {isRegistered ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Registrado!
                </span>
              ) : (
                '🎉 Registrarme al evento'
              )}
            </button>
          )}

          {isOngoing && (
            <div className="bg-green-600/20 border border-green-600/50 rounded-2xl p-4 text-center">
              <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Este evento está en curso ahora
              </p>
            </div>
          )}

          {isPast && (
            <div className="bg-gray-600/20 border border-gray-600/50 rounded-2xl p-4 text-center">
              <p className="text-gray-400 font-semibold">
                Este evento ha finalizado
              </p>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="mt-6 bg-ozio-card border border-gray-700/50 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-gray-700/50">
            <h2 className="text-white font-bold text-lg">Ubicación</h2>
          </div>
          <div className="h-64 relative overflow-hidden">
            <iframe
              src={`https://www.google.com/maps?q=${event.venue.latitude},${event.venue.longitude}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
          <div className="p-4">
            <button 
              onClick={() => window.open(`https://maps.google.com/?q=${event.venue.latitude},${event.venue.longitude}`, '_blank')}
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
      </div>

      {/* Share menu modal */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={() => setShowShareMenu(false)}
        >
          <div 
            className="bg-ozio-card border border-gray-700/50 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-4">Compartir evento</h3>
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