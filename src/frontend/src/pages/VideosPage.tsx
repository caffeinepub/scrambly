import React, { useState } from "react";
import {
  SPEEDRUN_CATEGORIES,
  type SpeedrunCategory,
  speedrunVideos,
} from "../data/speedrunVideos";

export type VideoEntry = {
  id: string;
  title: string;
  category: string;
  kidFriendly: boolean;
};

// Export ALL_VIDEOS for use in SearchPage
export const ALL_VIDEOS: VideoEntry[] = speedrunVideos;

interface VideosPageProps {
  kidMode?: boolean;
  ageRestricted?: boolean;
}

const categoryColors: Record<SpeedrunCategory, string> = {
  "Sonic 1 Speedruns": "bg-blue-600 hover:bg-blue-700",
  "Sonic 2 Speedruns": "bg-purple-600 hover:bg-purple-700",
  "Sonic 3 Speedruns": "bg-green-600 hover:bg-green-700",
  "Sonic Mania Speedruns": "bg-yellow-600 hover:bg-yellow-700",
};

const categoryActiveColors: Record<SpeedrunCategory, string> = {
  "Sonic 1 Speedruns": "ring-4 ring-blue-300",
  "Sonic 2 Speedruns": "ring-4 ring-purple-300",
  "Sonic 3 Speedruns": "ring-4 ring-green-300",
  "Sonic Mania Speedruns": "ring-4 ring-yellow-300",
};

export default function VideosPage({ kidMode = false }: VideosPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    SpeedrunCategory | "All"
  >("All");

  const filteredVideos = speedrunVideos.filter((video) => {
    if (kidMode && !video.kidFriendly) return false;
    if (selectedCategory !== "All" && video.category !== selectedCategory)
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🎮 Sonic Speedrun Videos
          </h1>
          <p className="text-muted-foreground text-lg">
            Watch the fastest Sonic speedruns from Sonic 1, 2, 3 & Knuckles, and
            Sonic Mania!
          </p>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`px-5 py-2 rounded-full font-semibold text-white transition-all bg-gray-600 hover:bg-gray-700 ${
              selectedCategory === "All" ? "ring-4 ring-gray-300" : ""
            }`}
          >
            All Videos
          </button>
          {SPEEDRUN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-semibold text-white transition-all ${categoryColors[cat]} ${
                selectedCategory === cat ? categoryActiveColors[cat] : ""
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Count */}
        <p className="text-center text-muted-foreground mb-6">
          Showing {filteredVideos.length} video
          {filteredVideos.length !== 1 ? "s" : ""}
          {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
        </p>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-xl">
              No videos found for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={`${video.id}-${video.title}`}
                className="bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                {/* YouTube Embed */}
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm leading-tight mb-2">
                    {video.title}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                      categoryColors[video.category as SpeedrunCategory] ||
                      "bg-gray-500"
                    }`}
                  >
                    {video.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
