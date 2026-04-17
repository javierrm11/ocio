"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/stores/venueStore";
import { getToken } from "@/lib/hooks/getToken";
import { ArrowLeft, X, ImageIcon, Calendar, Star, Lock } from "lucide-react";
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

  if (tipo === "historia") {
    return (
      <FormHistoria onBack={() => (tipoParam ? router.back() : setTipo(null))} />
    );
  }

  return (
    <div className="min-h-screen bg-ozio-dark pb-24">
      <header className="sticky top-0 z-20 bg-ozio-darker border-b border-gray-800/50 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (tipo ? setTipo(null) : router.back())}
          className="text-gray-400 hover:text-white transition"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-base">
          {tipo === "evento" ? "Nuevo evento" : "¿Qué quieres añadir?"}
        </h1>
      </header>

      <section className="px-4 pt-6 max-w-lg mx-auto" aria-label={tipo === "evento" ? "Formulario de evento" : "Seleccionar tipo de contenido"}>
        {!tipo && <Selector onSelect={setTipo} />}
        {tipo === "evento" && <FormEvento />}
      </section>
    </div>
  );
}

/* ─── Selector inicial ─── */
function Selector({ onSelect }: { onSelect: (t: Tipo) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-4 list-none p-0 m-0">
      <li>
        <button
          type="button"
          onClick={() => onSelect("historia")}
          className="w-full flex flex-col items-center gap-4 bg-ozio-card border border-gray-700/50 hover:border-ozio-purple/60 hover:bg-ozio-purple/10 rounded-2xl p-8 transition group"
        >
          <span className="text-5xl">📸</span>
          <div className="text-center">
            <p className="text-white font-semibold group-hover:text-ozio-purple transition">Historia</p>
            <p className="text-gray-500 text-xs mt-1">Foto o vídeo del momento</p>
          </div>
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => onSelect("evento")}
          className="w-full flex flex-col items-center gap-4 bg-ozio-card border border-gray-700/50 hover:border-ozio-blue/60 hover:bg-ozio-blue/10 rounded-2xl p-8 transition group"
        >
          <span className="text-5xl">🎉</span>
          <div className="text-center">
            <p className="text-white font-semibold group-hover:text-ozio-blue transition">Evento</p>
            <p className="text-gray-500 text-xs mt-1">Crea un evento en tu local</p>
          </div>
        </button>
      </li>
    </ul>
  );
}

