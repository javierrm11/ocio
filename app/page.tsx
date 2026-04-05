import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden">

      {/* ── Fondo con destellos ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#2E5CFF]/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#FF8A00]/8 blur-[100px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2E5CFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#2E5CFF]/30">
            <img src="/logo.jpeg" alt="Ozio Logo" className="w-4 h-4" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">Ozio</span>
        </div>
        <Link
          href="/mapa"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition"
        >
          Abrir app
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2E5CFF]/10 border border-[#2E5CFF]/30 text-[#2E5CFF] text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E5CFF] animate-pulse" />
          Ambiente nocturno en tiempo real
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          Descubre dónde
          <br />
          <span className="bg-gradient-to-r from-[#2E5CFF] via-[#8B5CF6] to-[#FF8A00] bg-clip-text text-transparent">
            está la noche
          </span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-10">
          Consulta el ambiente de bares y discotecas en tiempo real, haz check-in y encuentra los mejores planes nocturnos cerca de ti.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/mapa"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#2E5CFF] to-[#8B5CF6] text-white font-bold text-base hover:opacity-90 hover:scale-[1.02] transition shadow-xl shadow-[#2E5CFF]/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Abrir la web
          </Link>

          <button
            type="button"
            disabled
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base opacity-50 cursor-not-allowed"
            title="Próximamente"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
            <span className="text-[10px] text-gray-500 font-normal">Próximamente</span>
          </button>

          <button
            type="button"
            disabled
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base opacity-50 cursor-not-allowed"
            title="Próximamente"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.75-12.76L13.48 7.8 3.18 23.76zM20.49 10.46l-2.67-1.52-3.22 3.22 3.22 3.22 2.68-1.53c.76-.43.76-1.96-.01-2.39zM2.1.67C2.04.83 2 1.01 2 1.22v21.56c0 .21.04.39.1.55l12.08-12.08L2.1.67zM16.92 1.56L4.17.04c-.35-.04-.69.03-.99.2L15.57 12.4l3.44-3.44-2.09-7.4z"/>
            </svg>
            Google Play
            <span className="text-[10px] text-gray-500 font-normal">Próximamente</span>
          </button>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-[#1A1F2E]/60 backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-[#2E5CFF]/30 transition">
            <div className="w-10 h-10 rounded-xl bg-[#2E5CFF]/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[#2E5CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-1.5">Mapa en vivo</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Visualiza el ambiente de cada local en el mapa. Cuanta más gente, más caliente el marcador.</p>
          </div>

          <div className="bg-[#1A1F2E]/60 backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-[#8B5CF6]/30 transition">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-1.5">Check-in real</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Haz check-in cuando llegues a un local y ayuda a otros a saber dónde está la gente.</p>
          </div>

          <div className="bg-[#1A1F2E]/60 backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-[#FF8A00]/30 transition">
            <div className="w-10 h-10 rounded-xl bg-[#FF8A00]/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[#FF8A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-1.5">Eventos</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Descubre eventos activos y próximas noches especiales en los locales de tu ciudad.</p>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#2E5CFF]/10 to-[#8B5CF6]/10 border border-white/5 rounded-3xl p-10">
          <h2 className="text-3xl font-black mb-3">¿Listo para salir?</h2>
          <p className="text-gray-400 mb-7">Entra al mapa y mira el ambiente de tu ciudad ahora mismo.</p>
          <Link
            href="/mapa"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#2E5CFF] to-[#8B5CF6] text-white font-bold hover:opacity-90 hover:scale-[1.02] transition shadow-xl shadow-[#2E5CFF]/25"
          >
            Ver el mapa
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2E5CFF] to-[#8B5CF6] flex items-center justify-center">
            <img src="/logo.jpeg" alt="Ozio Logo" className="w-3 h-3" />
          </div>
          <span className="text-gray-500 text-sm">© {new Date().getFullYear()} Ozio</span>
        </div>
        <p className="text-gray-600 text-xs">Descubre el ocio nocturno de tu ciudad</p>
      </footer>

    </div>
  );
}
