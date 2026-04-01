"use client";
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, User, Search, Plus, Home, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/stores/venueStore';
import { getToken } from '@/lib/hooks/getToken';

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
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isBusiness = role === "business";
  const isAuthenticated = Boolean(getToken());

  const navItems = [
    { icon: <Home size={25} />, label: 'Home', path: '/' },
    { icon: <Compass size={25} />, label: 'Explorar', path: '/events' },

    // 🔁 BOTÓN DINÁMICO
    isBusiness
      ? { icon: <Plus size={30} />, label: 'Añadir', path: '/anadir', special: true, requiresAuth: true }
      : { icon: <Heart size={30} />, label: 'Guardados', path: '/profile?favorites', special: true },

    { icon: <Search size={25} />, label: 'Buscar', path: '/buscar' },
    { icon: <User size={25} />, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ozio-darker border-t border-ozio-darker-800 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around relative py-2">
        {navItems.map(({ icon, path, special, requiresAuth }) => (
          <NavItem
            key={path}
            icon={icon}
            active={pathname === path}
            onClick={() => {
              if (requiresAuth && !isAuthenticated) {
                setShowAuthModal(true);
                return;
              }

              router.push(path);
            }}
            special={special}
          />
        ))}
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-ozio-card p-6 text-center shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Debes iniciar sesión</h3>
            <p className="mt-2 text-sm text-zinc-300">
              Para usar esta opción necesitas tener una cuenta.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/profile');
                }}
                className="flex-1 rounded-xl bg-ozio-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}
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