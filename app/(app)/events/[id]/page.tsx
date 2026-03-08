"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";

interface Event {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  image_path?: string;
  featured: boolean;
  created_at: string;
  venues: {
    id: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    avatar_path?: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  event_attendees: {
    id: string;
    profile_id: string;
    event_id: string;
    created_at: string;
  }[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { currentUser, events } = useAppStore();

  const eventId = params.id as string;

  // ✅ 1. Intenta leer de la URL
  const rawData = searchParams.get("data");
  const eventFromUrl: Event | null = rawData ? JSON.parse(decodeURIComponent(rawData)) : null;

  // ✅ 2. Si no hay URL, busca en el store
  const eventFromStore = events.find((e) => e.id === eventId) ?? null;

  // ✅ 3. Si tampoco, fetch como último recurso
  const [event, setEvent] = useState<Event | null>((eventFromUrl ?? eventFromStore ?? null) as Event | null);
  const [loading, setLoading] = useState(!eventFromUrl && !eventFromStore);

  const isUserLoggedIn = !!currentUser;
  const isAttendingInitial = event?.event_attendees.some(
    (att) => att.profile_id === currentUser?.id,
  ) ?? false;

  const [isAttending, setIsAttending] = useState(isAttendingInitial);
  const [attendees, setAttendees] = useState(event?.event_attendees ?? []);

  useEffect(() => {
    if (event) return; // ya tenemos datos, no fetchamos

    const fetchEvent = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`);
        if (!res.ok) throw new Error("Error al cargar el evento");
        const data = await res.json();
        setEvent(data);
        setAttendees(data.event_attendees ?? []);
        setIsAttending(
          data.event_attendees?.some(
            (att: any) => att.profile_id === currentUser?.id,
          ) ?? false,
        );
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleAttend = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eventAttendees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: event?.id }),
      });

      if (!res.ok) throw new Error("Error al confirmar asistencia");

      const data = await res.json();
      setIsAttending(true);
      setAttendees((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUnattend = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const myAttendance = attendees.find((att) => att.profile_id === currentUser?.id);
    if (!myAttendance) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/eventAttendees/${myAttendance.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Error al quitar asistencia");

      setIsAttending(false);
      setAttendees((prev) => prev.filter((att) => att.id !== myAttendance.id));
    } catch (error) {
      console.error("Error:", error);
    }
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
          <h2 className="text-white text-2xl font-bold mb-4">Evento no encontrado</h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-full transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-ozio-dark/95 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">Detalles del Evento</h1>
        </div>
      </div>

      {/* Imagen */}
      {event.image_path && (
        <div className="relative h-80 overflow-hidden">
          <img src={event.image_path} alt={event.title} className="w-full h-full object-cover" />
          {event.featured && (
            <div className="absolute top-4 right-4 bg-ozio-blue text-white text-xs font-bold px-3 py-1 rounded-full">
              ⭐ Destacado
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* Título */}
        <div>
          <h2 className="text-white text-3xl font-bold mb-2">{event.title}</h2>
          <p className="text-ozio-blue font-semibold text-sm mb-2">{attendees.length} asistentes</p>
          {event.description && (
            <p className="text-gray-400 text-base leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Venue */}
        {event.venues && (
          <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ubicación
            </h3>
            <div className="flex items-center gap-3">
              {event.venues.avatar_path && (
                <img src={event.venues.avatar_path} alt={event.venues.name} className="w-12 h-12 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <p className="text-white font-semibold">{event.venues.name}</p>
                {event.venues.address && <p className="text-gray-400 text-sm">{event.venues.address}</p>}
                {event.venues.description && <p className="text-gray-500 text-xs mt-1">{event.venues.description}</p>}
              </div>
              <button
                onClick={() => router.push(`/venues/${event.venue_id}`)}
                className="px-4 py-2 bg-ozio-blue hover:bg-ozio-purple text-white text-sm font-semibold rounded-full transition"
              >
                Ver local
              </button>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Fecha y Hora
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-ozio-blue/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-ozio-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Inicio</p>
                <p className="text-white font-semibold">{formatDate(event.starts_at)}</p>
                <p className="text-ozio-blue text-sm">{formatTime(event.starts_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-ozio-purple/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-ozio-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Fin</p>
                <p className="text-white font-semibold">{formatDate(event.ends_at)}</p>
                <p className="text-ozio-purple text-sm">{formatTime(event.ends_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        {event.venues?.latitude && event.venues?.longitude && (
          <div className="bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden">
            <h3 className="text-white font-semibold p-4">🗺️ Mapa</h3>
            <div className="h-64 relative overflow-hidden">
              <iframe
                src={`https://www.google.com/maps?q=${event.venues.latitude},${event.venues.longitude}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Botones */}
        {isUserLoggedIn && (
          <div className="flex gap-3">
            {isAttending ? (
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2"
                onClick={handleUnattend}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Quitar asistencia
              </button>
            ) : (
              <button
                className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-white font-bold py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2"
                onClick={handleAttend}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Asistir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}