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
      {/* Mobile backdrop */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/60 z-[1001] md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Drawer / sidebar */}
      <aside
        className={`fixed top-0 right-0 z-[1002] h-full w-full md:w-80 lg:w-96 bg-ozio-dark border-l border-ozio-card shadow-2xl transform transition-transform duration-300 ${
          showFilters ? "translate-x-0" : "translate-x-full"
        }`}
        aria-labelledby="filters-title"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="px-5 py-4 border-b border-ozio-card flex items-center justify-between">
            <div>
              <h3 id="filters-title" className="text-ozio-text font-semibold">Filtros</h3>
              <p className="text-xs text-ozio-text-muted">Afina tu búsqueda rápidamente</p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-ozio-blue hover:text-ozio-blue/80 transition"
                >
                  Resetear
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-2 text-ozio-text-muted hover:text-ozio-text hover:bg-ozio-card"
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
                <label className="text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide">
                  Distancia máxima
                </label>
                <span className="text-ozio-blue text-xs font-medium">
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
                className="w-full accent-ozio-blue"
              />
              <div className="flex justify-between text-xs text-ozio-text-subtle mt-1">
                <span>500m</span>
                <span>20km+</span>
              </div>
            </div>

            {/* Ambiente */}
            <div>
              <label className="text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-2 block">
                Ambiente
              </label>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setAmbientesSeleccionados(new Set())}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      ambientesSeleccionados.size === 0
                        ? "bg-ozio-blue border-ozio-blue text-ozio-text"
                        : "border-ozio-card text-ozio-text-muted hover:text-ozio-text hover:border-gray-500"
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
                            ? "bg-ozio-blue border-ozio-blue text-ozio-text"
                            : "border-ozio-card text-ozio-text-muted hover:text-ozio-text hover:border-gray-500"
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
                <label className="text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-2 block">
                  Género musical
                </label>
                <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                  <li>
                    <button
                      type="button"
                      onClick={() => setGenerosSeleccionados(new Set())}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        generosSeleccionados.size === 0
                          ? "bg-ozio-blue border-ozio-blue text-ozio-text"
                          : "border-ozio-card text-ozio-text-muted hover:text-ozio-text hover:border-gray-500"
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
                              ? "bg-ozio-blue border-ozio-blue text-ozio-text"
                              : "border-ozio-card text-ozio-text-muted hover:text-ozio-text hover:border-gray-500"
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
          <footer className="px-5 py-4 border-t border-ozio-card bg-ozio-dark/95">
            <div className="flex items-center justify-between">
              <span className="text-ozio-text-muted text-xs">Locales visibles</span>
              <span className="text-ozio-text text-sm font-bold">
                {filteredCount}
                <span className="text-ozio-text-subtle font-normal"> / {totalCount}</span>
              </span>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
