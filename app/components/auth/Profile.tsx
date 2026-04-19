"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { createClient } from "@/lib/supabase/client";
import { getToken } from "@/lib/hooks/getToken";
import { Heart, Clock, Settings, CalendarDays, Plus, BarChart3, Lock } from "lucide-react";
import { isPremium } from "@/lib/hooks/plan";
import { UserProfile } from "./profile/types";
import DiamondIcon from "./profile/DiamondIcon";
import FavoriteSpotCard from "./profile/FavoriteSpotCard";
import ThemeToggleItem from "./profile/ThemeToggleItem";
import SettingsItem from "./profile/SettingsItem";
import EditProfileModal from "./profile/EditProfileModal";
import EditEventModal from "./profile/EditEventModal";
import PremiumModal from "./profile/PremiumModal";
import StatsTab from "./profile/StatsTab";
import CheckInHistoryTab from "./profile/CheckInHistoryTab";
import PointsTab from "./profile/PointsTab";
import AccountInfoView from "./profile/AccountInfoView";
import AboutView from "./profile/AboutView";
import PrivacyView from "./profile/PrivacyView";
import NotificationsView from "./profile/NotificationsView";

export default function Profile({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { setLoaded, setCurrentUser, setUserFavorites, setVenues } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "account" | "about" | "privacy" | "notifications">("main");

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

      if (!data[0]) {
        document.cookie = "session=; path=/; max-age=0; SameSite=Strict";
        if (onLogout) onLogout();
        else router.push("/profile");
        return;
      }

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
      <h1 className="sr-only">{user.name} — Perfil</h1>

      {/* Profile header */}
      <section className="px-4 pt-4" aria-label="Información de perfil">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className={`w-[82px] h-[82px] rounded-full p-[2.5px] ${isVenue ? "bg-gradient-to-tr from-ozio-orange via-ozio-purple to-ozio-blue" : "bg-gradient-to-tr from-ozio-blue via-ozio-purple to-pink-500"}`}>
              {user.avatar_path ? (
                <img src={user.avatar_path} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-ozio-dark" />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-ozio-dark bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center">
                  <span className="text-ozio-text text-2xl font-black">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowEditModal(true)} className="absolute -bottom-1 -right-1 w-6 h-6 bg-ozio-blue rounded-full border-2 border-ozio-dark hover:bg-ozio-purple transition flex items-center justify-center shadow-md">
              <Plus size={12} className="text-ozio-text" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-around">
            <div className="text-center">
              <p className="text-ozio-text text-xl font-black leading-none">{isVenue ? user.events?.length || 0 : user.check_ins?.length || 0}</p>
              <p className="text-ozio-text-muted text-xs mt-1">{isVenue ? "Eventos" : "Check-ins"}</p>
            </div>
            <div className="w-px h-8 bg-ozio-card" />
            <div className="text-center">
              <p className="text-ozio-text text-xl font-black leading-none">{isVenue ? user.check_ins?.length || 0 : user.favorites?.length || 0}</p>
              <p className="text-ozio-text-muted text-xs mt-1">{isVenue ? "Visitas" : "Favoritos"}</p>
            </div>
            {!isVenue && (
              <>
                <div className="w-px h-8 bg-ozio-card" />
                <div className="text-center">
                  <p className="text-ozio-orange text-xl font-black leading-none flex items-center justify-center gap-1">
                    <DiamondIcon size={14} />
                    {user.points ?? 0}
                  </p>
                  <p className="text-ozio-text-muted text-xs mt-1">Puntos</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-ozio-text font-black text-base leading-tight">{user.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isVenue ? "bg-ozio-orange/10 text-ozio-orange border-ozio-orange/25" : "bg-ozio-blue/10 text-ozio-blue border-ozio-blue/25"}`}>
              {isVenue ? "Local" : "Usuario"}
            </span>
          </div>
          {user.username && <p className="text-ozio-text-subtle text-sm mt-0.5">@{user.username}</p>}
          {user.description && <p className="text-ozio-text-secondary text-sm mt-1.5 leading-relaxed">{user.description}</p>}
          <p className="text-ozio-text-dim text-xs mt-1.5">
            Miembro desde {new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
          </p>
          {isVenue && user.genres && user.genres.length > 0 && (
            <div className="mt-3">
              <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                {user.genres.map(({ genre }) => (
                  <li key={genre.id}>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-ozio-purple/10 text-ozio-purple border border-ozio-purple/25">
                      <span>{genre.emoji}</span>
                      <span>{genre.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowEditModal(true)} className="flex-1 py-2 bg-ozio-card hover:bg-ozio-card/70 border border-ozio-card text-ozio-text text-sm font-semibold rounded-xl transition">
            Editar perfil
          </button>
          {isVenue && (
            <button onClick={() => router.push("/anadir?tipo=evento")} className="flex-1 py-2 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-ozio-text text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
              <Plus size={15} /> Crear evento
            </button>
          )}
          <button onClick={() => { setActiveTab("settings"); setSettingsView("main"); }} className="w-10 bg-ozio-card hover:bg-ozio-card/70 border border-ozio-card text-ozio-text-secondary rounded-xl transition flex items-center justify-center">
            <Settings size={16} />
          </button>
        </div>
      </section>

      {/* Tab navigation */}
      <nav className="flex border-t border-b border-ozio-darker" aria-label="Secciones del perfil">
        {isVenue ? (
          <>
            <button onClick={() => setActiveTab("events")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "events" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}>
              <CalendarDays size={22} />
            </button>
            <button
              onClick={() => isPremium(user) ? setActiveTab("stats") : setShowPremiumModal(true)}
              className={`flex-1 py-3 flex justify-center items-center gap-1 transition ${activeTab === "stats" ? "text-ozio-orange border-b-2 border-ozio-orange" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}
            >
              <BarChart3 size={22} />
              {!isPremium(user) && <Lock size={12} className="text-ozio-text-dim" />}
            </button>
            <button onClick={() => { setActiveTab("settings"); setSettingsView("main"); }} className={`flex-1 py-3 flex justify-center transition ${activeTab === "settings" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}>
              <Settings size={22} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab("favorites")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "favorites" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}>
              <Heart size={22} />
            </button>
            <button onClick={() => setActiveTab("historial")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "historial" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}>
              <Clock size={22} />
            </button>
            <button onClick={() => setActiveTab("puntos")} className={`flex-1 py-3 flex justify-center transition ${activeTab === "puntos" ? "border-b-2 border-ozio-orange" : "opacity-30 hover:opacity-60"}`}>
              <DiamondIcon size={22} />
            </button>
            <button onClick={() => { setActiveTab("settings"); setSettingsView("main"); }} className={`flex-1 py-3 flex justify-center transition ${activeTab === "settings" ? "text-ozio-text border-b-2 border-white" : "text-ozio-text-dim hover:text-ozio-text-muted"}`}>
              <Settings size={22} />
            </button>
          </>
        )}
      </nav>

      {/* Tab content */}
      <section className="px-4 pt-4" aria-label="Contenido del perfil">
        <div className="space-y-3">
          {isVenue && activeTab === "events" && (
            <div className="space-y-3">
              {user.events && user.events.length > 0 ? (
                user.events
                  .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                  .map((event) => {
                    const isPast = new Date(event.ends_at) <= new Date();
                    return (
                      <article key={event.id} className={`bg-ozio-card border border-ozio-card/50 rounded-2xl flex gap-3 p-4 hover:bg-ozio-card/50 transition ${isPast ? "opacity-55" : ""}`}>
                        <img src={event.image_path || "https://via.placeholder.com/80"} alt="Event" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 ${isPast ? "grayscale" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-ozio-text font-semibold text-sm truncate">{event.name || event.title}</h3>
                          <p className="text-ozio-text-muted text-xs mt-0.5">
                            {new Date(event.starts_at).toLocaleDateString("es-ES")} · {new Date(event.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} – {new Date(event.ends_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-ozio-text-subtle text-xs mt-1">👥 {event.event_attendees[0]?.count || 0} asistentes</p>
                          {event.genres && event.genres.length > 0 && (
                            <ul className="flex flex-wrap gap-1 mt-1.5 list-none p-0 m-0">
                              {event.genres.slice(0, 3).map((g: any) => (
                                <li key={g.genre_id}>
                                  <span className="text-[10px] bg-ozio-blue/10 text-ozio-blue border border-ozio-blue/20 px-1.5 py-0.5 rounded-full">
                                    {g.genre?.emoji} {g.genre?.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {isPast && <span className="bg-ozio-card/50 text-ozio-text-muted text-[10px] px-2 py-0.5 rounded-full">Finalizado</span>}
                            {event.featured && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isPast ? "bg-ozio-card/20 text-ozio-text-subtle border-gray-600/30" : "bg-ozio-blue/20 text-ozio-blue border-ozio-blue/30"}`}>
                                Destacado
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button className={`transition ${isPast ? "text-ozio-text-dim hover:text-ozio-text-subtle" : "text-ozio-blue hover:text-ozio-purple"}`} onClick={() => setEditingEvent(event)} title="Editar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="text-ambience-high/70 hover:text-ambience-high transition" onClick={() => handleDeleteEvent(event.id)} title="Eliminar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </article>
                    );
                  })
              ) : (
                <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-ozio-text font-semibold mb-1">Sin eventos aún</p>
                  <p className="text-ozio-text-subtle text-sm">Crea tu primer evento para que aparezca aquí</p>
                </div>
              )}
              <button onClick={() => router.push("/anadir?tipo=evento")} className="w-full py-3.5 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-ozio-text font-semibold rounded-2xl transition">
                + Crear Evento
              </button>
            </div>
          )}

          {!isVenue && activeTab === "favorites" && (
            <div className="space-y-3">
              {user.favorites && user.favorites.length > 0 ? (
                user.favorites.map((fav) => <FavoriteSpotCard key={`${fav.user_id}${fav.venue_id}`} favorite={fav.venues} />)
              ) : (
                <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">❤️</p>
                  <p className="text-ozio-text font-semibold mb-1">Sin favoritos</p>
                  <p className="text-ozio-text-subtle text-sm">Guarda tus locales preferidos aquí</p>
                </div>
              )}
            </div>
          )}

          {!isVenue && activeTab === "historial" && <CheckInHistoryTab userId={user.id} />}

          {!isVenue && activeTab === "puntos" && <PointsTab totalPoints={user.points ?? 0} />}

          {activeTab === "stats" && <StatsTab />}

          {activeTab === "settings" && settingsView === "notifications" && (
            <NotificationsView onBack={() => setSettingsView("main")} />
          )}

          {activeTab === "settings" && settingsView === "privacy" && (
            <PrivacyView onBack={() => setSettingsView("main")} />
          )}

          {activeTab === "settings" && settingsView === "account" && (
            <AccountInfoView user={user} onBack={() => setSettingsView("main")} />
          )}

          {activeTab === "settings" && settingsView === "about" && (
            <AboutView onBack={() => setSettingsView("main")} />
          )}

          {activeTab === "settings" && settingsView === "main" && (
            <div className="space-y-2">
              <ThemeToggleItem />
              <SettingsItem icon="🔔" title="Notificaciones" onClick={() => setSettingsView("notifications")} />
              <SettingsItem icon="🔒" title="Privacidad" onClick={() => setSettingsView("privacy")} />
              {isVenue && <SettingsItem icon="🏢" title="Información del local" />}
              <SettingsItem icon="ℹ️" title="Acerca de" onClick={() => setSettingsView("about")} />
              <SettingsItem icon="👤" title="Información de cuenta" onClick={() => setSettingsView("account")} />
              {isVenue && <SettingsItem icon="👑" title="Cambiar plan" onClick={() => router.push("/premium")} />}
              <div className="pt-2 mt-2 border-t border-ozio-darker/80">
                <SettingsItem icon="🚪" title="Cerrar sesión" onClick={handleLogout} />
              </div>
            </div>
          )}
        </div>
      </section>

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
