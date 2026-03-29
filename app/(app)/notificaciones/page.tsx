"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setNotifications([]); // En caso de error, array vacío
        return;
      }

      const data = await response.json();
      console.log('Notificaciones recibidas:', data); // Debug
      setNotifications(data.notifications || []); // Asegurar que siempre sea un array
    } catch (error) {
      console.error('Error:', error);
      setNotifications([]); // En caso de error, array vacío
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
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
      a: '📢', // Para tu tipo de prueba
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ozio-dark pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-ozio-dark/95 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-full transition"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold">Notificaciones</h1>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="px-4 py-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔕</div>
            <p className="text-gray-400 text-lg">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`relative rounded-2xl overflow-hidden cursor-pointer transition ${
                  notification.is_read 
                    ? 'bg-ozio-card hover:bg-gray-800/70' 
                    : 'bg-ozio-card border-l-4 border-ozio-blue'
                }`}
              >
                {/* Imagen de fondo si existe */}
                {notification.image_url && (
                  <div className="absolute inset-0 opacity-10">
                    <img
                      src={notification.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="relative p-4 flex gap-4">
                  {/* Icono o imagen */}
                  <div className="flex-shrink-0">
                    {notification.image_url ? (
                      <img
                        src={notification.image_url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center text-3xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-bold text-base">
                        {notification.title}
                      </h3>
                      <span className="text-gray-500 text-sm whitespace-nowrap">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Badge de estado si no está leída */}
                    {!notification.is_read && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-ozio-blue text-xs font-medium">
                        <div className="w-2 h-2 bg-ozio-blue rounded-full"></div>
                        <span>Nueva</span>
                      </div>
                    )}

                    {/* Badge de leída */}
                    {notification.is_read && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-gray-500 text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                        <span>Leída</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}