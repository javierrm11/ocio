"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "ozio_engagement_modal_seen";

export default function WelcomeEngagementModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadySeen = sessionStorage.getItem(SESSION_KEY);
    if (alreadySeen) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    const timer = window.setTimeout(() => setOpen(true), 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-ozio-card bg-ozio-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-ozio-blue">
          Bienvenido a Ozio
        </p>
        <h2 id="welcome-modal-title" className="mt-2 text-2xl font-bold text-white">
          Descubre el mejor plan de esta noche en segundos
        </h2>
        <p className="mt-3 text-sm text-gray-300">
          Mira locales en tiempo real, encuentra ambiente al instante y no te pierdas los eventos más top cerca de ti.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-ozio-card px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-ozio-card"
          >
            Ver mapa
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/events");
            }}
            className="rounded-xl bg-ozio-blue px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Ver eventos
          </button>
        </div>
      </div>
    </div>
  );
}
