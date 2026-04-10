"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";
import { ArrowLeft, Upload, X, ImageIcon, Video, Calendar, Star, Lock } from "lucide-react";
import { isPremium } from "@/lib/hooks/plan";

type Tipo = "historia" | "evento" | null;

interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

export default function AnadirPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get("tipo") as Tipo;
  const [tipo, setTipo] = useState<Tipo>(tipoParam);

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">
      <div className="sticky top-0 z-20 bg-ozio-darker border-b border-gray-800/50 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (tipo && tipoParam ? router.back() : tipo ? setTipo(null) : router.back())}
          className="text-gray-400 hover:text-white transition"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-base">
          {tipo === "historia" ? "Nueva historia" : tipo === "evento" ? "Nuevo evento" : "¿Qué quieres añadir?"}
        </h1>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {!tipo && <Selector onSelect={setTipo} />}
        {tipo === "historia" && <FormHistoria />}
        {tipo === "evento" && <FormEvento />}
      </div>
    </div>
  );
}

/* ─── Selector inicial ─── */
function Selector({ onSelect }: { onSelect: (t: Tipo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onSelect("historia")}
        className="flex flex-col items-center gap-4 bg-ozio-card border border-gray-700/50 hover:border-ozio-purple/60 hover:bg-ozio-purple/10 rounded-2xl p-8 transition group"
      >
        <span className="text-5xl">📸</span>
        <div className="text-center">
          <p className="text-white font-semibold group-hover:text-ozio-purple transition">Historia</p>
          <p className="text-gray-500 text-xs mt-1">Foto o vídeo del momento</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect("evento")}
        className="flex flex-col items-center gap-4 bg-ozio-card border border-gray-700/50 hover:border-ozio-blue/60 hover:bg-ozio-blue/10 rounded-2xl p-8 transition group"
      >
        <span className="text-5xl">🎉</span>
        <div className="text-center">
          <p className="text-white font-semibold group-hover:text-ozio-blue transition">Evento</p>
          <p className="text-gray-500 text-xs mt-1">Crea un evento en tu local</p>
        </div>
      </button>
    </div>
  );
}

