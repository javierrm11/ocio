export function MapLoader() {
  return (
    <div
      className="map-loader-root fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      role="status"
      aria-label="Cargando mapa"
    >
      {/* City street grid background */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid base lines */}
        <line x1="0" y1="200" x2="1440" y2="200" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <line x1="0" y1="450" x2="1440" y2="450" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <line x1="0" y1="700" x2="1440" y2="700" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <line x1="300" y1="0" x2="300" y2="900" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <line x1="720" y1="0" x2="720" y2="900" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <line x1="1140" y1="0" x2="1140" y2="900" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />

        {/* Diagonal / curved roads */}
        <path d="M0 650 Q360 580 720 450 Q1080 320 1440 280" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <path d="M0 350 Q400 300 700 200 Q1000 100 1440 80" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <path d="M200 0 Q350 300 420 600 Q490 820 560 900" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <path d="M900 0 Q980 250 1060 500 Q1120 680 1200 900" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <path d="M0 100 Q300 200 600 350 Q900 500 1440 600" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      </svg>

      {/* Scattered map pins */}

      {/* Orange-pink — top left */}
      <div className="absolute loader-pin-a" style={{ top: "24%", left: "35%" }}>
        <svg width="22" height="29" viewBox="0 0 38 50" fill="none">
          <defs>
            <linearGradient id="pa1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF8A00" />
              <stop offset="100%" stopColor="#ff5b8a" />
            </linearGradient>
          </defs>
          <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z" fill="url(#pa1)" />
          <circle cx="19" cy="19" r="7" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>

      {/* Purple — right */}
      <div className="absolute loader-pin-b" style={{ top: "30%", right: "32%" }}>
        <svg width="20" height="26" viewBox="0 0 38 50" fill="none">
          <defs>
            <linearGradient id="pa2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z" fill="url(#pa2)" />
          <circle cx="19" cy="19" r="7" fill="rgba(255,255,255,0.35)" />
        </svg>
      </div>

      {/* Purple-pink — left */}
      <div className="absolute loader-pin-c" style={{ top: "40%", left: "24%" }}>
        <svg width="22" height="29" viewBox="0 0 38 50" fill="none">
          <defs>
            <linearGradient id="pa3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z" fill="url(#pa3)" />
          <circle cx="19" cy="19" r="7" fill="rgba(255,255,255,0.35)" />
        </svg>
      </div>

      {/* Blue — just below center */}
      <div className="absolute loader-pin-d" style={{ top: "52%", left: "51%" }}>
        <svg width="18" height="24" viewBox="0 0 38 50" fill="none">
          <defs>
            <linearGradient id="pa4" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2E5CFF" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z" fill="url(#pa4)" />
          <circle cx="19" cy="19" r="7" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>

      {/* Orange — bottom right */}
      <div className="absolute loader-pin-e" style={{ top: "48%", right: "21%" }}>
        <svg width="22" height="29" viewBox="0 0 38 50" fill="none">
          <defs>
            <linearGradient id="pa5" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#FF8A00" />
            </linearGradient>
          </defs>
          <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z" fill="url(#pa5)" />
          <circle cx="19" cy="19" r="7" fill="rgba(255,255,255,0.35)" />
        </svg>
      </div>

      {/* Central location indicator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full border-2 border-ozio-blue/40" />
        <div className="w-5 h-5 rounded-full bg-ozio-blue/90 flex items-center justify-center"
          style={{ boxShadow: "0 0 16px rgba(46,92,255,0.8)" }}>
          <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
      </div>

      {/* Text */}
      <p className="absolute text-ozio-text-subtle text-sm tracking-wide animate-pulse"
        style={{ bottom: "28%" }}>
        Leyendo el pulso de la ciudad…
      </p>
    </div>
  );
}
