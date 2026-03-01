"use client";
import { useState } from 'react';
import { Compass, Sparkles, Heart, User } from 'lucide-react';
import { redirect } from 'next/navigation';

function BottomNav() {
  const [active, setActive] = useState('Explore');

  const handleNav = (label: string, path?: string) => {
    setActive(label);
    if (path) redirect(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-990">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around">

        <NavItem
          icon={<Compass size={20} />}
          label="Mapa"
          active={active === 'Mapa'}
          onClick={() => handleNav('Mapa', '/mapa')}
        />

        <NavItem
          icon={<Sparkles size={20} />}
          label="Destacados"
          active={active === 'Destacados'}
          onClick={() => handleNav('Destacados', '/destacados')}
        />

        <NavItem
          icon={<Heart size={20} />}
          label="Notificaciones"
          active={active === 'Notificaciones'}
          onClick={() => handleNav('Notificaciones', '/notificaciones')}
        />

        <NavItem
          icon={<User size={20} />}
          label="Perfil"
          active={active === 'Perfil'}
          onClick={() => handleNav('Perfil', '/profile')}
        />

      </div>
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center gap-1 text-xs transition
        ${active ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-200'}
      `}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default BottomNav;
