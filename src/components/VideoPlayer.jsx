// src/components/FileExplorer.jsx
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { firestoreDb } from '../lib/firebase';
import { Folder, Play, Clock } from 'lucide-react';

const USERNAME = import.meta.env.VITE_USER_NAME || 'User';
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

export default function FileExplorer({ onVideoSelect, onSystemMessage }) {
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const q = query(collection(firestoreDb, 'folders'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(firestoreDb, 'videos'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsubscribe();
  }, []);

  const handleVideoSelect = (video) => {
    const videoUrl = `${R2_PUBLIC_URL}/${video.filename}/master.m3u8`;
    setSelectedVideo(video.id);
    onVideoSelect?.(video.id, videoUrl);
    onSystemMessage?.(`${USERNAME} changed video to "${video.title}"`);
  };

  const displayVideos = selectedFolderId
    ? videos.filter(v => v.folderId === selectedFolderId)
    : videos.filter(v => !v.folderId);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6">

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Folder size={20} /> Folders
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${selectedFolderId === null ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              All Videos
            </button>
            {folders.map(folder => {
              const count = videos.filter(v => v.folderId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-2 ${selectedFolderId === folder.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <Folder size={16} /> {folder.name} <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Videos */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Play size={20} /> {selectedFolderId ? `${folders.find(f => f.id === selectedFolderId)?.name || 'Folder'} Videos` : 'All Videos'}
          <span className="text-gray-400 text-sm">({displayVideos.length})</span>
        </h3>
        {displayVideos.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-400">
            <Play size={48} className="mx-auto text-gray-600 mb-4" />
            <p>No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayVideos.map(video => (
              <VideoCard key={video.id} video={video} isSelected={selectedVideo === video.id} onSelect={() => handleVideoSelect(video)} formatDuration={formatDuration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, isSelected, onSelect, formatDuration }) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = video.thumbnailUrl || `${R2_PUBLIC_URL}/${video.filename}/thumbnail.jpg`;

  return (
    <div onClick={onSelect} className={`group cursor-pointer rounded-lg overflow-hidden bg-gray-800 transition-all hover:scale-105 hover:shadow-2xl ${isSelected ? 'ring-4 ring-red-600' : ''}`}>
      <div className="relative aspect-video bg-gray-900">
        {!imgError ? (
          <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Play size={48} className="text-gray-600" />
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
            <Clock size={12} /> {formatDuration(video.duration)}
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">NOW PLAYING</div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-white font-medium text-sm line-clamp-2 group-hover:text-red-400 transition">{video.title}</h4>
      </div>
    </div>
  );
}
