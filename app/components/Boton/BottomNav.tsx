"use client";
import { useRouter, usePathname } from 'next/navigation';
import { Compass, User, Search, Plus, Home, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/stores/venueStore';

// 🔥 Simulación (cámbialo por tu auth real)
const useUser = () => {
  const { currentUser } = useAppStore();

  if (!currentUser) {
    return { role: 'business' }; // fallback mientras carga
  }

  return { role: currentUser.role || 'business' };
};

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useUser();

  const isBusiness = role === "business";

  const navItems = [
    { icon: <Home size={25} />, label: 'Home', path: '/' },
    { icon: <Compass size={25} />, label: 'Explorar', path: '/explorar' },

    // 🔁 BOTÓN DINÁMICO
    isBusiness
      ? { icon: <Plus size={30} />, label: 'Añadir', path: '/anadir', special: true }
      : { icon: <Heart size={30} />, label: 'Guardados', path: '/profile?favorites', special: true },

    { icon: <Search size={25} />, label: 'Buscar', path: '/buscar' },
    { icon: <User size={25} />, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ozio-darker border-t border-ozio-darker-800 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around relative py-2">
        {navItems.map(({ icon, path, special }) => (
          <NavItem
            key={path}
            icon={icon}
            active={pathname === path}
            onClick={() => router.push(path)}
            special={special}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  active,
  onClick,
  special,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  special?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center text-xs transition relative
        
        ${special
          ? 'bg-ozio-blue text-white p-3 rounded-full shadow-xl'
          : active
            ? 'text-blue-500'
            : 'text-zinc-400 hover:text-zinc-200'
        }
      `}
    >
      {icon}
    </button>
  );
}

export default BottomNav;