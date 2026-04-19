"use client";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "./types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-ozio-darker/60 last:border-0">
      <span className="text-ozio-text-muted text-sm">{label}</span>
      <span className="text-ozio-text text-sm font-medium">{value}</span>
    </div>
  );
}

export default function AccountInfoView({ user, onBack }: { user: UserProfile; onBack: () => void }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const memberSince = new Date(user.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-5 text-ozio-text-muted hover:text-ozio-text transition text-md font-medium"
      >
        <ChevronLeft size={20} />
        Información de la cuenta
      </button>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl px-4 divide-y-0">
        <InfoRow label="Nombre" value={user.name} />
        {user.username && <InfoRow label="Usuario" value={`@${user.username}`} />}
        <InfoRow label="Correo" value={email ?? "—"} />
        <InfoRow label="Contraseña" value="••••••••••" />
        <InfoRow label="Miembro desde" value={memberSince} />
        {user.plan && <InfoRow label="Plan" value={user.plan} />}
      </div>
    </div>
  );
}
