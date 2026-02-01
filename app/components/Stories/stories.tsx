import { useEffect, useState } from 'react';

interface Story {
  venue_id: string;
  media_type: string;
  media_path: string;
  created_at: string;
  expired_at: string;
  venues: {
    name: string;
  };
}

function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3000/api/stories')
      .then(res => res.json())
      .then(data => {
        console.log('Stories fetched:', data);
        if (Array.isArray(data)) {
          setStories(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const openStory = (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentIndex(index);
  };

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

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedStory(stories[currentIndex - 1]);
    }
  };

  const isExpired = (expiredAt: string) => {
    return new Date(expiredAt) < new Date();
  };

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-4 p-4 overflow-x-auto">
        {/* Stories List */}
        {stories.filter(story => !isExpired(story.expired_at)).map((story, index) => (
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
                    alt={`Story ${story.venue_id}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="text-xs text-white truncate max-w-[64px]">
              {story.venue_id}
            </span>
          </div>
        ))}
      </div>

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
                {selectedStory.venue_id}
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

          {/* Story Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="flex items-center gap-2 bg-gray-800 bg-opacity-50 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Enviar mensaje"
                className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
              />
              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
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
          animation: progress 5s linear forwards;
        }
      `}</style>
    </>
  );
}

export default Stories;