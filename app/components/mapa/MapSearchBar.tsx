"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/lib/stores/venueStore";

export function MapSearchBar() {
  const { venues, setMapFlyTarget, setShowFilters, hasActiveFilters } = useAppStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length > 0
    ? venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(venue: { id: string; latitude: number; longitude: number; name: string; avatar_path?: string; distance?: string }) {
    setMapFlyTarget({ lat: venue.latitude, lng: venue.longitude, venueId: venue.id });
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="px-4 py-2 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 relative">
        {/* Input pill */}
        <div className="flex-1 bg-white/10 backdrop-blur border border-white/10 rounded-2xl flex items-center px-3 gap-2">
          <Search size={16} className="text-ozio-text/40 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Buscar local..."
            aria-label="Buscar local en el mapa"
            aria-autocomplete="list"
            className="flex-1 bg-transparent text-ozio-text placeholder-white/30 text-sm py-2.5 outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="text-ozio-text/40 hover:text-ozio-text transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters trigger */}
        <button
          type="button"
          aria-label="Abrir filtros"
          onClick={() => setShowFilters(true)}
          className="relative bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition rounded-2xl p-2.5 flex items-center justify-center shrink-0"
        >
          <SlidersHorizontal size={18} className="text-ozio-text/70" />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ozio-blue" />
          )}
        </button>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <ul
            className="absolute top-full left-0 right-0 mt-1.5 bg-ozio-dark/98 backdrop-blur border border-white/10 rounded-2xl shadow-2xl overflow-hidden list-none p-0 m-0 z-[999]"
          >
            {results.map((venue) => (
              <li key={venue.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(venue)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition text-left"
                >
                  {venue.avatar_path ? (
                    <img
                      src={venue.avatar_path}
                      alt=""
                      role="presentation"
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ozio-blue to-ozio-purple shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-ozio-text text-sm font-medium truncate">{venue.name}</p>
                    {venue.distance && (
                      <p className="text-ozio-text/40 text-xs">{venue.distance}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
