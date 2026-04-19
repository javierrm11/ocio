"use client";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleItem() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("ozio-theme", next ? "light" : "dark");
  };

  return (
    <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{isLight ? <Sun size={22} className="text-ozio-orange" /> : <Moon size={22} className="text-ozio-blue" />}</span>
        <span className="text-ozio-text font-medium">{isLight ? "Modo claro" : "Modo oscuro"}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${isLight ? "bg-ozio-orange" : "bg-ozio-blue"}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${isLight ? "translate-x-6" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
