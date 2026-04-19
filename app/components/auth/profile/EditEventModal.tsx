"use client";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";
import DatePicker from "react-datepicker";
import { getToken } from "@/lib/hooks/getToken";
import GenreSelector from "./GenreSelector";

export default function EditEventModal({ event, onClose, onEventUpdated, onEventDeleted }: { event: any; onClose: () => void; onEventUpdated: () => void; onEventDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(event.image_path || null);

  const initialGenres: number[] = (event.genres ?? []).map((g: any) => g.genre_id ?? g.genre?.id).filter(Boolean);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(initialGenres);

  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    starts_at: event.starts_at ? new Date(event.starts_at) : null,
    ends_at: event.ends_at ? new Date(event.ends_at) : null,
    featured: event.featured || false,
    image: null as File | null,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar evento");
      onEventDeleted();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el evento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const data = new FormData();
      data.append("venue_id", event.venue_id);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("starts_at", formData.starts_at?.toISOString() || "");
      data.append("ends_at", formData.ends_at?.toISOString() || "");
      data.append("featured", formData.featured.toString());
      data.append("genre_ids", JSON.stringify(selectedGenres));
      if (formData.image) data.append("image", formData.image);
      else if (event.image_path) data.append("image_path", event.image_path);

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) throw new Error("Error al actualizar evento");
      onEventUpdated();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-ozio-card border border-ozio-card/60 rounded-3xl max-w-4xl w-full max-h-[80dvh] overflow-y-auto shadow-2xl">

        <div className="sticky top-0 z-10 bg-gradient-to-r from-ozio-purple/20 to-ozio-blue/10 border-b border-ozio-card/50 px-7 py-5 flex items-center justify-between rounded-t-3xl backdrop-blur-sm">
          <div>
            <h2 className="text-ozio-text text-2xl font-bold">Editar evento</h2>
            <p className="text-ozio-text-muted text-sm mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-ozio-card hover:bg-ozio-card/70 text-ozio-text-muted hover:text-ozio-text transition flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">

          <div>
            <label className="block text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">Imagen del evento</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-event-image" />
            <label htmlFor="edit-event-image" className="group relative block w-full h-56 border-2 border-dashed border-ozio-card rounded-2xl cursor-pointer hover:border-ozio-blue/60 transition overflow-hidden">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-ozio-text text-sm font-medium">Cambiar imagen</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-ozio-text-subtle gap-2">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm">Haz click para subir una imagen</span>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">Título *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-ozio-dark border border-ozio-card/80 rounded-xl px-4 py-3 text-ozio-text placeholder-gray-600 focus:border-ozio-blue focus:outline-none focus:ring-1 focus:ring-ozio-blue/30 transition"
                placeholder="Nombre del evento" />
            </div>
            <div>
              <label className="block text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">Descripción</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3} className="w-full bg-ozio-dark border border-ozio-card/80 rounded-xl px-4 py-3 text-ozio-text placeholder-gray-600 focus:border-ozio-blue focus:outline-none focus:ring-1 focus:ring-ozio-blue/30 transition resize-none"
                placeholder="Describe tu evento..." />
            </div>
          </div>

          <div>
            <label className="block text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-3">Fecha y hora</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ozio-dark border border-ozio-card/80 rounded-xl px-4 py-3">
                <p className="text-ozio-text-subtle text-xs mb-1">Inicio</p>
                <DatePicker selected={formData.starts_at} onChange={(date: Date | null) => setFormData({ ...formData, starts_at: date })}
                  showTimeSelect dateFormat="Pp" minDate={new Date()}
                  className="w-full bg-transparent text-ozio-text focus:outline-none text-sm" />
              </div>
              <div className="bg-ozio-dark border border-ozio-card/80 rounded-xl px-4 py-3">
                <p className="text-ozio-text-subtle text-xs mb-1">Fin</p>
                <DatePicker selected={formData.ends_at} onChange={(date: Date | null) => setFormData({ ...formData, ends_at: date })}
                  showTimeSelect dateFormat="Pp" minDate={new Date()}
                  className="w-full bg-transparent text-ozio-text focus:outline-none text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-ozio-text-secondary text-xs font-semibold uppercase tracking-wide mb-3">Géneros musicales</label>
            <GenreSelector selected={selectedGenres} onChange={setSelectedGenres} />
          </div>

          <div className="flex items-center justify-between bg-ozio-dark/80 rounded-xl px-5 py-4 border border-ozio-card/80">
            <div>
              <p className="text-ozio-text font-medium">Evento destacado</p>
              <p className="text-ozio-text-subtle text-xs mt-0.5">Aparece en la sección de destacados</p>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.featured ? "bg-ozio-blue" : "bg-ozio-card"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${formData.featured ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleDelete} disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-ambience-high/10 hover:bg-ambience-high/20 text-ambience-high hover:text-ambience-high/80 border border-ambience-high/20 font-semibold rounded-xl transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {loading ? "..." : "Eliminar"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text-secondary hover:text-ozio-text font-semibold rounded-xl border border-ozio-card/50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-ozio-blue to-ozio-purple hover:opacity-90 text-ozio-text font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ozio-blue/20">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
