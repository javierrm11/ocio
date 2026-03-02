"use client";
import { useEffect, useState } from 'react';

interface Story {
  venue_id: string;
  media_type: string;
  media_path: string;
  created_at: string;
  expires_at: string;
  venues: {
    name: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  role: 'user' | 'venue';
}

function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStories();
    fetchCurrentUser();
  }, []);

  const fetchStories = () => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStories(data);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setUserLoading(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data[0]);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const canUploadStories = !userLoading && currentUser && !currentUser.username;

  const closeStory = () => {
    setSelectedStory(null);
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedStory(stories[currentIndex + 1]);
    } else {
      closeStory();
    }
  };

  useEffect(() => {
    if (selectedStory) {
      const timer = setTimeout(() => {
        nextStory();
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [selectedStory, currentIndex]);

  const openStory = (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentIndex(index);
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedStory(stories[currentIndex - 1]);
    }
  };

  const isExpired = (expiredAt: string) => {
    return new Date(expiredAt) < new Date();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('media_type', selectedFile.type.startsWith('video/') ? 'video' : 'image');

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchStories();
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Error al subir la historia');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-4 p-4 overflow-x-auto z-990 max-w-7xl mx-auto">
        {/* Botón para crear historia (solo venues) */}
        {canUploadStories && (
          <div
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer animate-fade-in"
            onClick={() => setShowUploadModal(true)}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <span className="text-xs text-white font-semibold">
              Tu historia
            </span>
          </div>
        )}

        {/* Stories List */}
        {stories.filter(story => !isExpired(story.expires_at)).map((story, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => openStory(story, index)}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-900 p-0.5">
                  <img
                    src={story.media_path}
                    alt={`Story ${story.venues.name}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="text-xs text-white truncate max-w-[64px]">
              {story.venues.name}
            </span>
          </div>
        ))}
      </div>

      {/* Modal para subir historia */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ozio-card border border-gray-700/50 rounded-3xl max-w-lg w-full">
            {/* Header */}
            <div className="border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">📸 Nueva Historia</h2>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {previewUrl ? (
                <div className="relative">
                  {selectedFile?.type.startsWith('video/') ? (
                    <video
                      src={previewUrl}
                      className="w-full h-96 object-cover rounded-2xl"
                      controls
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-96 object-cover rounded-2xl"
                    />
                  )}
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Botón para seleccionar de galería */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="gallery-upload"
                    />
                    <div className="bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-4 px-6 rounded-2xl cursor-pointer text-center transition flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Seleccionar de galería
                    </div>
                  </label>

                  {/* Botón para tomar foto */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="camera-upload"
                    />
                    <div className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-2xl cursor-pointer text-center transition flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Tomar foto
                    </div>
                  </label>
                </div>
              )}

              {/* Botón de publicar */}
              {previewUrl && (
                <button
                  onClick={handleUploadStory}
                  disabled={uploading}
                  className="w-full mt-4 bg-ozio-blue hover:bg-ozio-purple text-white font-bold py-4 px-6 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : '✨ Publicar historia'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full ${
                    index < currentIndex
                      ? 'bg-white w-full'
                      : index === currentIndex
                      ? 'bg-white w-full animate-progress'
                      : 'bg-transparent w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Story Header */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-0.5">
                <img
                  src={selectedStory.media_path}
                  alt={selectedStory.venue_id}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-white font-semibold text-sm">
                {selectedStory.venues.name}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(selectedStory.created_at).toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={closeStory}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedStory.media_type === 'video' ? (
              <video
                src={selectedStory.media_path}
                className="max-w-full max-h-full object-contain"
                autoPlay
                onEnded={nextStory}
              />
            ) : (
              <img
                src={selectedStory.media_path}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Navigation Areas */}
            <div className="absolute inset-0 flex">
              <div
                className="w-1/3 h-full cursor-pointer"
                onClick={prevStory}
              />
              <div className="w-1/3 h-full" />
              <div
                className="w-1/3 h-full cursor-pointer"
                onClick={nextStory}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .animate-progress {
          animation: progress 15s linear forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default Stories;