"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { useState, useMemo, useRef, useEffect } from "react";

interface Venue {
  id: string;
  name: string;
  description?: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  avatar_path?: string;
  check_ins?: any[];
  is_favorite?: boolean;
  distance?: number | string;
  genres?: string[];
}

interface Event {
  id: string;
  venue_id: string;
  starts_at: string;
  ends_at: string;
}

type SortType = "relevancia" | "distancia" | "ambiente" | "favoritos";

export default function Buscar() {
  const router = useRouter();
  const { venues, events, loaded } = useAppStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortType>("relevancia");
  const [soloActivos, setSoloActivos] = useState(false);
  const [generoSeleccionado, setGeneroSeleccionado] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const now = new Date();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Géneros únicos
  const generosDisponibles = useMemo(() => {
    const all = venues.flatMap((v: Venue) => v.genres || []);
    return [...new Set(all)] as string[];
  }, [venues]);

  // Venues filtrados
  const filteredVenues = useMemo(() => {
    let result = [...venues] as Venue[];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.address?.toLowerCase().includes(q) ||
          v.genres?.some((g) => g.toLowerCase().includes(q)),
      );
    }

    if (generoSeleccionado) {
      result = result.filter((v) => v.genres?.includes(generoSeleccionado));
    }

    if (soloActivos) {
      const venuesConEventoActivo = new Set(
        events
          .filter(
            (e: Event) =>
              new Date(e.starts_at) <= now && new Date(e.ends_at) >= now,
          )
          .map((e: Event) => String(e.venue_id)),
      );
      result = result.filter((v) => venuesConEventoActivo.has(String(v.id)));
    }

    switch (sort) {
      case "distancia":
        result.sort((a, b) => {
          const da =
            typeof a.distance === "number"
              ? a.distance
              : parseFloat(a.distance || "999");
          const db =
            typeof b.distance === "number"
              ? b.distance
              : parseFloat(b.distance || "999");
          return da - db;
        });
        break;
      case "ambiente":
        result.sort(
          (a, b) => (b.check_ins?.length || 0) - (a.check_ins?.length || 0),
        );
        break;
      case "favoritos":
        result.sort(
          (a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0),
        );
        break;
      default:
        break;
    }

    return result;
  }, [venues, events, query, sort, soloActivos, generoSeleccionado]);

  const hasQuery =
    query.trim().length > 0 || generoSeleccionado !== null || soloActivos;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">
      {/* Header sticky */}
      <div className="bg-ozio-dark px-4 md:px-8 pt-4 pb-4 sticky top-0 z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">

          {/* Input */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Busca locales, géneros, direcciones..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-ozio-card border border-gray-700/50 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Solo activos */}
            <button
              onClick={() => setSoloActivos(!soloActivos)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition border ${
                soloActivos
                  ? "bg-green-600 border-green-500 text-white"
                  : "bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${soloActivos ? "bg-white animate-pulse" : "bg-gray-500"}`}
              />
              Evento en curso
            </button>

            {/* Ordenar */}
            {[
              { key: "relevancia", label: "✨ Relevancia" },
              { key: "distancia", label: "📍 Distancia" },
              { key: "ambiente", label: "🔥 Ambiente" },
              { key: "favoritos", label: "❤️ Favoritos" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key as SortType)}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition border ${
                  sort === s.key
                    ? "bg-ozio-purple border-ozio-purple text-white"
                    : "bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4">
        <div className="max-w-4xl mx-auto">
          {/* Géneros */}
          {generosDisponibles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              <button
                onClick={() => setGeneroSeleccionado(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  !generoSeleccionado
                    ? "bg-ozio-blue border-ozio-blue text-white"
                    : "bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white"
                }`}
              >
                Todos los géneros
              </button>
              {generosDisponibles.map((g) => (
                <button
                  key={g}
                  onClick={() =>
                    setGeneroSeleccionado(generoSeleccionado === g ? null : g)
                  }
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    generoSeleccionado === g
                      ? "bg-ozio-blue border-ozio-blue text-white"
                      : "bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white"
                  }`}
                >
                  🎵 {g}
                </button>
              ))}
            </div>
          )}

          {/* Sin búsqueda activa — pantalla de inicio */}
          {!hasQuery && (
            <div className="py-4">
              {/* Top 3 más visitados — PRIMERO y visible sin scroll */}
              <div className="mb-6">
                <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3">
                  🔥 Más visitados ahora
                </p>
                <div className="space-y-3">
                  {[...venues]
                    .sort(
                      (a: Venue, b: Venue) =>
                        (b.check_ins?.length || 0) - (a.check_ins?.length || 0),
                    )
                    .slice(0, 3)
                    .map((venue: Venue, i) => (
                      <MiniVenueCard
                        key={venue.id}
                        venue={venue}
                        rank={i + 1}
                        events={events}
                      />
                    ))}
                </div>
              </div>

              {/* Búsquedas populares — debajo, siempre accesibles */}
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3">
                  Búsquedas populares
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Reggaeton",
                    "House",
                    "Techno",
                    "Bar",
                    "Discoteca",
                    "Rooftop",
                    "Salsa",
                    "Pop",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="bg-ozio-card border border-gray-700/50 text-gray-300 text-sm px-4 py-2 rounded-full hover:border-ozio-blue/50 hover:text-white transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resultados */}
          {hasQuery && (
            <>
              <p className="text-gray-500 text-sm mb-4">
                {filteredVenues.length} local
                {filteredVenues.length !== 1 ? "es" : ""}
                {query && (
                  <>
                    {" "}
                    para <span className="text-white">"{query}"</span>
                  </>
                )}
              </p>

              {filteredVenues.length === 0 ? (
                <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">🏠</div>
                  <p className="text-white font-semibold mb-1">
                    Sin resultados
                  </p>
                  <p className="text-gray-400 text-sm">
                    No encontramos locales
                    {query && (
                      <>
                        {" "}
                        para <span className="text-white">"{query}"</span>
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setGeneroSeleccionado(null);
                      setSoloActivos(false);
                    }}
                    className="mt-4 text-ozio-blue text-sm hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVenues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} events={events} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniVenueCard({
  venue,
  rank,
  events,
}: {
  venue: Venue;
  rank: number;
  events: Event[];
}) {
  const router = useRouter();
  const now = new Date();
  const tieneEventoActivo = events.some(
    (e: Event) =>
      String(e.venue_id) === String(venue.id) &&
      new Date(e.starts_at) <= now &&
      new Date(e.ends_at) >= now,
  );

  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

  return (
    <div
      className="bg-ozio-card border border-gray-700/50 rounded-2xl p-3 flex items-center gap-3 hover:border-ozio-blue/50 transition cursor-pointer"
      onClick={() => router.push(`/venues/${venue.id}`)}
    >
      <span className="text-2xl w-8 text-center">{rankEmoji}</span>
      <img
        src={venue.avatar_path || "https://via.placeholder.com/80"}
        alt={venue.name}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">{venue.name}</p>
        <p className="text-gray-400 text-xs">
          {venue.check_ins?.length || 0} visitas
        </p>
      </div>
      {tieneEventoActivo && (
        <span className="text-xs bg-ozio-purple/20 text-ozio-purple border border-ozio-purple/30 px-2 py-1 rounded-full flex-shrink-0">
          🎉 Evento
        </span>
      )}
      <svg
        className="w-5 h-5 text-gray-500 flex-shrink-0"
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
  );
}

function VenueCard({ venue, events }: { venue: Venue; events: Event[] }) {
  const router = useRouter();
  const now = new Date();

  const checkins = venue.check_ins?.length || 0;
  const tieneEventoActivo = events.some(
    (e: Event) =>
      String(e.venue_id) === String(venue.id) &&
      new Date(e.starts_at) <= now &&
      new Date(e.ends_at) >= now,
  );

  const ambience =
    checkins === 0
      ? { bg: "#10b981", label: "Tranquilo" }
      : checkins < 5
        ? { bg: "#f59e0b", label: "Animado" }
        : { bg: "#ef4444", label: "Muy Animado" };

  const dist =
    typeof venue.distance === "number"
      ? venue.distance
      : parseFloat(venue.distance || "0");

  return (
    <div
      className="bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden hover:border-ozio-blue/50 transition cursor-pointer group"
      onClick={() => router.push(`/venues/${venue.id}`)}
    >
      {/* Imagen */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={venue.avatar_path || "https://via.placeholder.com/400x200"}
          alt={venue.name}
          className="w-full h-full object-cover transition group-hover:scale-105 duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ozio-card/80 via-transparent to-transparent" />

        {/* Badges top izquierda */}
        <div className="absolute top-3 left-3 flex gap-2">
          {tieneEventoActivo && (
            <span className="bg-ozio-purple/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              🎉 Evento
            </span>
          )}
          {venue.is_favorite && (
            <span className="bg-red-600/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              ❤️
            </span>
          )}
        </div>

        {/* Badge ambiente */}
        <div
          className="absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: ambience.bg }}
        >
          {ambience.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-bold text-base mb-1 truncate">
          {venue.name}
        </h3>

        {venue.address && (
          <p className="text-gray-500 text-xs mb-3 truncate flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0"
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
            </svg>
            {venue.address}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Géneros */}
          <div className="flex gap-1.5 flex-wrap">
            {venue.genres?.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
            {dist > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
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
                </svg>
                {dist < 1
                  ? `${(dist * 1000).toFixed(0)}m`
                  : `${dist.toFixed(1)}km`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {checkins}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
