import React from "react";
import { Link } from "@tanstack/react-router";
import { Search, Video, Gamepad2, Users, Heart } from "lucide-react";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function HomePage() {
  const { data: profile } = useGetCallerUserProfile();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <img
            src="/assets/generated/scrambly-logo.dim_512x256.png"
            alt="Scrambly"
            className="h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Welcome{profile ? `, ${profile.name}` : ""}! 🦔
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Your ultimate Sonic the Hedgehog fan hub. Search, watch speedruns, play games, and connect with fans!
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/search"
            className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 group"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Search</h2>
              <p className="text-muted-foreground text-sm">Find Sonic characters, lore, and more</p>
            </div>
          </Link>

          <Link
            to="/videos"
            className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 group"
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <Video className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Speedrun Videos</h2>
              <p className="text-muted-foreground text-sm">Watch Sonic 1, 2, 3 & Mania speedruns</p>
            </div>
          </Link>

          <Link
            to="/games"
            className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 group"
          >
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Gamepad2 className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Games</h2>
              <p className="text-muted-foreground text-sm">Play Sonic-themed mini games</p>
            </div>
          </Link>

          <Link
            to="/community"
            className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 group"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Community</h2>
              <p className="text-muted-foreground text-sm">Share posts with Sonic fans</p>
            </div>
          </Link>

          <Link
            to="/friends"
            className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 group"
          >
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
              <Heart className="w-7 h-7 text-pink-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Friends Mode</h2>
              <p className="text-muted-foreground text-sm">Connect with other Sonic fans</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
