"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/hooks/getToken";
import { CheckInHistory } from "./types";

export default function CheckInHistoryTab({ userId }: { userId: string }) {
  const router = useRouter();
  const [history, setHistory] = useState<CheckInHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkins?profile_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al cargar historial");
        const data = await response.json();
        data.sort((a: CheckInHistory, b: CheckInHistory) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ozio-blue" /></div>;

  if (history.length === 0) return (
    <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-10 text-center">
      <div className="text-5xl mb-3">📍</div>
      <p className="text-ozio-text font-semibold mb-1">Sin historial</p>
      <p className="text-ozio-text-muted text-sm">Aún no has hecho check-in en ningún local</p>
    </div>
  );

  const grouped = history.slice(0, page * PER_PAGE).reduce((acc, item) => {
    const date = new Date(item.created_at);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    const label = isToday ? "Hoy" : isYesterday ? "Ayer" : date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {} as Record<string, CheckInHistory[]>);

  const totalPages = Math.ceil(history.length / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-ozio-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📍</span>
        </div>
        <div>
          <p className="text-ozio-text font-bold text-xl">{history.length}</p>
          <p className="text-ozio-text-muted text-sm">check-ins totales</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-ozio-text font-bold text-xl">{new Set(history.map((h) => h.venue_id)).size}</p>
          <p className="text-ozio-text-muted text-sm">locales distintos</p>
        </div>
      </div>

      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <p className="text-ozio-text-subtle text-xs uppercase font-semibold tracking-wider mb-3 px-1">{dateLabel}</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 flex items-center gap-4 hover:border-ozio-blue/50 transition cursor-pointer" onClick={() => router.push(`/venues/${item.venue_id}`)}>
                {item.venues?.avatar_path ? (
                  <img src={item.venues.avatar_path} alt={item.venues.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center flex-shrink-0">
                    <span className="text-ozio-text text-xl font-bold">{item.venues?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-ozio-text font-semibold truncate">{item.venues?.name || "Local desconocido"}</p>
                  {item.venues?.address && <p className="text-ozio-text-subtle text-xs truncate mt-0.5">{item.venues.address}</p>}
                  <p className="text-ozio-text-muted text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(item.created_at).toLocaleTimeString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-ozio-orange/20 text-ozio-orange border border-ozio-orange/30 px-2.5 py-1 rounded-full font-medium">📍 Check-in</span>
                  <svg className="w-4 h-4 text-ozio-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {page < totalPages && (
        <button onClick={() => setPage(page + 1)} className="w-full py-3 bg-ozio-card border border-ozio-card/50 hover:border-ozio-blue/50 text-ozio-text-muted hover:text-ozio-text font-medium rounded-2xl transition text-sm">
          Ver más ({history.length - page * PER_PAGE} restantes)
        </button>
      )}
    </div>
  );
}
