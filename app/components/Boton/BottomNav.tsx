"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Compass, User, Search, Plus, Home, Heart } from "lucide-react";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";
import { isNative } from "@/lib/native/capacitor-bridge";

// 🔥 Simulación (cámbialo por tu auth real)
const useUser = () => {
  const { currentUser } = useAppStore();

  if (!currentUser) {
    return { role: "business" }; // fallback mientras carga
  }

  return { role: currentUser.role || "business" };
};

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isNative()) return;
    import("@capacitor/keyboard").then(({ Keyboard }) => {
      Promise.all([
        Keyboard.addListener("keyboardWillShow", (info) => {
          if (navRef.current) {
            navRef.current.style.transition = "transform 0.25s ease";
            navRef.current.style.transform = `translateY(${info.keyboardHeight}px)`;
          }
        }),
        Keyboard.addListener("keyboardWillHide", () => {
          if (navRef.current) {
            navRef.current.style.transition = "transform 0.25s ease";
            navRef.current.style.transform = "translateY(0)";
          }
        }),
      ]);
    });
  }, []);

  const isBusiness = role === "business";
  const isAuthenticated = Boolean(getToken());

  const navItems = [
    { icon: <Home size={25} />, label: "Home", path: "/mapa" },
    { icon: <Compass size={25} />, label: "Explorar", path: "/events" },

    // 🔁 BOTÓN DINÁMICO
    isBusiness
      ? {
          icon: <Plus size={30} />,
          label: "Añadir",
          path: "__add__",
          special: true,
          requiresAuth: true,
        }
      : {
          icon: <Heart size={30} />,
          label: "Guardados",
          path: "/profile?favorites",
          special: true,
        },

    { icon: <Search size={25} />, label: "Buscar", path: "/buscar" },
    { icon: <User size={25} />, label: "Perfil", path: "/profile" },
  ];

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 bg-ozio-darker border-t border-ozio-darker-800 z-50">
      <ul className="max-w-md mx-auto grid grid-cols-5 items-center relative py-2 list-none p-0 m-0">
        {navItems.map(({ icon, label, path, special, requiresAuth }) => (
          <li key={path} className="flex justify-center">
            <NavItem
              icon={icon}
              label={label}
              active={pathname === path}
              onClick={() => {
                if (requiresAuth && !isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                if (path === "__add__") {
                  router.push("/anadir");
                  return;
                }
                router.push(path);
              }}
              special={special}
            />
          </li>
        ))}
      </ul>



      {/* Modal: requiere auth */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-ozio-card p-6 text-center shadow-2xl">
            <h3 className="text-lg font-semibold text-ozio-text">
              Debes iniciar sesión
            </h3>
            <p className="mt-2 text-sm text-ozio-text-secondary">
              Para usar esta opción necesitas tener una cuenta.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 rounded-xl border border-ozio-card px-4 py-2 text-sm text-ozio-text-bright hover:bg-ozio-card"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  router.push("/profile");
                }}
                className="flex-1 rounded-xl bg-ozio-blue px-4 py-2 text-sm font-medium text-ozio-text hover:opacity-90"
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
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`
    flex flex-col items-center justify-center text-xs transition relative
    w-12 h-12
    ${
      special
        ? "bg-ozio-blue text-ozio-text rounded-full shadow-xl"
        : active
          ? "text-ozio-blue"
          : "text-ozio-text-muted hover:text-ozio-text-bright"
    }
  `}
    >
      {icon}
    </button>
  );
}

export default BottomNav;
