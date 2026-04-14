"use client";

interface MapFiltersProps {
  filters: { maxDistance: number | null };
  setFilters: React.Dispatch<React.SetStateAction<{ maxDistance: number | null }>>;
  generosDisponibles: { name: string; emoji: string }[];
  generosSeleccionados: Set<string>;
  setGenerosSeleccionados: React.Dispatch<React.SetStateAction<Set<string>>>;
  ambientesSeleccionados: Set<string>;
  setAmbientesSeleccionados: React.Dispatch<React.SetStateAction<Set<string>>>;
  hasActiveFilters: boolean;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  filteredCount: number;
  totalCount: number;
}

export function MapFilters({
  filters,
  setFilters,
  generosDisponibles,
  generosSeleccionados,
  setGenerosSeleccionados,
  ambientesSeleccionados,
  setAmbientesSeleccionados,
  hasActiveFilters,
  showFilters,
  setShowFilters,
  filteredCount,
  totalCount,
}: MapFiltersProps) {
  function resetAll() {
    setFilters({ maxDistance: null });
    setAmbientesSeleccionados(new Set());
    setGenerosSeleccionados(new Set());
  }

  return (
    <>
      {/* Trigger button */}
      <div className="absolute bottom-20 right-3 z-[992] pointer-events-none max-w-xl">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="pointer-events-auto bg-gray-900/95 text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-xl border border-gray-700 hover:bg-gray-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
          </svg>
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/60 z-[1001] md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Drawer / sidebar */}
      <aside
        className={`fixed top-0 right-0 z-[1002] h-full w-full md:w-80 lg:w-96 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ${
          showFilters ? "translate-x-0" : "translate-x-full"
        }`}
        aria-labelledby="filters-title"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 id="filters-title" className="text-white font-semibold">Filtros</h3>
              <p className="text-xs text-gray-400">Afina tu búsqueda rápidamente</p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Resetear
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800"
                aria-label="Cerrar filtros"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            {/* Distance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
                  Distancia máxima
                </label>
                <span className="text-blue-400 text-xs font-medium">
                  {filters.maxDistance !== null ? `${filters.maxDistance} km` : "Sin límite"}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                title="Distancia máxima"
                value={filters.maxDistance ?? 20}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxDistance:
                      parseFloat(e.target.value) === 20
                        ? null
                        : parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>500m</span>
                <span>20km+</span>
              </div>
            </div>

            {/* Ambiente */}
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">
                Ambiente
              </label>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setAmbientesSeleccionados(new Set())}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      ambientesSeleccionados.size === 0
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                    }`}
                  >
                    Todos
                  </button>
                </li>
                {[
                  { key: "tranquilo",   label: "🌿 Tranquilo" },
                  { key: "animado",     label: "✨ Animado" },
                  { key: "muy_animado", label: "🔥 Muy animado" },
                ].map(({ key, label }) => {
                  const active = ambientesSeleccionados.has(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() =>
                          setAmbientesSeleccionados((prev) => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                          active
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Géneros */}
            {generosDisponibles.length > 0 && (
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">
                  Género musical
                </label>
                <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                  <li>
                    <button
                      type="button"
                      onClick={() => setGenerosSeleccionados(new Set())}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        generosSeleccionados.size === 0
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      Todos
                    </button>
                  </li>
                  {generosDisponibles.map(({ name, emoji }) => {
                    const active = generosSeleccionados.has(name);
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() =>
                            setGenerosSeleccionados((prev) => {
                              const next = new Set(prev);
                              if (next.has(name)) next.delete(name);
                              else next.add(name);
                              return next;
                            })
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                            active
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                          }`}
                        >
                          {emoji} {name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="px-5 py-4 border-t border-gray-700 bg-gray-900/95">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Locales visibles</span>
              <span className="text-white text-sm font-bold">
                {filteredCount}
                <span className="text-gray-500 font-normal"> / {totalCount}</span>
              </span>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
