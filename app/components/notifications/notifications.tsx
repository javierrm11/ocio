"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/hooks/getToken';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  action_url?: string;
  image_url?: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const url = filter === 'unread' 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications?unread_only=true`
        : `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = getToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = getToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      check_in: '🎯',
      new_follower: '👥',
      new_event: '🎉',
      event_reminder: '⏰',
      new_story: '📸',
      venue_featured: '⭐',
      event_featured: '✨',
      favorite_added: '❤️',
      event_starting: '🔔',
      event_cancelled: '❌',
      mention: '💬',
      system: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      <div className="bg-ozio-card border border-ozio-card/50 rounded-3xl max-w-2xl w-full max-h-[85dvh] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 bg-ozio-card border-b border-ozio-card/50 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 id="notifications-title" className="text-ozio-text text-xl font-bold">🔔 Notificaciones</h2>
              {unreadCount > 0 && (
                <span className="bg-ozio-blue text-ozio-text text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar notificaciones"
              className="text-ozio-text-muted hover:text-ozio-text transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filtros */}
          <div role="toolbar" aria-label="Filtrar notificaciones" className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition ${
                filter === 'all'
                  ? 'bg-ozio-blue text-ozio-text'
                  : 'bg-ozio-dark text-ozio-text-muted hover:text-ozio-text'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              aria-pressed={filter === 'unread' ? 'true' : 'false'}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition ${
                filter === 'unread'
                  ? 'bg-ozio-blue text-ozio-text'
                  : 'bg-ozio-dark text-ozio-text-muted hover:text-ozio-text'
              }`}
            >
              No leídas
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-4 py-2 bg-ozio-purple hover:bg-ozio-purple/80 text-ozio-text rounded-xl font-medium transition"
              >
                ✓ Marcar todas
              </button>
            )}
          </div>
        </header>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div role="status" aria-label="Cargando notificaciones" className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ozio-blue"></div>
            </div>
          ) : notifications?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔕</div>
              <p className="text-ozio-text-muted">
                {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <article
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-4 rounded-2xl cursor-pointer transition group ${
                      notification.is_read
                        ? 'bg-ozio-dark hover:bg-ozio-darker/50'
                        : 'bg-ozio-blue/10 border border-ozio-blue/30 hover:bg-ozio-blue/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icono/Imagen */}
                      <div className="flex-shrink-0">
                        {notification.image_url ? (
                          <img
                            src={notification.image_url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-ozio-text font-semibold text-sm">{notification.title}</h3>
                          <time className="text-ozio-text-subtle text-xs whitespace-nowrap" dateTime={notification.created_at}>
                            {getTimeAgo(notification.created_at)}
                          </time>
                        </div>
                        <p className="text-ozio-text-muted text-sm line-clamp-2">{notification.message}</p>

                        {/* Indicador de no leída */}
                        {!notification.is_read && (
                          <div className="absolute top-4 left-2 w-2 h-2 bg-ozio-blue rounded-full"></div>
                        )}
                      </div>

                      {/* Botón eliminar */}
                      <button
                        type="button"
                        aria-label="Eliminar notificación"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition text-ozio-text-subtle hover:text-ambience-high p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}