/* ─── Formulario Historia ─── */
function FormHistoria() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const submit = async () => {
    if (!file) { setError("Selecciona un archivo"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("media", file);
      fd.append("media_type", file.type.startsWith("video/") ? "video" : "image");

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al publicar");
      router.push("/mapa");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`relative rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden min-h-[280px] ${
          file ? "border-ozio-purple/50" : "border-gray-700 hover:border-gray-500"
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          title="Seleccionar archivo de media"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {preview ? (
          <>
            {isVideo ? (
              <video src={preview} className="w-full h-full object-cover max-h-[400px]" controls />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover max-h-[400px]" />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition"
              aria-label="Eliminar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center min-h-[280px]">
            <div className="flex gap-3 text-gray-600">
              <ImageIcon className="w-8 h-8" />
              <Video className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-medium">Arrastra o pulsa para subir</p>
              <p className="text-gray-500 text-sm mt-1">JPG, PNG, GIF, WebP · MP4, WebM, MOV</p>
              <p className="text-gray-600 text-xs mt-0.5">Máx. 10 MB (imagen) · 50 MB (vídeo)</p>
            </div>
            <div className="mt-2 flex items-center gap-2 bg-ozio-purple/10 border border-ozio-purple/30 text-ozio-purple text-sm px-4 py-2 rounded-full">
              <Upload className="w-4 h-4" />
              Seleccionar archivo
            </div>
          </div>
        )}
      </div>

      <div className="bg-ozio-card border border-gray-700/50 rounded-xl p-4 text-sm text-gray-400">
        <p className="font-medium text-gray-300 mb-1">💡 Las historias duran 24 horas</p>
        <p>Se publicarán asociadas a tu local y desaparecerán automáticamente.</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || loading}
        className="w-full bg-ozio-purple hover:bg-ozio-purple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-sm"
      >
        {loading ? "Publicando..." : "Publicar historia"}
      </button>
    </div>
  );
}

/* ─── Formulario Evento ─── */
function FormEvento() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const userIsPremium = isPremium(currentUser || {});
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Géneros
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    featured: false,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Cargar catálogo de géneros
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/genres`)
      .then((r) => r.json())
      .then(setGenres)
      .catch(() => {});
  }, []);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleImage = (f: File) => {
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!currentUser?.id) { setError("No se encontró el local"); return; }
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    if (!form.starts_at) { setError("Indica la fecha de inicio"); return; }
    if (!form.ends_at) { setError("Indica la fecha de fin"); return; }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      setError("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("venue_id", currentUser.id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("starts_at", form.starts_at);
      fd.append("ends_at", form.ends_at);
      fd.append("featured", String(form.featured));
      fd.append("genre_ids", JSON.stringify(selectedGenres));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear el evento");
      router.push("/events");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-ozio-card border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue/50 focus:border-ozio-blue/50 transition text-sm";
  const labelClass = "text-gray-400 text-xs uppercase font-semibold tracking-wider mb-1.5 block";

  return (
    <div className="flex flex-col gap-5">

      {/* Título */}
      <div>
        <label className={labelClass}>Título *</label>
        <input
          type="text"
          placeholder="Nombre del evento"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={100}
          className={inputClass}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className={labelClass}>Descripción</label>
        <textarea
          placeholder="Describe el evento..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          maxLength={500}
          className={inputClass + " resize-none"}
        />
        <p className="text-right text-gray-600 text-xs mt-1">{form.description.length}/500</p>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            <Calendar className="w-3 h-3 inline mr-1" />
            Inicio *
          </label>
          <input
            type="datetime-local"
            title="Fecha y hora de inicio"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            <Calendar className="w-3 h-3 inline mr-1" />
            Fin *
          </label>
          <input
            type="datetime-local"
            title="Fecha y hora de fin"
            value={form.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Géneros musicales */}
      {genres.length > 0 && (
        <div>
          <label className={labelClass}>Géneros musicales</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const selected = selectedGenres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition border ${
                    selected
                      ? "bg-ozio-blue border-ozio-blue text-white scale-105"
                      : "bg-ozio-card border-gray-700/50 text-gray-400 hover:border-ozio-blue/50 hover:text-white"
                  }`}
                >
                  <span>{genre.emoji}</span>
                  <span>{genre.name}</span>
                </button>
              );
            })}
          </div>
          {selectedGenres.length > 0 && (
            <p className="text-xs text-ozio-blue mt-2">
              {selectedGenres.length} género{selectedGenres.length > 1 ? "s" : ""} seleccionado{selectedGenres.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Imagen */}
      <div>
        <label className={labelClass}>Imagen del evento</label>
        <div
          className="relative rounded-xl border border-dashed border-gray-700 hover:border-gray-500 transition cursor-pointer overflow-hidden min-h-[140px]"
          onClick={() => imageRef.current?.click()}
        >
          <input
            ref={imageRef}
            type="file"
            title="Seleccionar imagen del evento"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImage(e.target.files[0]); }}
          />
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-[200px]" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition"
                aria-label="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center min-h-[140px]">
              <ImageIcon className="w-7 h-7 text-gray-600" />
              <p className="text-gray-500 text-sm">Pulsa para añadir imagen</p>
              <p className="text-gray-600 text-xs">JPG, PNG, WebP · Máx. 10 MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Destacado */}
      {userIsPremium ? (
        <button
          type="button"
          onClick={() => set("featured", !form.featured)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-sm ${
            form.featured
              ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
              : "bg-ozio-card border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          <Star className={`w-4 h-4 flex-shrink-0 ${form.featured ? "fill-yellow-400" : ""}`} />
          <div className="text-left">
            <p className="font-medium">Evento destacado</p>
            <p className="text-xs opacity-70 mt-0.5">Aparecerá primero en el listado</p>
          </div>
          {form.featured && (
            <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Activo</span>
          )}
        </button>
      ) : (
        <>
          <div
            onClick={() => setShowPremiumModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-700/50 bg-ozio-card cursor-pointer transition"
          >
            <Star className="w-4 h-4 flex-shrink-0 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-500 text-sm">Evento destacado</p>
              <p className="text-xs text-gray-600 mt-0.5">Solo disponible en el plan Premium</p>
            </div>
            <Lock className="w-4 h-4 ml-auto text-gray-600" />
          </div>
          {showPremiumModal && <PremiumFeaturedModal onClose={() => setShowPremiumModal(false)} />}
        </>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full bg-ozio-blue hover:bg-ozio-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-sm"
      >
        {loading ? "Creando evento..." : "Crear evento"}
      </button>
    </div>
  );
}


/* ─── Modal premium destacado ─── */
function PremiumFeaturedModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f1220] rounded-t-3xl p-6 pb-10 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 24px rgba(251,191,36,0.4)" }}
          >
            <span className="text-3xl">⭐</span>
          </div>
          <h2 className="text-white text-xl font-black mb-2">Eventos destacados</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Con Premium tus eventos aparecen primero en el listado y consiguen más visibilidad.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {["🔝 Posición destacada en el listado", "👁️ Mayor visibilidad para tu evento", "🚀 Más asistentes potenciales", "👑 Badge exclusivo en el mapa"].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 text-base">{feat.slice(0, 2)}</span>
              <span className="text-gray-300">{feat.slice(3)}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#1a0a00]"
          style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", boxShadow: "0 0 16px rgba(251,191,36,0.3)" }}
          onClick={() => router.push("/premium")}
        >
          Actualizar a Premium 👑
        </button>
        <button type="button" onClick={onClose} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-300 transition">
          Ahora no
        </button>
      </div>
    </div>
  );
}
