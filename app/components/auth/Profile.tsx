"use client";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import { useAppStore } from "@/lib/stores/venueStore";
import { createClient } from "@/lib/supabase/client";
import { getToken } from "@/lib/hooks/getToken";
import { Heart, Clock, Settings, CalendarDays, Plus, BarChart3, Lock, Gem } from "lucide-react";
import { isPremium } from "@/lib/hooks/plan";

interface CheckInHistory {
  id: string;
  venue_id: string;
  profile_id: string;
  created_at: string;
  venues: {
    id: string;
    name: string;
    avatar_path?: string;
    address?: string | null;
  };
}
interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}
interface UserProfile {
  id: string;
  name: string;
  username: string;
  description?: string;
  avatar_path?: string | null;
  role: "user" | "venue";
  created_at: string;
  updated_at: string;
  check_ins?: any[];
  favorites?: any[];
  following?: number;
  events?: any[];
  checkInHistory?: CheckInHistory[];
  genres?: { genre: Genre; genre_id: number }[];
  plan?: string;
  points?: number;
}

function DiamondIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 9l4-5h12l4 5-10 11L2 9z" fill="url(#dg)" />
      <path d="M2 9h20M8 4l4 5 4-5M12 14l-10-5M12 14l10-5" stroke="#b45309" strokeWidth="0.6" strokeLinejoin="round" />
      <defs>
        <linearGradient id="dg" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Profile({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { setLoaded, setCurrentUser, setUserFavorites, setVenues } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => { fetchUserProfile(); }, []);
  useEffect(() => { if (user) setActiveTab(!user.username ? "events" : "favorites"); }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al cargar perfil");
      const data = await response.json();
      setUser(data[0]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) return;
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar evento");
      fetchUserProfile();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el evento");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "session=; path=/; max-age=0; SameSite=Strict";
    setCurrentUser(null);
    setUserFavorites([]);
    setVenues([]);
    setLoaded(false);
    if (onLogout) onLogout();
    else router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue" />
      </div>
    );
  }
  if (!user) return null;

  const isVenue = !user.username;

  return (
    <div className="min-h-screen bg-ozio-dark pb-24 max-w-4xl mx-auto">
      <div className="h-[72px]" />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className={`w-[82px] h-[82px] rounded-full p-[2.5px] ${isVenue ? "bg-gradient-to-tr from-ozio-orange via-ozio-purple to-ozio-blue" : "bg-gradient-to-tr from-ozio-blue via-ozio-purple to-pink-500"}`}>
              {user.avatar_path ? (
                <img src={user.avatar_path} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-ozio-dark" />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-ozio-dark bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center">
                  <span className="text-white text-2xl font-black">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowEditModal(true)} className="absolute -bottom-1 -right-1 w-6 h-6 bg-ozio-blue rounded-full border-2 border-ozio-dark hover:bg-ozio-purple transition flex items-center justify-center shadow-md">
              <Plus size={12} className="text-white" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-around">
            <div className="text-center">
              <p className="text-white text-xl font-black leading-none">{isVenue ? user.events?.length || 0 : user.check_ins?.length || 0}</p>
              <p className="text-gray-400 text-xs mt-1">{isVenue ? "Eventos" : "Check-ins"}</p>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <p className="text-white text-xl font-black leading-none">{isVenue ? user.check_ins?.length || 0 : user.favorites?.length || 0}</p>
              <p className="text-gray-400 text-xs mt-1">{isVenue ? "Visitas" : "Favoritos"}</p>
            </div>
            {!isVenue && (
              <>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                  <p className="text-yellow-400 text-xl font-black leading-none flex items-center justify-center gap-1">
                    <DiamondIcon size={14} />
                    {user.points ?? 0}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Puntos</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-black text-base leading-tight">{user.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isVenue ? "bg-ozio-orange/10 text-ozio-orange border-ozio-orange/25" : "bg-ozio-blue/10 text-ozio-blue border-ozio-blue/25"}`}>
              {isVenue ? "Local" : "Usuario"}
            </span>
          </div>
          {user.username && <p className="text-gray-500 text-sm mt-0.5">@{user.username}</p>}
          {user.description && <p className="text-gray-300 text-sm mt-1.5 leading-relaxed">{user.description}</p>}
          <p className="text-gray-600 text-xs mt-1.5">
            Miembro desde {new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
          </p>
          {isVenue && user.genres && user.genres.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {user.genres.map(({ genre }) => (
                  <span key={genre.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-ozio-purple/10 text-ozio-purple border border-ozio-purple/25">
                    <span>{genre.emoji}</span>
                    <span>{genre.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowEditModal(true)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-semibold rounded-xl transition">
            Editar perfil
          </button>
          {isVenue && (
            <button onClick={() => router.push("/anadir?tipo=evento")} className="flex-1 py-2 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
              <Plus size={15} /> Crear evento
            </button>
          )}
          <button onClick={() => setActiveTab("settings")} className="w-10 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl transition flex items-center justify-center">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex border-t border-b border-gray-800">
        {isVenue ? (
          <>
            <button onClick={() => setActiveTab("events")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "events" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}>
              <CalendarDays size={22} />
            </button>
            <button
              onClick={() => isPremium(user) ? setActiveTab("stats") : setShowPremiumModal(true)}
              className={`flex-1 py-3 flex justify-center items-center gap-1 transition ${activeTab === "stats" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-600 hover:text-gray-400"}`}
            >
              <BarChart3 size={22} />
              {!isPremium(user) && <Lock size={12} className="text-gray-600" />}
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "settings" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}>
              <Settings size={22} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab("favorites")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "favorites" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}>
              <Heart size={22} />
            </button>
            <button onClick={() => setActiveTab("historial")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "historial" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}>
              <Clock size={22} />
            </button>
            <button onClick={() => setActiveTab("puntos")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "puntos" ? "border-b-2 border-yellow-500" : "opacity-30 hover:opacity-60"}`}>
              <DiamondIcon size={22} />
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "settings" ? "text-white border-b-2 border-white" : "text-gray-600 hover:text-gray-400"}`}>
              <Settings size={22} />
            </button>
          </>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="space-y-3">
          {isVenue && activeTab === "events" && (
            <div className="space-y-3">
              {user.events && user.events.length > 0 ? (
                user.events
                  .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                  .map((event) => {
                    const isPast = new Date(event.ends_at) <= new Date();
                    return (
                      <div key={event.id} className={`bg-ozio-card border border-gray-700/50 rounded-2xl flex gap-3 p-4 hover:bg-gray-800/50 transition ${isPast ? "opacity-55" : ""}`}>
                        <img src={event.image_path || "https://via.placeholder.com/80"} alt="Event" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 ${isPast ? "grayscale" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate">{event.name || event.title}</h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {new Date(event.starts_at).toLocaleDateString("es-ES")} · {new Date(event.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} – {new Date(event.ends_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">👥 {event.event_attendees[0]?.count || 0} asistentes</p>
                          {/* Géneros del evento */}
                          {event.genres && event.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {event.genres.slice(0, 3).map((g: any) => (
                                <span key={g.genre_id} className="text-[10px] bg-ozio-blue/10 text-ozio-blue border border-ozio-blue/20 px-1.5 py-0.5 rounded-full">
                                  {g.genre?.emoji} {g.genre?.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {isPast && <span className="bg-gray-700/50 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">Finalizado</span>}
                            {event.featured && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isPast ? "bg-gray-700/20 text-gray-500 border-gray-600/30" : "bg-ozio-blue/20 text-ozio-blue border-ozio-blue/30"}`}>
                                Destacado
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button className={`transition ${isPast ? "text-gray-600 hover:text-gray-500" : "text-ozio-blue hover:text-ozio-purple"}`} onClick={() => setEditingEvent(event)} title="Editar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="text-red-500/70 hover:text-red-500 transition" onClick={() => handleDeleteEvent(event.id)} title="Eliminar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-white font-semibold mb-1">Sin eventos aún</p>
                  <p className="text-gray-500 text-sm">Crea tu primer evento para que aparezca aquí</p>
                </div>
              )}
              <button onClick={() => router.push("/anadir?tipo=evento")} className="w-full py-3.5 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-white font-semibold rounded-2xl transition">
                + Crear Evento
              </button>
            </div>
          )}

          {!isVenue && activeTab === "favorites" && (
            <div className="space-y-3">
              {user.favorites && user.favorites.length > 0 ? (
                user.favorites.map((fav) => <FavoriteSpotCard key={`${fav.user_id}${fav.venue_id}`} favorite={fav.venues} />)
              ) : (
                <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">❤️</p>
                  <p className="text-white font-semibold mb-1">Sin favoritos</p>
                  <p className="text-gray-500 text-sm">Guarda tus locales preferidos aquí</p>
                </div>
              )}
            </div>
          )}

          {!isVenue && activeTab === "historial" && <CheckInHistoryTab userId={user.id} />}

          {!isVenue && activeTab === "puntos" && <PointsTab totalPoints={user.points ?? 0} />}

          {activeTab === "stats" && <StatsTab />}

          {activeTab === "settings" && (
            <div className="space-y-2">
              <SettingsItem icon="🔔" title="Notificaciones" />
              <SettingsItem icon="🔒" title="Privacidad" />
              {isVenue && <SettingsItem icon="🏢" title="Información del local" />}
              <SettingsItem icon="ℹ️" title="Acerca de" />
              <SettingsItem icon="👤" title="Información de cuenta" />
              {isVenue && <SettingsItem icon="👑" title="Cambiar plan" onClick={() => router.push("/premium")} />}
              <div className="pt-2 mt-2 border-t border-gray-800/80">
                <SettingsItem icon="🚪" title="Cerrar sesión" onClick={handleLogout} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} onProfileUpdated={(updatedUser) => { setUser({ ...user, ...updatedUser }); setShowEditModal(false); }} />
      )}
      {editingEvent && (
        <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} onEventUpdated={() => { setEditingEvent(null); fetchUserProfile(); }} onEventDeleted={() => { setEditingEvent(null); fetchUserProfile(); }} />
      )}
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  );
}

// ── StatsTab ──────────────────────────────────────────────────────────────────
function StatsTab() {
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
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400" />
    </div>
  );

  if (error || !stats) return (
    <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-8 text-center">
      <p className="text-gray-400 text-sm">{error ?? "Sin datos"}</p>
    </div>
  );

  const isVenueStats = stats.type === "venue";

  return (
    <div className="space-y-4">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ozio-card border border-amber-400/20 rounded-2xl p-4 text-center">
          <p className="text-amber-400 text-3xl font-black">{stats.total_checkins}</p>
          <p className="text-gray-400 text-xs mt-1">{isVenueStats ? "Visitas totales" : "Check-ins totales"}</p>
        </div>
        {isVenueStats ? (
          <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 text-center">
            <p className="text-white text-3xl font-black">{stats.daily_avg}</p>
            <p className="text-gray-400 text-xs mt-1">Media diaria</p>
          </div>
        ) : (
          <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 text-center">
            <p className="text-white text-3xl font-black">{stats.fav_day ?? "—"}</p>
            <p className="text-gray-400 text-xs mt-1">Día favorito</p>
          </div>
        )}
      </div>

      {/* Hora pico / top local */}
      {isVenueStats && stats.peak_hour && (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <p className="text-white font-bold text-lg">{stats.peak_hour}</p>
            <p className="text-gray-400 text-xs">Hora pico de visitas</p>
          </div>
        </div>
      )}

      {/* Gráfico de barras simple — actividad */}
      {isVenueStats && stats.daily_data?.length > 0 && (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Visitas últimos 30 días</p>
          <div className="flex items-end gap-1 h-20">
            {stats.daily_data.slice(-20).map((d: any) => {
              const max = Math.max(...stats.daily_data.map((x: any) => x.count), 1);
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-amber-400/80"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isVenueStats && stats.monthly_data?.length > 0 && (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Check-ins por mes</p>
          <div className="flex items-end gap-2 h-20">
            {stats.monthly_data.map((d: any) => {
              const max = Math.max(...stats.monthly_data.map((x: any) => x.count), 1);
              const pct = Math.round((d.count / max) * 100);
              const label = d.month.slice(5);
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-amber-400/80" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[9px] text-gray-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top lista */}
      {isVenueStats && stats.top_events?.length > 0 && (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Top eventos</p>
          <div className="space-y-2">
            {stats.top_events.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-black text-xs w-4">#{i + 1}</span>
                  <p className="text-white text-sm truncate max-w-[180px]">{e.title}</p>
                </div>
                <span className="text-gray-400 text-xs">👥 {e.attendees}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isVenueStats && stats.top_venues?.length > 0 && (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Locales más visitados</p>
          <div className="space-y-2">
            {stats.top_venues.map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-amber-400 font-black text-xs w-4">#{i + 1}</span>
                {v.avatar_path && <img src={v.avatar_path} alt={v.name} className="w-8 h-8 rounded-full object-cover" />}
                <p className="text-white text-sm flex-1 truncate">{v.name}</p>
                <span className="text-gray-400 text-xs">{v.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PremiumModal ──────────────────────────────────────────────────────────────
function PremiumModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f1220] rounded-t-3xl p-6 pb-10 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 24px rgba(251,191,36,0.4)" }}>
            <span className="text-3xl">👑</span>
          </div>
          <h2 className="text-white text-xl font-black mb-2">Estadísticas Premium</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Accede a estadísticas detalladas de tu local o actividad: visitas, hora pico, tendencias y mucho más.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {["📊 Gráficos de actividad en tiempo real", "🕐 Hora pico de visitas", "🏆 Top eventos y locales", "📅 Análisis mensual y tendencias"].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 text-base">{feat.slice(0, 2)}</span>
              <span className="text-gray-300">{feat.slice(3)}</span>
            </div>
          ))}
        </div>

        <button
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#1a0a00]"
          style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 16px rgba(251,191,36,0.3)" }}
          onClick={() => router.push("/premium")}
        >
          Actualizar a Premium 👑
        </button>
        <button onClick={onClose} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-300 transition">
          Ahora no
        </button>
      </div>
    </div>
  );
}

// ── Helper selector de géneros reutilizable ──
function GenreSelector({ selected, onChange }: { selected: number[]; onChange: (ids: number[]) => void }) {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/genres`)
      .then((r) => r.json())
      .then(setGenres)
      .catch(() => {});
  }, []);

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);

  if (genres.length === 0) return null;

  return (
    <div>
      <label className="block text-white font-medium mb-2">Géneros musicales</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggle(genre.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                isSelected
                  ? "bg-ozio-blue border-ozio-blue text-white scale-105"
                  : "bg-ozio-dark border-gray-700 text-gray-400 hover:border-ozio-blue/50 hover:text-white"
              }`}
            >
              <span>{genre.emoji}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-ozio-blue mt-2">
          {selected.length} género{selected.length > 1 ? "s" : ""} seleccionado{selected.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}


function FavoriteSpotCard({ favorite }: { favorite: any }) {
  return (
    <div className="bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden flex gap-4 p-4 hover:bg-gray-800/50 transition">
      <img src={favorite?.avatar_path || "https://via.placeholder.com/80"} alt="Venue" className="w-20 h-20 rounded-xl object-cover" />
      <div className="flex-1">
        <h3 className="text-white font-semibold">{favorite?.name}</h3>
        <p className="text-gray-400 text-sm">{favorite?.address}</p>
        <button className="mt-2 px-3 py-1 bg-ozio-blue hover:bg-ozio-purple text-white text-xs font-medium rounded-full transition" onClick={() => alert("Función de mapa no implementada")}>
          Ver en mapa
        </button>
      </div>
      <button className="text-red-400 hover:text-red-500 transition">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      </button>
    </div>
  );
}

function SettingsItem({ icon, title, toggle, onClick }: { icon: string; title: string; toggle?: boolean; onClick?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800/50 transition" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-white font-medium">{title}</span>
      </div>
      {toggle ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); setEnabled(!enabled); }} className={`w-12 h-6 rounded-full transition relative ${enabled ? "bg-ozio-blue" : "bg-gray-700"}`}>
          <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      ) : (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      )}
    </div>
  );
}

function EditProfileModal({ user, onClose, onProfileUpdated }: { user: UserProfile; onClose: () => void; onProfileUpdated: (updated: Partial<UserProfile>) => void }) {
  const isVenue = !user.username;
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_path || null);
  const [formData, setFormData] = useState({ name: user.name || "", username: user.username || "", description: user.description || "", avatar: null as File | null });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      if (!isVenue) data.append("username", formData.username);
      if (formData.avatar) data.append("avatar", formData.avatar);
      else if (user.avatar_path) data.append("avatar_path", user.avatar_path);

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) throw new Error("Error al actualizar perfil");
      const updated = await response.json();
      onProfileUpdated(updated);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ozio-card border border-gray-700/50 rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-ozio-card border-b border-gray-700/50 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white text-xl font-bold">✏️ Editar Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-ozio-blue" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-ozio-blue bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <label htmlFor="edit-avatar" className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-card cursor-pointer hover:bg-ozio-purple transition">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </label>
              <input id="edit-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <p className="text-gray-400 text-xs">Toca la cámara para cambiar tu foto</p>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">{isVenue ? "Nombre del local *" : "Nombre *"}</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none" placeholder="Tu nombre" />
          </div>
          {!isVenue && (
            <div>
              <label className="block text-white font-medium mb-2">Usuario</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none" placeholder="tu_usuario" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-white font-medium mb-2">Descripción</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} maxLength={200}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none resize-none"
              placeholder={isVenue ? "Describe tu establecimiento..." : "Cuéntanos algo sobre ti..."} />
            <p className="text-gray-500 text-xs text-right mt-1">{formData.description.length}/200</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal editar evento ──
function EditEventModal({ event, onClose, onEventUpdated, onEventDeleted }: { event: any; onClose: () => void; onEventUpdated: () => void; onEventDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(event.image_path || null);

  // Precargar géneros actuales del evento
  const initialGenres: number[] = (event.genres ?? []).map((g: any) => g.genre_id ?? g.genre?.id).filter(Boolean);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(initialGenres);

  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    starts_at: event.starts_at ? new Date(event.starts_at) : null,
    ends_at: event.ends_at ? new Date(event.ends_at) : null,
    featured: event.featured || false,
    image: null as File | null,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar evento");
      onEventDeleted();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el evento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const data = new FormData();
      data.append("venue_id", event.venue_id);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("starts_at", formData.starts_at?.toISOString() || "");
      data.append("ends_at", formData.ends_at?.toISOString() || "");
      data.append("featured", formData.featured.toString());
      data.append("genre_ids", JSON.stringify(selectedGenres));
      if (formData.image) data.append("image", formData.image);
      else if (event.image_path) data.append("image_path", event.image_path);

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) throw new Error("Error al actualizar evento");
      onEventUpdated();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-ozio-card border border-gray-700/60 rounded-3xl max-w-4xl w-full max-h-[80dvh] overflow-y-auto shadow-2xl">

        {/* Header con gradiente */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-ozio-purple/20 to-ozio-blue/10 border-b border-gray-700/50 px-7 py-5 flex items-center justify-between rounded-t-3xl backdrop-blur-sm">
          <div>
            <h2 className="text-white text-2xl font-bold">Editar evento</h2>
            <p className="text-gray-400 text-sm mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">

          {/* Imagen */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2">Imagen del evento</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-event-image" />
            <label htmlFor="edit-event-image" className="group relative block w-full h-56 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-ozio-blue/60 transition overflow-hidden">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-white text-sm font-medium">Cambiar imagen</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm">Haz click para subir una imagen</span>
                </div>
              )}
            </label>
          </div>

          {/* Título + Descripción */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2">Título *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-ozio-dark border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-ozio-blue focus:outline-none focus:ring-1 focus:ring-ozio-blue/30 transition"
                placeholder="Nombre del evento" />
            </div>
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2">Descripción</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3} className="w-full bg-ozio-dark border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-ozio-blue focus:outline-none focus:ring-1 focus:ring-ozio-blue/30 transition resize-none"
                placeholder="Describe tu evento..." />
            </div>
          </div>

          {/* Fechas */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wide mb-3">Fecha y hora</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ozio-dark border border-gray-700/80 rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">Inicio</p>
                <DatePicker selected={formData.starts_at} onChange={(date: Date | null) => setFormData({ ...formData, starts_at: date })}
                  showTimeSelect dateFormat="Pp" minDate={new Date()}
                  className="w-full bg-transparent text-white focus:outline-none text-sm" />
              </div>
              <div className="bg-ozio-dark border border-gray-700/80 rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">Fin</p>
                <DatePicker selected={formData.ends_at} onChange={(date: Date | null) => setFormData({ ...formData, ends_at: date })}
                  showTimeSelect dateFormat="Pp" minDate={new Date()}
                  className="w-full bg-transparent text-white focus:outline-none text-sm" />
              </div>
            </div>
          </div>

          {/* Géneros */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wide mb-3">Géneros musicales</label>
            <GenreSelector selected={selectedGenres} onChange={setSelectedGenres} />
          </div>

          {/* Destacado */}
          <div className="flex items-center justify-between bg-ozio-dark/80 rounded-xl px-5 py-4 border border-gray-700/80">
            <div>
              <p className="text-white font-medium">Evento destacado</p>
              <p className="text-gray-500 text-xs mt-0.5">Aparece en la sección de destacados</p>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.featured ? "bg-ozio-blue" : "bg-gray-700"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${formData.featured ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleDelete} disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 font-semibold rounded-xl transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {loading ? "..." : "Eliminar"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl border border-gray-700/50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ozio-blue/20">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function CheckInHistoryTab({ userId }: { userId: string }) {
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
    <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-10 text-center">
      <div className="text-5xl mb-3">📍</div>
      <p className="text-white font-semibold mb-1">Sin historial</p>
      <p className="text-gray-400 text-sm">Aún no has hecho check-in en ningún local</p>
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
      <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-ozio-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📍</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl">{history.length}</p>
          <p className="text-gray-400 text-sm">check-ins totales</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white font-bold text-xl">{new Set(history.map((h) => h.venue_id)).size}</p>
          <p className="text-gray-400 text-sm">locales distintos</p>
        </div>
      </div>

      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3 px-1">{dateLabel}</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 flex items-center gap-4 hover:border-ozio-blue/50 transition cursor-pointer" onClick={() => router.push(`/venues/${item.venue_id}`)}>
                {item.venues?.avatar_path ? (
                  <img src={item.venues.avatar_path} alt={item.venues.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">{item.venues?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{item.venues?.name || "Local desconocido"}</p>
                  {item.venues?.address && <p className="text-gray-500 text-xs truncate mt-0.5">{item.venues.address}</p>}
                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(item.created_at).toLocaleTimeString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-ozio-orange/20 text-ozio-orange border border-ozio-orange/30 px-2.5 py-1 rounded-full font-medium">📍 Check-in</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {page < totalPages && (
        <button onClick={() => setPage(page + 1)} className="w-full py-3 bg-ozio-card border border-gray-700/50 hover:border-ozio-blue/50 text-gray-400 hover:text-white font-medium rounded-2xl transition text-sm">
          Ver más ({history.length - page * PER_PAGE} restantes)
        </button>
      )}
    </div>
  );
}

interface PointTransaction {
  id: string;
  type: "checkin_validated" | "checkout_confirmed" | "extended_stay";
  points: number;
  created_at: string;
  check_in_id: string | null;
}

const POINT_TYPE_LABEL: Record<PointTransaction["type"], string> = {
  checkin_validated: "Check-in validado",
  checkout_confirmed: "Check-out confirmado",
  extended_stay: "Permanencia +1h",
};

const POINT_TYPE_ICON: Record<PointTransaction["type"], string> = {
  checkin_validated: "📍",
  checkout_confirmed: "✅",
  extended_stay: "⏱️",
};

function PointsTab({ totalPoints }: { totalPoints: number }) {
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
      {/* Resumen total */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/25 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
          <DiamondIcon size={28} />
        </div>
        <div>
          <p className="text-yellow-400 text-3xl font-black leading-none">{totalPoints}</p>
          <p className="text-gray-400 text-sm mt-1">puntos acumulados</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white font-bold text-lg">{transactions.length}</p>
          <p className="text-gray-500 text-xs">movimientos</p>
        </div>
      </div>

      {/* Cómo ganar puntos */}
      <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 space-y-2.5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Cómo ganar puntos</p>
        {[
          { icon: "📍", label: "Check-in validado (≥ 20 min dentro)", pts: "+5" },
          { icon: "✅", label: "Check-out confirmado", pts: "+5" },
          { icon: "⏱️", label: "Permanencia superior a 1h", pts: "+10" },
        ].map(({ icon, label, pts }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-lg w-6 text-center">{icon}</span>
            <span className="text-gray-300 text-sm flex-1">{label}</span>
            <span className="text-yellow-400 font-bold text-sm">{pts}</span>
          </div>
        ))}
      </div>

      {/* Historial */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-white font-semibold mb-1">Sin puntos aún</p>
          <p className="text-gray-400 text-sm">Haz check-in en un local para empezar a ganar</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3 px-1">{dateLabel}</p>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="bg-ozio-card border border-gray-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl w-7 text-center flex-shrink-0">{POINT_TYPE_ICON[t.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{POINT_TYPE_LABEL[t.type]}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(t.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-yellow-400 font-black text-base flex-shrink-0">+{t.points}</span>
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