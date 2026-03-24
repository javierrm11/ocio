"use client";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from "react-datepicker";
import { useAppStore } from '@/lib/stores/venueStore'; // 👈

interface UserProfile {
  id: string;
  name: string;
  username: string;
  description?: string;
  avatar_path?: string | null;
  role: 'user' | 'venue';
  created_at: string;
  updated_at: string;
  // Stats
  checkIns?: number;
  favorites?: any[];
  following?: number;
  events?: any[];
}

export default function Profile({ onLogout }: { onLogout?: () => void }) {
  
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { setLoaded, setCurrentUser, setUserFavorites, setVenues } = useAppStore(); // 👈
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setActiveTab((!user.username) ? 'events' : 'favorites');
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar perfil');
      }

      const data = await response.json();
      setUser(data[0]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar evento');
      }

      // Recargar perfil para actualizar la lista
      fetchUserProfile();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el evento');
    }
  };

  const handleLogout = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');

  // ✅ Limpiar store y forzar recarga sin token
  setCurrentUser(null);
  setUserFavorites([]);
  setVenues([]);
  setLoaded(false);

  if (onLogout) {
    onLogout();
  } else {
    router.push('/');
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  if (!user) return null;

  const isVenue = !user.username;

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-b from-ozio-purple to-ozio-card pb-38">
        <div className="absolute top-15 right-0 p-4 flex justify-between items-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-red-500 backdrop-blur-sm text-white text-sm font-medium hover:bg-red-500/30 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Avatar y nombre */}
      <div className="px-4 -mt-16">
        <div className="flex flex-col items-center">
          <div className="relative">
            {user.avatar_path ? (
              <img
                src={user.avatar_path}
                alt={user.name}
                className="w-28 h-28 rounded-full border-4 border-ozio-dark object-cover bg-ozio-card"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-ozio-dark bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-dark hover:bg-ozio-purple transition">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <h2 className="text-white text-2xl font-bold mt-4">{user.name}</h2>
          <p className="text-gray-400 text-sm">{user.username ? `@${user.username}` : ''}</p>
          
          {user.description && (
            <p className="text-gray-300 text-center mt-3 max-w-sm">{user.description}</p>
          )}

          <div className="flex gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isVenue
                ? 'bg-ozio-orange/20 text-ozio-orange' 
                : 'bg-ozio-blue/20 text-ozio-blue'
            }`}>
              {isVenue ? '🏢 Establecimiento' : '👤 Usuario'}
            </span>
          </div>

          <button 
            onClick={() => setShowEditModal(true)}
            className="mt-4 px-6 py-2 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-full transition"
          >
            ✏️ Editar Perfil
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 bg-ozio-card rounded-2xl p-6 border border-gray-700/50">
          {isVenue ? (
            <>
              <div className="text-center">
                <div className="text-ozio-orange text-2xl font-bold">{user.events?.length || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Eventos</div>
              </div>
              <div className="text-center border-x border-gray-700">
                <div className="text-ozio-blue text-2xl font-bold">{user.checkIns || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Visitas</div>
              </div>
              <div className="text-center">
                <div className="text-ozio-purple text-2xl font-bold">{user.following || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Seguidores</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-ozio-orange text-2xl font-bold">{user.checkIns || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Check-ins</div>
              </div>
              <div className="text-center border-x border-gray-700">
                <div className="text-ozio-blue text-2xl font-bold">{user.favorites?.length || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Favoritos</div>
              </div>
              <div className="text-center">
                <div className="text-ozio-purple text-2xl font-bold">{user.following || 0}</div>
                <div className="text-gray-400 text-xs mt-1">Siguiendo</div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 bg-ozio-card rounded-2xl p-2 border border-gray-700/50">
          {isVenue ? (
            <>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-3 rounded-xl font-medium transition ${
                  activeTab === 'events'
                    ? 'bg-ozio-blue text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                🎉 Eventos
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 rounded-xl font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-ozio-blue text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                ⚙️ Config
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-3 rounded-xl font-medium transition ${
                  activeTab === 'favorites'
                    ? 'bg-ozio-blue text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                ❤️ Favoritos
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 rounded-xl font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-ozio-blue text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                ⚙️ Ajustes
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* EVENTOS PARA VENUES (Próximos y Pasados) */}
          {isVenue && activeTab === 'events' && (
            <div className="space-y-3">
              {user.events && user.events.length > 0 ? (
                <div className="space-y-3">
                  {user.events
                    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                    .map((event) => {
                      const isPast = new Date(event.ends_at) <= new Date();
                      return (
                        <div 
                          key={event.id} 
                          className={`bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden flex gap-4 p-4 hover:bg-gray-800/50 transition ${
                            isPast ? 'opacity-60' : ''
                          }`}
                        >
                          <img
                            src={event.image_path || 'https://via.placeholder.com/80'}
                            alt="Event"
                            className={`w-20 h-20 rounded-xl object-cover ${isPast ? 'grayscale' : ''}`}
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">{event.name || event.title}</h3>
                            <p className="text-gray-400 text-sm">
                              {new Date(event.starts_at).toLocaleDateString('es-ES')} {new Date(event.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.ends_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              👥 {event.event_attendees[0]?.count || 0} asistentes
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {isPast && (
                                <span className="bg-gray-700/50 text-gray-400 text-xs px-2 py-1 rounded-full">
                                  Finalizado
                                </span>
                              )}
                              {event.featured && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                  isPast 
                                    ? 'bg-gray-700/20 text-gray-500 border-gray-600/30'
                                    : 'bg-ozio-blue/20 text-ozio-blue border-ozio-blue/30'
                                }`}>
                                  Destacado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className={`transition ${
                                isPast 
                                  ? 'text-gray-500 hover:text-gray-400'
                                  : 'text-ozio-blue hover:text-ozio-purple'
                              }`}
                              onClick={() => setEditingEvent(event)}
                              title="Editar evento"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-600 transition"
                              onClick={() => handleDeleteEvent(event.id)}
                              title="Eliminar evento"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-6 text-center">
                  <p className="text-gray-400">No hay eventos</p>
                </div>
              )}
              <button 
                onClick={() => setShowEventModal(true)}
                className="w-full mt-4 px-6 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-2xl transition"
              >
                + Crear Evento
              </button>
            </div>
          )}

          {/* FAVORITOS PARA USUARIOS */}
          {!isVenue && activeTab === 'favorites' && (
            <div className="space-y-3">
              {user.favorites && user.favorites.length > 0 ? (
                <div className="space-y-3">
                  {user.favorites.map((fav) => (
                    <FavoriteSpotCard key={`${fav.user_id}${fav.venue_id}`} favorite={fav.venues} />
                  ))}
                </div>
              ) : (
                <div className="bg-ozio-card border border-gray-700/50 rounded-2xl p-6 text-center">
                  <p className="text-gray-400">No hay favoritos</p>
                </div>
              )}
            </div>
          )}

          {/* CONFIGURACIÓN (COMÚN PARA AMBOS) */}
          {activeTab === 'settings' && (
            <div className="space-y-3">
              <SettingsItem icon="🔔" title="Notificaciones" />
              <SettingsItem icon="🔒" title="Privacidad" />
              {isVenue && <SettingsItem icon="🏢" title="Información del local" />}
              <SettingsItem icon="ℹ️" title="Acerca de" />
              <SettingsItem icon="👤" title="Información de cuenta" />
              <SettingsItem icon="🚪" title="Cerrar sesión" onClick={handleLogout} />
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-ozio-card border border-gray-700/50 rounded-2xl p-4">
          <p className="text-gray-400 text-xs">
            Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Modales */}
      {showEventModal && (
        <CreateEventModal 
          venueId={user.id}
          onClose={() => setShowEventModal(false)}
          onEventCreated={fetchUserProfile}
        />
      )}
      
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={(updatedUser) => {
            setUser({ ...user, ...updatedUser });
            setShowEditModal(false);
          }}
        />
      )}
      
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={() => {
            setEditingEvent(null);
            fetchUserProfile();
          }}
          onEventDeleted={() => {
            setEditingEvent(null);
            fetchUserProfile();
          }}
        />
      )}
    </div>
  );
}

