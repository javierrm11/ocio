"use client";

import { useState, useEffect } from "react";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import ProfileContent from "@/components/auth/ProfileWrapper";
import BottomNav from "@/components/Boton/BottomNav";
import Header from "@/components/layout/header";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificar autenticación SOLO en cliente
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    setTimeout(() => {
      setIsAuthenticated(!!token);
    }, 0);
  }, []);

  // Mostrar loading mientras verifica autenticación
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-ozio-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    );
  }

  // Si está autenticado, mostrar el perfil
  if (isAuthenticated) {
    return (
      <div className="m-0 bg-ozio-dark min-h-screen">
        {/* Encabezado */}
        <div className="w-full bg-gradient-to-b from-gray-900 to-transparent absolute top-0 left-0 z-[991]">
          <Header />
        </div>

        {/* Contenido del perfil */}
        <ProfileContent />

        <BottomNav />
      </div>
    );
  }

  // Si NO está autenticado, mostrar Login/Register
  return (
    <div className="m-0 bg-ozio-dark min-h-screen">
      {/* Encabezado */}
      <div className="w-full bg-gradient-to-b from-gray-900 to-transparent absolute top-0 left-0 z-[991]">
        <Header />
      </div>

      <main className="pt-16 px-4 flex flex-col justify-center min-h-screen pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OZIO</h1>
          <p className="text-gray-400">Descubre la vida nocturna</p>
        </div>

        {/* Navegación de pestañas */}
        <div className="flex justify-center items-center gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("login")}
            className={`pb-3 px-4 font-medium transition-colors relative flex-1 ${
              activeTab === "login"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Iniciar Sesión
            {activeTab === "login" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ozio-blue"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("register")}
            className={`pb-3 px-4 font-medium transition-colors relative flex-1 ${
              activeTab === "register"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Registro
            {activeTab === "register" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ozio-blue"></div>
            )}
          </button>
        </div>

        {/* Contenido condicional */}
        <div>
          {activeTab === "login" ? (
            <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            <Register onRegisterSuccess={() => setIsAuthenticated(true)} />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}