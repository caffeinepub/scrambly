import React, { useState } from 'react';
import { Play, Youtube } from 'lucide-react';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { isKidMode } from '../components/KidModeWrapper';
import { knucklesVideos } from '../data/knucklesVideos';

interface VideoEntry {
  id: string;
  title: string;
  category: string;
  kidSafe: boolean;
}

const SONIC_VIDEOS: VideoEntry[] = [
  // Kid-safe Sonic videos
  { id: 'Tz7D4MQfNuU', title: 'Sonic the Hedgehog - Official Movie Trailer', category: 'Movies', kidSafe: true },
  { id: 'nzBMSjBHMEY', title: 'Sonic 2 - Official Trailer', category: 'Movies', kidSafe: true },
  { id: 'Tz7D4MQfNuU', title: 'Sonic Frontiers - Launch Trailer', category: 'Games', kidSafe: true },
  { id: 'Tz7D4MQfNuU', title: 'Sonic Superstars - Reveal Trailer', category: 'Games', kidSafe: true },
  { id: 'nzBMSjBHMEY', title: 'Sonic Origins - Gameplay Trailer', category: 'Games', kidSafe: true },
  { id: 'Tz7D4MQfNuU', title: 'Sonic Colors Ultimate - Trailer', category: 'Games', kidSafe: true },
  { id: 'nzBMSjBHMEY', title: 'Sonic Prime - Season 1 Trailer', category: 'Shows', kidSafe: true },
  { id: 'Tz7D4MQfNuU', title: 'Sonic Boom - Cartoon Highlights', category: 'Shows', kidSafe: true },
  // Additional videos for older users
  { id: 'nzBMSjBHMEY', title: 'Sonic Generations - Full Playthrough', category: 'Gameplay', kidSafe: false },
  { id: 'Tz7D4MQfNuU', title: 'Sonic Adventure 2 - All Cutscenes', category: 'Gameplay', kidSafe: false },
  { id: 'nzBMSjBHMEY', title: 'Sonic Lore Explained - Full History', category: 'Lore', kidSafe: false },
  { id: 'Tz7D4MQfNuU', title: 'Shadow the Hedgehog - Story Deep Dive', category: 'Lore', kidSafe: false },
];

// All videos combined (Sonic + Knuckles)
export const ALL_VIDEOS: VideoEntry[] = [...SONIC_VIDEOS, ...knucklesVideos];

const CATEGORIES_KID = ['All', 'Movies', 'Games', 'Shows', 'Knuckles'];
const CATEGORIES_ALL = ['All', 'Movies', 'Games', 'Shows', 'Gameplay', 'Lore', 'Knuckles'];

interface VideoCardProps {
  video: VideoEntry;
  isPlaying: boolean;
  onPlay: () => void;
}

function VideoCard({ video, isPlaying, onPlay }: VideoCardProps) {
  return (
    <div className="sonic-card overflow-hidden group">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {isPlaying ? (
          <iframe
            className="absolute inset-0 w-full h-full rounded-t-2xl"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className="absolute inset-0 cursor-pointer bg-sonic-blue-dark rounded-t-2xl overflow-hidden"
            onClick={onPlay}
          >
            <img
              src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-sonic-yellow rounded-full p-4 shadow-sonic group-hover:scale-110 transition-transform duration-200">
                <Play size={28} className="text-sonic-blue fill-sonic-blue ml-1" />
              </div>
            </div>
            {/* Speed lines overlay */}
            <div className="absolute inset-0 speed-lines opacity-10 pointer-events-none" />
          </div>
        )}
      </div>
      <div className="p-3 bg-card">
        <span className={`text-xs font-nunito font-700 px-2 py-0.5 rounded-full ${
          video.category === 'Knuckles'
            ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
            : 'text-primary bg-primary/10'
        }`}>
          {video.category}
        </span>
        <h3 className="mt-1.5 text-sm font-fredoka text-foreground leading-snug line-clamp-2">
          {video.title}
        </h3>
        {!isPlaying && (
          <button
            onClick={onPlay}
            className="mt-2 w-full sonic-btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5"
          >
            <Play size={13} className="fill-current" /> Watch Now
          </button>
        )}
      </div>
    </div>
  );
}

export default function VideosPage() {
  const { data: profile } = useGetCallerUserProfile();
  const kidMode = isKidMode(profile);

  const allVideos = ALL_VIDEOS.filter((v) => kidMode ? v.kidSafe : true);
  const categories = kidMode ? CATEGORIES_KID : CATEGORIES_ALL;

  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? allVideos
    : allVideos.filter((v) => v.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sonic-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 speed-lines opacity-5 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="bg-primary/10 rounded-2xl p-3">
            <Youtube size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-fredoka text-foreground">
              Sonic Videos 🎬
            </h1>
            <p className="text-muted-foreground font-nunito text-sm mt-0.5">
              {kidMode
                ? '🌟 Kid-safe Sonic videos — movies, games, cartoons & Knuckles battles!'
                : 'Watch trailers, gameplay, lore, Knuckles battles & more from the Sonic universe!'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setPlayingId(null); }}
            className={`px-4 py-1.5 rounded-full font-nunito font-700 text-sm transition-colors duration-150 border-2
              ${activeCategory === cat
                ? cat === 'Knuckles'
                  ? 'bg-red-600 text-white border-red-600 shadow-sonic'
                  : 'bg-primary text-primary-foreground border-primary shadow-sonic'
                : cat === 'Knuckles'
                  ? 'bg-card text-red-600 border-red-300 hover:border-red-500 hover:text-red-700 dark:text-red-400 dark:border-red-800'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              }`}
          >
            {cat === 'Knuckles' ? '👊 Knuckles' : cat}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {filtered.length === 0 ? (
        <div className="sonic-card p-10 text-center">
          <p className="text-muted-foreground font-nunito text-lg">No videos in this category yet!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video, idx) => (
            <VideoCard
              key={`${video.id}-${video.title}-${idx}`}
              video={video}
              isPlaying={playingId === `${video.id}-${video.title}-${idx}`}
              onPlay={() => setPlayingId(`${video.id}-${video.title}-${idx}`)}
            />
          ))}
        </div>
      )}

      {/* Kid Mode Notice */}
      {kidMode && (
        <div className="sonic-card p-4 flex items-center gap-3 border-2 border-secondary">
          <span className="text-2xl">🛡️</span>
          <p className="text-sm font-nunito text-muted-foreground">
            <span className="font-700 text-foreground">Kid Mode is active.</span>{' '}
            Only pre-approved, age-appropriate Sonic videos are shown.
          </p>
        </div>
      )}
    </div>
  );
}