/* ─── Formulario Historia (estilo Instagram) ─── */
function FormHistoria({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  // Transform para imagen arrastrable/zoomable
  const [imgPos, setImgPos] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<number | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  /* ── Cámara ── */
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { /* sin cámara disponible */ }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      // Espejo para selfie, igual que el preview
      ctx?.translate(canvas.width, 0);
      ctx?.scale(-1, 1);
    }
    ctx?.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], "captura.jpg", { type: "image/jpeg" });
      setFile(f); setPreview(URL.createObjectURL(f)); setImgPos({ x: 0, y: 0, scale: 1 });
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  // Arrancar cámara al entrar, parar al salir
  useEffect(() => { startCamera(); return stopCamera; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Galería ── */
  const handleFile = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f));
    setImgPos({ x: 0, y: 0, scale: 1 }); setError(null);
    stopCamera();
  };

  /* ── Drag (mouse) ── */
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: imgPos.x, oy: imgPos.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setImgPos((p) => ({ ...p, x: dragRef.current!.ox + e.clientX - dragRef.current!.startX, y: dragRef.current!.oy + e.clientY - dragRef.current!.startY }));
  };
  const snapToBounds = () => {
    const el = canvasRef.current;
    dragRef.current = null;
    pinchRef.current = null;
    if (!el) return;
    const { width: cw, height: ch } = el.getBoundingClientRect();
    setImgPos((p) => {
      const maxX = Math.max(0, cw * (p.scale - 1) / 2);
      const maxY = Math.max(0, ch * (p.scale - 1) / 2);
      return { ...p, x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
    });
  };

  const onMouseUp = () => { snapToBounds(); };

  /* ── Zoom rueda ── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setImgPos((p) => ({ ...p, scale: Math.min(5, Math.max(0.5, p.scale - e.deltaY * 0.001)) }));
  };

  /* ── Touch drag + pinch ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: imgPos.x, oy: imgPos.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current) {
      setImgPos((p) => ({ ...p, x: dragRef.current!.ox + e.touches[0].clientX - dragRef.current!.startX, y: dragRef.current!.oy + e.touches[0].clientY - dragRef.current!.startY }));
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current;
      pinchRef.current = dist;
      setImgPos((p) => ({ ...p, scale: Math.min(5, Math.max(0.5, p.scale * ratio)) }));
    }
  };
  const onTouchEnd = () => { snapToBounds(); };

  /* ── Submit ── */
  const submit = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("media", file);
      fd.append("media_type", file.type.startsWith("video/") ? "video" : "image");
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al publicar");
      router.push("/mapa");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally { setLoading(false); }
  };

  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Nueva historia">
      {/* Input galería */}
      <input ref={galleryRef} type="file" title="Seleccionar de galería" accept="image/*,video/*" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

      {/* Contenedor 9:16 centrado */}
      <div className="relative flex flex-col w-full max-w-md h-full">

      {/* ── Canvas 9:16 ── */}
      <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-black">

        {/* Cámara en vivo (fondo, siempre montada) */}
        <video ref={videoRef} autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${preview ? "opacity-0 pointer-events-none" : "opacity-100"} ${facingMode === "user" ? "[transform:scaleX(-1)]" : ""}`}
        />

        {/* Preview imagen con drag/zoom */}
        {preview && !isVideo && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none bg-black"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Historia"
              draggable={false}
              style={{ transform: `translate(${imgPos.x}px,${imgPos.y}px) scale(${imgPos.scale})`, transformOrigin: "center", transition: dragRef.current ? "none" : "transform 0.1s" }}
              className="max-w-full max-h-full object-contain" />
          </div>
        )}

        {/* Preview vídeo */}
        {preview && isVideo && (
          <video src={preview} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Barra superior (siempre encima) */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10 pb-3 z-20">
          <button type="button" aria-label="Cerrar" onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <X className="w-7 h-7 text-white drop-shadow-lg" />
          </button>
          {!preview && (
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Flash" className="w-10 h-10 flex items-center justify-center opacity-80">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none" opacity={0.5}/>
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              </button>
              <button type="button" aria-label="Ajustes" className="w-10 h-10 flex items-center justify-center opacity-80">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
        </header>


        {/* Hint reposicionar imagen */}
        {preview && !isVideo && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs pointer-events-none">
            Arrastra o pellizca para reencuadrar
          </p>
        )}
      </div>

      {/* ── Controles inferiores ── */}
      {!preview ? (
        <div className="flex flex-col items-center gap-5 pb-10 pt-4 bg-black">
          <div className="flex items-center justify-center gap-10 w-full px-10">
            {/* Galería */}
            <button type="button" aria-label="Abrir galería" onClick={() => galleryRef.current?.click()}
              className="w-14 h-14 rounded-xl border-2 border-white/50 bg-gray-800 flex items-center justify-center active:scale-95 transition">
              <ImageIcon className="w-7 h-7 text-white/70" />
            </button>
            {/* Capturar */}
            <button type="button" aria-label="Tomar foto" onClick={capturePhoto}
              className="w-[72px] h-[72px] rounded-full border-[3px] border-white flex items-center justify-center active:scale-95 transition">
              <div className="w-[58px] h-[58px] rounded-full bg-white" />
            </button>
            {/* Girar */}
            <button type="button" aria-label="Girar cámara" onClick={flipCamera} className="w-14 h-14 flex items-center justify-center opacity-70">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Modo activo */}
          <p className="text-white text-xs font-bold tracking-widest uppercase">Historia</p>
        </div>
      ) : (
        /* ── Controles con preview ── */
        <div className="flex flex-col items-center gap-4 pb-10 pt-5 px-6 bg-black">
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 w-full">{error}</p>
          )}
          <div className="flex items-center justify-center gap-4 w-full">
            <button type="button" aria-label="Descartar" onClick={() => { setFile(null); setPreview(null); startCamera(); }}
              className="w-14 h-14 rounded-full border-2 border-white/50 bg-white/10 flex items-center justify-center active:scale-95 transition">
              <X className="w-6 h-6 text-white" />
            </button>
            <button type="button" aria-label="Publicar historia" onClick={submit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-full text-base disabled:opacity-60 active:scale-95 transition shadow-xl">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {loading ? "Publicando..." : "Tu historia →"}
            </button>
          </div>
        </div>
      )}
      </div>{/* fin contenedor 9:16 */}
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

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const [monthlyCount, setMonthlyCount] = useState<number | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Cargar catálogo de géneros
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/genres`)
      .then((r) => r.json())
      .then(setGenres)
      .catch(() => {});
  }, []);

  // Comprobar eventos del mes actual (solo cuentas gratuitas)
  useEffect(() => {
    if (userIsPremium || !currentUser?.id) return;
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events?venue_id=${currentUser.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((events: { created_at?: string }[]) => {
        if (!Array.isArray(events)) return;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const count = events.filter((e) => e.created_at && new Date(e.created_at) >= startOfMonth).length;
        setMonthlyCount(count);
        if (count >= 2) setShowLimitModal(true);
      })
      .catch(() => {});
  }, [userIsPremium, currentUser?.id]);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-ozio-card border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue/50 focus:border-ozio-blue/50 transition text-sm";
  const labelClass = "text-gray-400 text-xs uppercase font-semibold tracking-wider mb-1.5 block";

  const limitReached = !userIsPremium && monthlyCount !== null && monthlyCount >= 2;

  return (
    <div className="flex flex-col gap-5">
      {showLimitModal && <PremiumLimitModal onClose={() => setShowLimitModal(false)} />}

      {limitReached && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-amber-400 text-sm font-semibold">Límite mensual alcanzado</p>
            <p className="text-gray-400 text-xs mt-0.5">Has creado 2 eventos este mes. Actualiza a Premium para crear eventos ilimitados.</p>
          </div>
        </div>
      )}

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
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {genres.map((genre) => {
              const selected = selectedGenres.includes(genre.id);
              return (
                <li key={genre.id}>
                  <button
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
                </li>
              );
            })}
          </ul>
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
          <button
            type="button"
            onClick={() => setShowPremiumModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-700/50 bg-ozio-card cursor-pointer transition text-left"
          >
            <Star className="w-4 h-4 flex-shrink-0 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-500 text-sm">Evento destacado</p>
              <p className="text-xs text-gray-600 mt-0.5">Solo disponible en el plan Premium</p>
            </div>
            <Lock className="w-4 h-4 ml-auto text-gray-600" />
          </button>
          {showPremiumModal && <PremiumFeaturedModal onClose={() => setShowPremiumModal(false)} />}
        </>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="button"
        onClick={limitReached ? () => setShowLimitModal(true) : submit}
        disabled={loading}
        className="w-full bg-ozio-blue hover:bg-ozio-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-sm"
      >
        {loading ? "Creando evento..." : "Crear evento"}
      </button>
    </div>
  );
}



