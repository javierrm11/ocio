"use client";

import { useAppStore } from "@/lib/stores/venueStore";
import { isPremium } from "@/lib/hooks/plan";

const FREE_FEATURES = [
  { text: "Perfil del local", ok: true },
  { text: "Check-ins en tiempo real", ok: true },
  { text: "Hasta 2 eventos al mes", ok: true },
  { text: "Visible en el mapa", ok: true },
  { text: "Estadísticas avanzadas", ok: false },
  { text: "Posición destacada", ok: false },
  { text: "Notificaciones a seguidores", ok: false },
  { text: "Badge 👑 en el mapa", ok: false },
];

const PREMIUM_FEATURES = [
  { text: "Todo lo del plan Gratis" },
  { text: "Eventos ilimitados" },
  { text: "Estadísticas avanzadas" },
  { text: "Posición destacada en búsqueda" },
  { text: "Notificaciones a seguidores" },
  { text: "Badge 👑 en el mapa" },
  { text: "Soporte prioritario 24h" },
];

export default function Premium() {
  const { currentUser } = useAppStore();
  const premium = isPremium(currentUser || {});

  return (
    <div className="min-h-screen bg-[#070B15] pb-28 pt-14 overflow-x-hidden">

      {/* ── Glows de fondo ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-ozio-purple/10 blur-[120px]" />
        <div className="absolute bottom-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-ozio-blue/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-ozio-orange/8 blur-[90px]" />
      </div>

      {/* ── Hero ── */}
      <div className="relative z-10 pt-14 pb-10 px-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 mx-auto premium-crown-icon">
          <span className="text-4xl">👑</span>
        </div>

        <h1 className="text-white text-4xl font-black tracking-tight mb-2">
          Ozio <span className="premium-title-gradient">Premium</span>
        </h1>
        <p className="text-gray-400 text-base max-w-xs mx-auto leading-relaxed">
          Destaca tu local, consigue más visibilidad y accede a estadísticas exclusivas.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["📊 Estadísticas", "🔥 Más visibilidad", "🚀 Sin límites"].map((b) => (
            <span key={b} className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              {b}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 space-y-4">

        {/* ── Card PREMIUM ── */}
        <div className="relative rounded-3xl overflow-hidden premium-card">

          {/* Shimmer */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-300/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

          {/* Badge RECOMENDADO */}
          <div className="absolute top-4 right-4">
            <span className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full premium-card-badge">
              RECOMENDADO
            </span>
          </div>

          <div className="p-6 pt-5">
            {/* Precio */}
            <div className="mb-5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Plan Premium</p>
              <div className="flex items-end gap-1">
                <span className="text-white text-5xl font-black leading-none">29€</span>
                <span className="text-gray-500 text-sm mb-1">/mes</span>
              </div>
              <p className="text-amber-400/70 text-xs mt-1">Actívalo en menos de 24h</p>
            </div>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 premium-check-icon">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5.5L4 8L8.5 2.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-gray-200 text-sm">{f.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {premium ? (
              <div className="w-full py-3.5 rounded-2xl text-center font-bold text-sm text-green-400 border border-green-500/30 bg-green-500/10">
                ✨ Plan activo
              </div>
            ) : (
              <a
                href="mailto:hola@ozio.app?subject=Solicitud%20plan%20Premium&body=Hola%2C%20me%20interesa%20el%20plan%20Premium%20para%20mi%20local."
                className="block w-full py-3.5 rounded-2xl text-center font-black text-sm hover:opacity-90 hover:scale-[1.02] transition active:scale-[0.98] premium-cta"
              >
                👑 Solicitar Premium
              </a>
            )}
          </div>
        </div>

        {/* ── Card GRATIS ── */}
        <div className="rounded-3xl p-6 free-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">Plan Gratis</p>
              <div className="flex items-end gap-1">
                <span className="text-white text-4xl font-black leading-none">0€</span>
                <span className="text-gray-600 text-sm mb-0.5">/mes</span>
              </div>
            </div>
            {!premium && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                Plan actual
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.ok ? "free-check-icon" : "free-cross-icon"}`}>
                  {f.ok ? (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5.5L4 8L8.5 2.5" stroke="#6b9fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm ${f.ok ? "text-gray-300" : "text-gray-600"}`}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs text-center pb-2 px-4 leading-relaxed">
          Para activar el plan Premium contáctanos y activamos tu cuenta en menos de 24h.
        </p>
      </div>
    </div>
  );
}