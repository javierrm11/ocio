"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/hooks/getToken';
import { useAppStore, StoryGroup } from '@/lib/stores/venueStore';

export default function Stories() {
  const { storyGroups, setStoryGroups, currentUser: storeUser } = useAppStore();
  const [activeGroup, setActiveGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStories = () => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`)
      .then(res => res.json())
      .then((data: StoryGroup['stories']) => {
        if (!Array.isArray(data)) return;
        const groupMap = new Map<string, StoryGroup>();
        data.forEach(story => {
          if (!groupMap.has(story.venue_id)) {
            groupMap.set(story.venue_id, {
              venue_id: story.venue_id,
              venue_name: story.venues?.name ?? 'Local',
              venue_avatar: story.venues?.avatar_path,
              stories: [],
            });
          }
          groupMap.get(story.venue_id)!.stories.push(story);
        });
        setStoryGroups(Array.from(groupMap.values()));
      })
      .catch(err => console.error(err));
  };

  const router = useRouter();
  const canUploadStories = storeUser && !storeUser.username;

  // ── Navegación dentro del grupo activo ──────────────────────────────────
  const currentStory = activeGroup?.stories[currentStoryIndex] ?? null;

  const openGroup = (group: StoryGroup) => {
    setActiveGroup(group);
    setCurrentStoryIndex(0);
  };

  const closeViewer = () => {
    setActiveGroup(null);
    setCurrentStoryIndex(0);
  };

    const nextStory = () => {
    if (!activeGroup) return;

    if (currentStoryIndex < activeGroup.stories.length - 1) {
      // ✅ Siguiente story del mismo grupo
      setCurrentStoryIndex(i => i + 1);
    } else {
      // ✅ Buscar el siguiente grupo
      const currentGroupIndex = storyGroups.findIndex(g => g.venue_id === activeGroup.venue_id);
      const nextGroup = storyGroups[currentGroupIndex + 1];

      if (nextGroup) {
        // Saltar al siguiente grupo desde la primera story
        setActiveGroup(nextGroup);
        setCurrentStoryIndex(0);
      } else {
        // Era el último grupo → cerrar
        closeViewer();
      }
    }
  };

  const prevStory = () => {
    if (!activeGroup) return;

    if (currentStoryIndex > 0) {
      // ✅ Story anterior del mismo grupo
      setCurrentStoryIndex(i => i - 1);
    } else {
      // ✅ Buscar el grupo anterior
      const currentGroupIndex = storyGroups.findIndex(g => g.venue_id === activeGroup.venue_id);
      const prevGroup = storyGroups[currentGroupIndex - 1];

      if (prevGroup) {
        setActiveGroup(prevGroup);
        setCurrentStoryIndex(prevGroup.stories.length - 1); // última story del grupo anterior
      }
      // Si era el primero, no hacer nada
    }
  };

  // Auto-avance cada 15s
  useEffect(() => {
    if (!activeGroup) return;
    const timer = setTimeout(nextStory, 15000);
    return () => clearTimeout(timer);
  }, [activeGroup, currentStoryIndex]);

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadStory = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('media_type', selectedFile.type.startsWith('video/') ? 'video' : 'image');
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchStories();
      }
    } catch (e) {
      console.error(e);
      alert('Error al subir la historia');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* ── Stories Bar ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto" aria-label="Historias">
        <ul className="flex gap-4 p-4 overflow-x-auto list-none m-0">

          

          {/* ✅ Un bubble por empresa */}
          {storyGroups.map(group => (
            <li
              key={group.venue_id}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
              onClick={() => openGroup(group)}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-ozio-orange via-ambience-high to-ozio-purple p-0.5">
                <div className="w-full h-full rounded-full bg-ozio-dark p-0.5">
                  {group.venue_avatar ? (
                    <img
                      src={group.venue_avatar}
                      alt={group.venue_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    // Fallback: inicial del nombre
                    <div className="w-full h-full rounded-full bg-ozio-card flex items-center justify-center text-ozio-text font-bold text-xl">
                      {group.venue_name[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {/* ✅ Contador de stories del grupo */}
              <span className="text-xs text-ozio-text truncate max-w-[64px] text-center">
                {group.venue_name}
              </span>

            </li>
          ))}
        </ul>
      </section>

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Subir historia">
          <div className="bg-ozio-card border border-ozio-card/50 rounded-3xl max-w-lg w-full">
            <div className="border-b border-ozio-card/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-ozio-text text-xl font-bold">📸 Nueva Historia</h2>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); setPreviewUrl(null); }} className="text-ozio-text-muted hover:text-ozio-text transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {previewUrl ? (
                <div className="relative">
                  {selectedFile?.type.startsWith('video/') ? (
                    <video src={previewUrl} className="w-full h-96 object-cover rounded-2xl" controls />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-96 object-cover rounded-2xl" />
                  )}
                  <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
                    <svg className="w-5 h-5 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
                    <div className="bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-4 px-6 rounded-2xl cursor-pointer text-center transition flex items-center justify-center gap-3">
                      Seleccionar de galería
                    </div>
                  </label>
                  <label className="block">
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                    <div className="bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-4 px-6 rounded-2xl cursor-pointer text-center transition flex items-center justify-center gap-3">
                      Tomar foto
                    </div>
                  </label>
                </div>
              )}
              {previewUrl && (
                <button onClick={handleUploadStory} disabled={uploading} className="w-full mt-4 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-bold py-4 px-6 rounded-2xl transition disabled:opacity-50">
                  {uploading ? 'Subiendo...' : '✨ Publicar historia'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Story Viewer ─────────────────────────────────────────────────── */}
      {activeGroup && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={activeGroup.venue_name}>

          {/* ✅ Barra de progreso solo del grupo activo */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {activeGroup.stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-ozio-card rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  index < currentStoryIndex ? 'bg-white w-full' :
                  index === currentStoryIndex ? 'bg-white animate-progress' : 'w-0'
                }`} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-ozio-orange via-ambience-high to-ozio-purple p-0.5">
                {activeGroup.venue_avatar ? (
                  <img src={activeGroup.venue_avatar} alt={activeGroup.venue_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-ozio-card flex items-center justify-center text-ozio-text text-xs font-bold">
                    {activeGroup.venue_name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-ozio-text font-semibold text-sm">{activeGroup.venue_name}</span>
              {/* ✅ Índice de story dentro del grupo */}
              <span className="text-ozio-text-muted text-xs">
                {new Date(currentStory.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button onClick={closeViewer} className="text-ozio-text hover:text-ozio-text-secondary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido */}
          <div className="relative w-full h-full flex items-center justify-center">
            {currentStory.media_type === 'video' ? (
              <video
                key={currentStory.media_path}
                src={currentStory.media_path}
                className="max-w-full max-h-full object-contain"
                autoPlay
                onEnded={nextStory}
              />
            ) : (
              <img
                key={currentStory.media_path}
                src={currentStory.media_path}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Zonas táctiles */}
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
              <div className="w-1/3 h-full" />
              <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
        .animate-progress { animation: progress 15s linear forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </>
  );
}