// Modal para crear eventos
function CreateEventModal({ 
  venueId, 
  onClose, 
  onEventCreated 
}: { 
  venueId: string; 
  onClose: () => void;
  onEventCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starts_at: null as Date | null,
    ends_at: null as Date | null,
    featured: false,
    image: null as File | null
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const data = new FormData();
      
      data.append('venue_id', venueId);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('starts_at', formData.starts_at?.toISOString() || '');
      data.append('ends_at', formData.ends_at?.toISOString() || '');
      data.append('featured', formData.featured.toString());
      
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data
      });

      if (!response.ok) {
        throw new Error('Error al crear evento');
      }

      onEventCreated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ozio-card border border-gray-700/50 rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-ozio-card border-b border-gray-700/50 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white text-xl font-bold">🎉 Crear Evento</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Imagen del evento</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="event-image"
              />
              <label
                htmlFor="event-image"
                className="block w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-ozio-blue transition overflow-hidden"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Click para subir imagen</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none"
              placeholder="Nombre del evento"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none resize-none"
              placeholder="Describe tu evento..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Inicio *</label>
              <DatePicker
                selected={formData.starts_at}
                onChange={(date: Date | null) => setFormData({ ...formData, starts_at: date })}
                showTimeSelect
                dateFormat="Pp"
                placeholderText="Seleccionar fecha"
                className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-ozio-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Fin *</label>
              <DatePicker
                selected={formData.ends_at}
                onChange={(date: Date | null) => setFormData({ ...formData, ends_at: date })}
                showTimeSelect
                dateFormat="Pp"
                placeholderText="Seleccionar fecha"
                className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-ozio-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-ozio-dark rounded-xl px-4 py-3 border border-gray-700">
            <span className="text-white font-medium">⭐ Evento destacado</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              className={`w-12 h-6 rounded-full transition relative ${
                formData.featured ? 'bg-ozio-blue' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                  formData.featured ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente auxiliar para lugares favoritos
function FavoriteSpotCard({favorite}: {favorite: any}) {
  return (
    <div className="bg-ozio-card border border-gray-700/50 rounded-2xl overflow-hidden flex gap-4 p-4 hover:bg-gray-800/50 transition">
      <img
        src={favorite?.avatar_path || "https://via.placeholder.com/80"}
        alt="Venue"
        className="w-20 h-20 rounded-xl object-cover"
      />
      <div className="flex-1">
        <h3 className="text-white font-semibold">{favorite?.name}</h3>
        <p className="text-gray-400 text-sm">{favorite?.address}</p>
        <button 
          className="mt-2 px-3 py-1 bg-ozio-blue hover:bg-ozio-purple text-white text-xs font-medium rounded-full transition"
          onClick={() => alert('Función de mapa no implementada')}
        >
          Ver en mapa
        </button>
      </div>
      <button className="text-red-400 hover:text-red-500 transition">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    </div>
  );
}

// Componente auxiliar para items de configuración
function SettingsItem({ icon, title, toggle, onClick }: { icon: string; title: string; toggle?: boolean; onClick?: () => void }) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div
      className="bg-ozio-card border border-gray-700/50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800/50 transition"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-white font-medium">{title}</span>
      </div>
      {toggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEnabled(!enabled);
          }}
          className={`w-12 h-6 rounded-full transition relative ${
            enabled ? 'bg-ozio-blue' : 'bg-gray-700'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
              enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      ) : (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}

// Modal para editar perfil
function EditProfileModal({
  user,
  onClose,
  onProfileUpdated,
}: {
  user: UserProfile;
  onClose: () => void;
  onProfileUpdated: (updated: Partial<UserProfile>) => void;
}) {
  const isVenue = !user.username;
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_path || null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    description: user.description || '',
    avatar: null as File | null,
  });

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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      if (!isVenue) data.append('username', formData.username);
      if (formData.avatar) {
        data.append('avatar', formData.avatar);
      } else if (user.avatar_path) {
        data.append('avatar_path', user.avatar_path);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) throw new Error('Error al actualizar perfil');

      const updated = await response.json();
      onProfileUpdated(updated);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el perfil');
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
              <label
                htmlFor="edit-avatar"
                className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-card cursor-pointer hover:bg-ozio-purple transition"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input id="edit-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <p className="text-gray-400 text-xs">Toca la cámara para cambiar tu foto</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              {isVenue ? 'Nombre del local *' : 'Nombre *'}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>

          {!isVenue && (
            <div>
              <label className="block text-white font-medium mb-2">Usuario</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none"
                  placeholder="tu_usuario"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-white font-medium mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={200}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none resize-none"
              placeholder={isVenue ? 'Describe tu establecimiento...' : 'Cuéntanos algo sobre ti...'}
            />
            <p className="text-gray-500 text-xs text-right mt-1">{formData.description.length}/200</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para editar eventos
function EditEventModal({
  event,
  onClose,
  onEventUpdated,
  onEventDeleted,
}: {
  event: any;
  onClose: () => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(event.image_path || null);
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
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
    if (!confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al eliminar evento');
      
      onEventDeleted();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const data = new FormData();

      data.append('venue_id', event.venue_id);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('starts_at', formData.starts_at?.toISOString() || '');
      data.append('ends_at', formData.ends_at?.toISOString() || '');
      data.append('featured', formData.featured.toString());

      if (formData.image) {
        data.append('image', formData.image);
      } else if (event.image_path) {
        data.append('image_path', event.image_path);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });

      if (!response.ok) throw new Error('Error al actualizar evento');
      onEventUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ozio-card border border-gray-700/50 rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-ozio-card border-b border-gray-700/50 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white text-xl font-bold">✏️ Editar Evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Imagen del evento</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-event-image" />
            <label htmlFor="edit-event-image" className="block w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-ozio-blue transition overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Click para cambiar imagen</span>
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Título *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none"
              placeholder="Nombre del evento" />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Descripción</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-ozio-blue focus:outline-none resize-none"
              placeholder="Describe tu evento..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Inicio *</label>
              <DatePicker
                selected={formData.starts_at}
                onChange={(date: Date | null) => setFormData({ ...formData, starts_at: date })}
                showTimeSelect
                dateFormat="Pp"
                minDate={new Date()}
                className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-ozio-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Fin *</label>
              <DatePicker
                selected={formData.ends_at}
                onChange={(date: Date | null) => setFormData({ ...formData, ends_at: date })}
                showTimeSelect
                dateFormat="Pp"
                minDate={new Date()}
                className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-ozio-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-ozio-dark rounded-xl px-4 py-3 border border-gray-700">
            <span className="text-white font-medium">⭐ Evento destacado</span>
            <button type="button" onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              className={`w-12 h-6 rounded-full transition relative ${formData.featured ? 'bg-ozio-blue' : 'bg-gray-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${formData.featured ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleDelete} disabled={loading}
              className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? '...' : '🗑️'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}