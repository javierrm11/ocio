'use client';

import { Bell, User, Gem } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/stores/venueStore';

function Header() {
  const router = useRouter();
  const { currentUser } = useAppStore();

  // venues tienen latitude, profiles no
  const isUserProfile = currentUser && !('latitude' in currentUser);
  const points: number = isUserProfile ? (currentUser as any).points ?? 0 : 0;

  return (
    <header className="w-full bg-ozio-darker text-ozio-text z-50">

      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5 p-2">
          <div className="w-8 h-8 rounded-lg bg-ozio-purple/10 border border-ozio-purple/40 flex items-center justify-center">
            <img src="/logo.png" alt="Ozio" className="w-5 h-5 rounded" />
          </div>
          <div className="leading-none">
            <h1 className="text-xl font-semibold tracking-wide text-ozio-text">OZIO</h1>
          </div>
        </Link>

        {/* Iconos */}
        <div role="toolbar" aria-label="Acciones" className="flex items-center gap-1">

          {/* Puntos — solo para usuarios */}
          {isUserProfile && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 h-9 rounded-[10px] hover:bg-white/[0.06] transition-all"
              onClick={() => router.push('/profile')}
              aria-label="Mis puntos"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M2 9l4-5h12l4 5-10 11L2 9z" fill="url(#hg)" />
                <path d="M2 9h20M8 4l4 5 4-5M12 14l-10-5M12 14l10-5" stroke="#b45309" strokeWidth="0.6" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="hg" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-col items-start leading-none">
                <span className="text-ozio-text text-sm font-black">{points}</span>
              </div>
            </button>
          )}

          {/* Notificaciones */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-ozio-text/50 hover:text-ozio-text hover:bg-white/[0.06] transition-all"
            onClick={() => router.push('/notificaciones')}
            aria-label="Notificaciones"
          >
            <Bell size={17} strokeWidth={1.8} />
          </button>

          <div className="w-px h-4 bg-ozio-purple/25" />

          {/* Avatar / Perfil */}
          <button
            type="button"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center hover:bg-white/[0.06] transition-all"
            onClick={() => router.push('/profile')}
            aria-label="Perfil"
          >
            {currentUser?.avatar_path ? (
              // Tiene foto de perfil
              <img
                src={currentUser.avatar_path}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover border border-ozio-purple/40"
              />
            ) : currentUser ? (
              // Sesión iniciada pero sin foto → inicial
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center border border-ozio-purple/40">
                <span className="text-ozio-text text-[11px] font-medium select-none">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              // Sin sesión → icono genérico
              <User size={17} strokeWidth={1.8} className="text-ozio-text/50" />
            )}
          </button>

        </div>
      </div>
    </header>
  );
}

export default Header;