/* ─── Modal límite mensual ─── */
function PremiumLimitModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="limit-modal-title" onClick={onClose}>
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
            <span className="text-3xl">🎉</span>
          </div>
          <h2 id="limit-modal-title" className="text-white text-xl font-black mb-2">Límite de eventos alcanzado</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Con el plan gratuito puedes crear <span className="text-white font-semibold">2 eventos al mes</span>. Actualiza a Premium para crear eventos ilimitados.
          </p>
        </div>

        <ul className="space-y-3 mb-6 list-none p-0 m-0">
          {["🚀 Eventos ilimitados cada mes", "⭐ Eventos destacados en el listado", "📊 Estadísticas avanzadas de asistencia", "👑 Badge exclusivo en el mapa"].map((feat) => (
            <li key={feat} className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 text-base">{feat.slice(0, 2)}</span>
              <span className="text-gray-300">{feat.slice(3)}</span>
            </li>
          ))}
        </ul>

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

/* ─── Modal premium destacado ─── */
function PremiumFeaturedModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="featured-modal-title" onClick={onClose}>
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
          <h2 id="featured-modal-title" className="text-white text-xl font-black mb-2">Eventos destacados</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Con Premium tus eventos aparecen primero en el listado y consiguen más visibilidad.
          </p>
        </div>

        <ul className="space-y-3 mb-6 list-none p-0 m-0">
          {["🔝 Posición destacada en el listado", "👁️ Mayor visibilidad para tu evento", "🚀 Más asistentes potenciales", "👑 Badge exclusivo en el mapa"].map((feat) => (
            <li key={feat} className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 text-base">{feat.slice(0, 2)}</span>
              <span className="text-gray-300">{feat.slice(3)}</span>
            </li>
          ))}
        </ul>

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
