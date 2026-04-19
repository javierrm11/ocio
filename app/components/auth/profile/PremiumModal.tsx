"use client";
import { useRouter } from "next/navigation";

export default function PremiumModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title" onClick={onClose}>
      <div
        className="w-full max-w-md bg-ozio-dark rounded-t-3xl p-6 pb-10 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 24px rgba(251,191,36,0.4)" }}>
            <span className="text-3xl">👑</span>
          </div>
          <h2 id="premium-modal-title" className="text-ozio-text text-xl font-black mb-2">Estadísticas Premium</h2>
          <p className="text-ozio-text-muted text-sm leading-relaxed">
            Accede a estadísticas detalladas de tu local o actividad: visitas, hora pico, tendencias y mucho más.
          </p>
        </div>

        <ul className="space-y-3 mb-6 list-none p-0 m-0">
          {["📊 Gráficos de actividad en tiempo real", "🕐 Hora pico de visitas", "🏆 Top eventos y locales", "📅 Análisis mensual y tendencias"].map((feat) => (
            <li key={feat} className="flex items-center gap-3 text-sm">
              <span className="text-ozio-orange text-base">{feat.slice(0, 2)}</span>
              <span className="text-ozio-text-secondary">{feat.slice(3)}</span>
            </li>
          ))}
        </ul>

        <button
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#1a0a00]"
          style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 16px rgba(251,191,36,0.3)" }}
          onClick={() => router.push("/premium")}
        >
          Actualizar a Premium 👑
        </button>
        <button onClick={onClose} className="w-full mt-3 py-2 text-ozio-text-subtle text-sm hover:text-ozio-text-secondary transition">
          Ahora no
        </button>
      </div>
    </div>
  );
}
