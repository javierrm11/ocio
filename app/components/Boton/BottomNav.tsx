"use client";
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, User, Search, CalendarDays } from 'lucide-react';

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Activo real según la ruta actual

  const navItems = [
    { icon: <Compass size={20} />,     label: 'Mapa',    path: '/mapa' },
    { icon: <CalendarDays size={20} />, label: 'Eventos', path: '/events' },
    { icon: <Search size={20} />,      label: 'Buscar',  path: '/buscar' },
    { icon: <User size={20} />,        label: 'Perfil',  path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-990">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around">
        {navItems.map(({ icon, label, path }) => (
          <NavItem
            key={label}
            icon={icon}
            label={label}
            active={pathname === path}
            onClick={() => router.push(path)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
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