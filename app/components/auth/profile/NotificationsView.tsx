"use client";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface NotificationPrefs {
  enabled: boolean;
  checkins: boolean;
  events: boolean;
  points: boolean;
  news: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  checkins: true,
  events: true,
  points: true,
  news: true,
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-label={value ? "Desactivar" : "Activar"}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-ozio-blue" : "bg-ozio-darker"}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${value ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

const CATEGORIES: { key: keyof Omit<NotificationPrefs, "enabled">; icon: string; label: string; desc: string }[] = [
  { key: "checkins", icon: "📍", label: "Check-ins",  desc: "Confirmaciones y actividad de check-in" },
  { key: "events",   icon: "🎉", label: "Eventos",    desc: "Nuevos eventos cercanos a ti" },
  { key: "points",   icon: "💎", label: "Puntos",     desc: "Recompensas y movimientos de puntos" },
  { key: "news",     icon: "📢", label: "Novedades",  desc: "Actualizaciones y noticias de Ozio" },
];

export default function NotificationsView({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        setPrefs({ ...DEFAULT_PREFS, ...data });
        setLoaded(true);
      });
  }, []);

  const save = async (next: NotificationPrefs) => {
    setSaving(true);
    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  };

  const update = (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    save(next);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-5 text-ozio-text-muted hover:text-ozio-text transition text-md font-medium"
      >
        <ChevronLeft size={20} />
        Notificaciones
      </button>

      <h2 className="text-ozio-text text-lg font-black">🔔 Notificaciones</h2>

      {/* Global toggle */}
      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-ozio-text font-semibold text-sm">Activar notificaciones</p>
          <p className="text-ozio-text-muted text-xs mt-0.5">Recibe avisos sobre tu actividad en Ozio</p>
        </div>
        {loaded && <Toggle value={prefs.enabled} onChange={(v) => update({ enabled: v })} />}
      </div>

      {/* Per-category toggles */}
      <div className={`bg-ozio-card border border-ozio-card/50 rounded-2xl divide-y divide-ozio-darker/60 transition-opacity ${!prefs.enabled ? "opacity-40 pointer-events-none" : ""}`}>
        {CATEGORIES.map(({ key, icon, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-ozio-text text-sm font-medium">{label}</p>
                <p className="text-ozio-text-muted text-xs">{desc}</p>
              </div>
            </div>
            {loaded && <Toggle value={prefs[key]} onChange={(v) => update({ [key]: v })} />}
          </div>
        ))}
      </div>

      {saving && (
        <p className="text-center text-ozio-text-dim text-xs animate-pulse">Guardando...</p>
      )}
    </div>
  );
}
