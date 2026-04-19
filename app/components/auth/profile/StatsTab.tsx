"use client";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/hooks/getToken";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function StatsTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError("Error al cargar estadísticas"); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ozio-orange" />
    </div>
  );

  if (error || !stats) return (
    <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-8 text-center">
      <p className="text-ozio-text-muted text-sm">{error ?? "Sin datos"}</p>
    </div>
  );

  const isVenueStats = stats.type === "venue";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ozio-card border border-ozio-orange/20 rounded-2xl p-4 text-center">
          <p className="text-ozio-orange text-3xl font-black">{stats.total_checkins}</p>
          <p className="text-ozio-text-muted text-xs mt-1">{isVenueStats ? "Visitas totales" : "Check-ins totales"}</p>
        </div>
        {isVenueStats ? (
          <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 text-center">
            <p className="text-ozio-text text-3xl font-black">{stats.daily_avg}</p>
            <p className="text-ozio-text-muted text-xs mt-1">Media diaria</p>
          </div>
        ) : (
          <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 text-center">
            <p className="text-ozio-text text-3xl font-black">{stats.fav_day ?? "—"}</p>
            <p className="text-ozio-text-muted text-xs mt-1">Día favorito</p>
          </div>
        )}
      </div>

      {isVenueStats && stats.daily_data?.length > 0 && (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
          <p className="text-ozio-text font-semibold text-sm mb-3">Visitas últimos 30 días</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={stats.daily_data.slice(-30)} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#f97316" }}
                formatter={(v: any) => [v, "visitas"]}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {isVenueStats && stats.hourly_data && (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
          <p className="text-ozio-text font-semibold text-sm mb-3">Visitas por hora del día</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={stats.hourly_data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#9ca3af" }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#f97316" }}
                formatter={(v: any) => [v, "visitas"]}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="#f97316" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
          {stats.peak_hour && (
            <p className="text-ozio-text-muted text-xs mt-2 text-center">Hora pico: <span className="text-ozio-orange font-bold">{stats.peak_hour}</span></p>
          )}
        </div>
      )}

      {!isVenueStats && stats.monthly_data?.length > 0 && (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
          <p className="text-ozio-text font-semibold text-sm mb-3">Check-ins por mes</p>
          <div className="flex items-end gap-2 h-20">
            {stats.monthly_data.map((d: any) => {
              const max = Math.max(...stats.monthly_data.map((x: any) => x.count), 1);
              const pct = Math.round((d.count / max) * 100);
              const label = d.month.slice(5);
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-ozio-orange/80" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[9px] text-ozio-text-subtle">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isVenueStats && stats.top_events?.length > 0 && (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
          <p className="text-ozio-text font-semibold text-sm mb-3">Top eventos</p>
          <div className="space-y-2">
            {stats.top_events.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-ozio-orange font-black text-xs w-4">#{i + 1}</span>
                  <p className="text-ozio-text text-sm truncate max-w-[180px]">{e.title}</p>
                </div>
                <span className="text-ozio-text-muted text-xs">👥 {e.attendees}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isVenueStats && stats.top_venues?.length > 0 && (
        <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
          <p className="text-ozio-text font-semibold text-sm mb-3">Locales más visitados</p>
          <div className="space-y-2">
            {stats.top_venues.map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-ozio-orange font-black text-xs w-4">#{i + 1}</span>
                {v.avatar_path && <img src={v.avatar_path} alt={v.name} className="w-8 h-8 rounded-full object-cover" />}
                <p className="text-ozio-text text-sm flex-1 truncate">{v.name}</p>
                <span className="text-ozio-text-muted text-xs">{v.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
