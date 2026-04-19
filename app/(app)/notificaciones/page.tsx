"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BottomNav from '@/components/Boton/BottomNav';
import { getToken } from '@/lib/hooks/getToken';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  action_url?: string;
  image_url?: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  check_in: '🎯',
  check_in_success: '✅',
  points_earned: '💎',
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

function getTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m}m`;
  if (h < 24) return `Hace ${h}h`;
  if (d < 7) return `Hace ${d}d`;
  return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const markAllRead = async () => {
      const token = getToken();
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/actions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    };

    const load = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setNotifications([]); return; }

        const data = await res.json();
        const all: Notification[] = data.notifications ?? [];
        setNotifications(all);

        if (all.some(n => !n.is_read)) markAllRead();
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleClick = (notification: Notification) => {
    if (notification.action_url) router.push(notification.action_url);
  };

  const unread = notifications.filter(n => !n.is_read);
  const read   = notifications.filter(n =>  n.is_read).slice(0, 5);
  const displayed = [...unread, ...read];

  if (loading) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">
      <div className="sticky top-0 z-10 bg-ozio-dark/95 backdrop-blur-sm border-b border-ozio-darker">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-ozio-card rounded-full transition"
            aria-label="Volver"
          >
            <svg className="w-6 h-6 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-ozio-text text-xl font-bold">Notificaciones</h1>
          {unread.length > 0 && (
            <span className="ml-auto bg-ozio-blue text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔕</div>
            <p className="text-ozio-text-muted text-lg">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unread.length > 0 && (
              <p className="text-ozio-text-muted text-xs font-semibold uppercase tracking-wider px-1 pb-1">Nuevas</p>
            )}
            {unread.map((n) => (
              <NotificationCard key={n.id} notification={n} onClick={handleClick} />
            ))}

            {read.length > 0 && (
              <p className="text-ozio-text-muted text-xs font-semibold uppercase tracking-wider px-1 pt-3 pb-1">Anteriores</p>
            )}
            {read.map((n) => (
              <NotificationCard key={n.id} notification={n} onClick={handleClick} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function NotificationCard({ notification, onClick }: { notification: Notification; onClick: (n: Notification) => void }) {
  const icon = NOTIFICATION_ICONS[notification.type] ?? '🔔';
  const isUnread = !notification.is_read;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative rounded-2xl overflow-hidden transition cursor-pointer ${
        isUnread
          ? 'bg-ozio-card border-l-4 border-ozio-blue'
          : 'bg-ozio-card/60 hover:bg-ozio-card/80'
      }`}
    >
      {notification.image_url && (
        <div className="absolute inset-0 opacity-10">
          <Image src={notification.image_url} width={56} height={56} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative p-4 flex gap-4">
        <div className="flex-shrink-0">
          {notification.image_url ? (
            <Image src={notification.image_url} alt="" width={56} height={56} className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center text-2xl">
              {icon}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-bold text-sm ${isUnread ? 'text-ozio-text' : 'text-ozio-text-muted'}`}>
              {notification.title}
            </h3>
            <span className="text-ozio-text-dim text-xs whitespace-nowrap">{getTimeAgo(notification.created_at)}</span>
          </div>
          <p className="text-ozio-text-secondary text-sm leading-relaxed mt-0.5">{notification.message}</p>

        </div>
      </div>
    </div>
  );
}
