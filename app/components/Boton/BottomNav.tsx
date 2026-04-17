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
  const [showAddModal, setShowAddModal] = useState(false);

  const isBusiness = role === "business";
  const isAuthenticated = Boolean(getToken());

  const navItems = [
    { icon: <Home size={25} />, label: 'Home', path: '/mapa' },
    { icon: <Compass size={25} />, label: 'Explorar', path: '/events' },

    // 🔁 BOTÓN DINÁMICO
    isBusiness
      ? { icon: <Plus size={30} />, label: 'Añadir', path: '__add__', special: true, requiresAuth: true }
      : { icon: <Heart size={30} />, label: 'Guardados', path: '/profile?favorites', special: true },

    { icon: <Search size={25} />, label: 'Buscar', path: '/buscar' },
    { icon: <User size={25} />, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ozio-darker border-t border-ozio-darker-800 z-50">
      <ul className="max-w-md mx-auto flex items-center justify-around relative py-2 list-none p-0 m-0">
        {navItems.map(({ icon, label, path, special, requiresAuth }) => (
          <li key={path}>
            <NavItem
              icon={icon}
              label={label}
              active={pathname === path}
              onClick={() => {
                if (requiresAuth && !isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                if (path === '__add__') {
                  setShowAddModal(true);
                  return;
                }
                router.push(path);
              }}
              special={special}
            />
          </li>
        ))}
      </ul>

      {/* Modal: elegir qué añadir */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 pb-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-title"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-ozio-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between mb-4">
              <h3 id="add-modal-title" className="text-white font-semibold text-base">¿Qué quieres añadir?</h3>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <ul className="grid grid-cols-2 gap-3 list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    router.push('/anadir?tipo=historia');
                  }}
                  className="w-full flex flex-col items-center gap-3 bg-ozio-dark border border-ozio-card/50 hover:border-ozio-purple/60 hover:bg-ozio-purple/10 rounded-2xl p-5 transition group"
                >
                  <span className="text-4xl">📸</span>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm group-hover:text-ozio-purple transition">Historia</p>
                    <p className="text-gray-500 text-xs mt-0.5">Foto o vídeo del momento</p>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    router.push('/anadir?tipo=evento');
                  }}
                  className="w-full flex flex-col items-center gap-3 bg-ozio-dark border border-ozio-card/50 hover:border-ozio-blue/60 hover:bg-ozio-blue/10 rounded-2xl p-5 transition group"
                >
                  <span className="text-4xl">🎉</span>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm group-hover:text-ozio-blue transition">Evento</p>
                    <p className="text-gray-500 text-xs mt-0.5">Crea un evento en tu local</p>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal: requiere auth */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-ozio-card p-6 text-center shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Debes iniciar sesión</h3>
            <p className="mt-2 text-sm text-gray-300">
              Para usar esta opción necesitas tener una cuenta.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 rounded-xl border border-ozio-card px-4 py-2 text-sm text-gray-200 hover:bg-ozio-card"
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
  label,
  active,
  onClick,
  special,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  special?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center text-xs transition relative
        
        ${special
          ? 'bg-ozio-blue text-white p-3 rounded-full shadow-xl'
          : active
            ? 'text-ozio-blue'
            : 'text-gray-400 hover:text-gray-200'
        }
      `}
    >
      {icon}
    </button>
  );
}

export default BottomNav;