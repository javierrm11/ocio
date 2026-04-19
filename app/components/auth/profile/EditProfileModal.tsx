"use client";
import { useState } from "react";
import { getToken } from "@/lib/hooks/getToken";
import { UserProfile, DEFAULT_SCHEDULE, ScheduleDay } from "./types";
import ScheduleEditor from "./ScheduleEditor";

export default function EditProfileModal({ user, onClose, onProfileUpdated }: { user: UserProfile; onClose: () => void; onProfileUpdated: (updated: Partial<UserProfile>) => void }) {
  const isVenue = !user.username;
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_path || null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>((user as any).schedule ?? DEFAULT_SCHEDULE);
  const [formData, setFormData] = useState({ name: user.name || "", username: user.username || "", description: user.description || "", avatar: null as File | null });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      if (!isVenue) data.append("username", formData.username);
      if (isVenue) data.append("schedule", JSON.stringify(schedule));
      if (formData.avatar) data.append("avatar", formData.avatar);
      else if (user.avatar_path) data.append("avatar_path", user.avatar_path);

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) throw new Error("Error al actualizar perfil");
      const updated = await response.json();
      onProfileUpdated(updated);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="bg-ozio-card border border-ozio-card/50 rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-ozio-card border-b border-ozio-card/50 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 id="edit-profile-title" className="text-ozio-text text-xl font-bold">✏️ Editar Perfil</h2>
          <button onClick={onClose} className="text-ozio-text-muted hover:text-ozio-text transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-ozio-blue" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-ozio-blue bg-gradient-to-br from-ozio-blue to-ozio-purple flex items-center justify-center">
                  <span className="text-ozio-text text-3xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <label htmlFor="edit-avatar" className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-card cursor-pointer hover:bg-ozio-purple transition">
                <svg className="w-4 h-4 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </label>
              <input id="edit-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <p className="text-ozio-text-muted text-xs">Toca la cámara para cambiar tu foto</p>
          </div>
          <div>
            <label className="block text-ozio-text font-medium mb-2">{isVenue ? "Nombre del local *" : "Nombre *"}</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:border-ozio-blue focus:outline-none" placeholder="Tu nombre" />
          </div>
          {!isVenue && (
            <div>
              <label className="block text-ozio-text font-medium mb-2">Usuario</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ozio-text-muted">@</span>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl pl-8 pr-4 py-3 text-ozio-text placeholder-gray-500 focus:border-ozio-blue focus:outline-none" placeholder="tu_usuario" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-ozio-text font-medium mb-2">Descripción</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} maxLength={200}
              className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:border-ozio-blue focus:outline-none resize-none"
              placeholder={isVenue ? "Describe tu establecimiento..." : "Cuéntanos algo sobre ti..."} />
            <p className="text-ozio-text-subtle text-xs text-right mt-1">{formData.description.length}/200</p>
          </div>
          {isVenue && (
            <div>
              <label className="block text-ozio-text font-medium mb-2">Horarios</label>
              <ScheduleEditor schedule={schedule} onChange={setSchedule} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
