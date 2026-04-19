"use client";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/hooks/getToken";
import { PointTransaction, POINT_TYPE_LABEL, POINT_TYPE_ICON } from "./types";
import DiamondIcon from "./DiamondIcon";

export default function PointsTab({ totalPoints }: { totalPoints: number }) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/points`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTransactions(data.transactions ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const grouped = transactions.reduce((acc, t) => {
    const date = new Date(t.created_at);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    const label = isToday ? "Hoy" : isYesterday ? "Ayer" : date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    if (!acc[label]) acc[label] = [];
    acc[label].push(t);
    return acc;
  }, {} as Record<string, PointTransaction[]>);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-ozio-orange/10 to-ozio-orange/5 border border-ozio-orange/25 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-ozio-orange/15 flex items-center justify-center flex-shrink-0">
          <DiamondIcon size={28} />
        </div>
        <div>
          <p className="text-ozio-orange text-3xl font-black leading-none">{totalPoints}</p>
          <p className="text-ozio-text-muted text-sm mt-1">puntos acumulados</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-ozio-text font-bold text-lg">{transactions.length}</p>
          <p className="text-ozio-text-subtle text-xs">movimientos</p>
        </div>
      </div>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 space-y-2.5">
        <p className="text-ozio-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Cómo ganar puntos</p>
        {[
          { icon: "📍", label: "Check-in validado (≥ 20 min dentro)", pts: "+5" },
          { icon: "✅", label: "Check-out confirmado", pts: "+5" },
          { icon: "⏱️", label: "Permanencia superior a 1h", pts: "+10" },
        ].map(({ icon, label, pts }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-lg w-6 text-center">{icon}</span>
            <span className="text-ozio-text-secondary text-sm flex-1">{label}</span>
            <span className="text-ozio-orange font-bold text-sm">{pts}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ozio-orange" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-ozio-text font-semibold mb-1">Sin puntos aún</p>
          <p className="text-ozio-text-muted text-sm">Haz check-in en un local para empezar a ganar</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-ozio-text-subtle text-xs uppercase font-semibold tracking-wider mb-3 px-1">{dateLabel}</p>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="bg-ozio-card border border-ozio-card/50 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl w-7 text-center flex-shrink-0">{POINT_TYPE_ICON[t.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ozio-text text-sm font-medium">{POINT_TYPE_LABEL[t.type]}</p>
                      <p className="text-ozio-text-subtle text-xs mt-0.5">
                        {new Date(t.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-ozio-orange font-black text-base flex-shrink-0">+{t.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
