'use client';

import { Bell, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/stores/venueStore';

function Header() {
  const router = useRouter();
  const { currentUser } = useAppStore();

  return (
    <header className="w-full bg-ozio-darker text-white z-50">

      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ozio-purple/10 border border-ozio-purple/40 flex items-center justify-center">
            <img src="/logo.jpeg" alt="Ozio" className="w-5 h-5 rounded" />
          </div>
          <div className="leading-none">
            <h1 className="text-xl font-semibold tracking-wide text-white">OZIO</h1>
          </div>
        </div>

        {/* Iconos */}
        <div className="flex items-center gap-1">

          {/* Notificaciones */}
          <button
            className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
            onClick={() => router.push('/notificaciones')}
            aria-label="Notificaciones"
          >
            <Bell size={17} strokeWidth={1.8} />
          </button>

          <div className="w-px h-4 bg-ozio-purple/25" />

          {/* Avatar / Perfil */}
          <button
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
                <span className="text-white text-[11px] font-medium select-none">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              // Sin sesión → icono genérico
              <User size={17} strokeWidth={1.8} className="text-white/50" />
            )}
          </button>

        </div>
      </div>
    </header>
  );
}

export default Header;