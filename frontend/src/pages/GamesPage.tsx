import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Gamepad2, Play, Zap, ExternalLink, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GAMES = [
  {
    id: 'blockblast',
    title: 'Block Blast',
    description: 'Drop and blast colorful blocks in this Sonic-themed puzzle game! Clear rows to score big!',
    thumb: '/assets/generated/game-thumb-blockblast.dim_256x256.png',
    path: '/games/blockblast',
    badge: 'Puzzle',
    badgeColor: 'bg-primary/10 text-primary',
    ageRating: 'All Ages',
  },
  {
    id: 'sonicrunner',
    title: 'Sonic Runner',
    description: 'Run at supersonic speed, dodge obstacles, and collect rings in this endless runner!',
    thumb: '/assets/generated/game-thumb-sonicrunner.dim_256x256.png',
    path: '/games/sonicrunner',
    badge: 'Runner',
    badgeColor: 'bg-secondary/20 text-secondary-foreground',
    ageRating: 'All Ages',
  },
];

export default function GamesPage() {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sonic">
          <Gamepad2 size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-fredoka text-foreground">Scrambly Games</h1>
          <p className="text-muted-foreground font-nunito text-sm">Play offline, anytime!</p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <div key={game.id} className="sonic-card overflow-hidden group hover:shadow-sonic transition-all duration-200">
            <div className="relative">
              <img
                src={game.thumb}
                alt={game.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <span className={`text-xs font-nunito font-700 px-2 py-0.5 rounded-full ${game.badgeColor} bg-white/90`}>
                  {game.badge}
                </span>
                <span className="text-xs text-white font-nunito bg-black/40 px-2 py-0.5 rounded-full">
                  {game.ageRating}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-fredoka text-xl text-foreground mb-1">{game.title}</h3>
              <p className="text-sm text-muted-foreground font-nunito mb-4 leading-relaxed">
                {game.description}
              </p>
              <Link
                to={game.path}
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground
                           font-fredoka text-base py-2.5 rounded-full hover:opacity-90 active:scale-95
                           transition-all duration-150"
              >
                <Play size={16} />
                Play Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* More Games Bar */}
      <button
        onClick={() => window.open('https://kbhgames.com/?s=Mobile', '_blank', 'noopener,noreferrer')}
        className="w-full flex items-center justify-between gap-3 bg-primary text-primary-foreground
                   font-fredoka text-lg px-6 py-4 rounded-2xl hover:opacity-90 active:scale-[0.99]
                   transition-all duration-150 shadow-sonic group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Gamepad2 size={20} className="text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-fredoka text-lg leading-tight">More Games</p>
            <p className="font-nunito text-xs text-primary-foreground/80">Explore more Sonic-compatible games →</p>
          </div>
        </div>
        <ExternalLink size={20} className="text-primary-foreground/80 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Coming Soon Bar */}
      <button
        onClick={() => setShowComingSoonModal(true)}
        className="w-full flex items-center justify-between gap-3 bg-secondary/20 border-2 border-secondary/40
                   text-foreground font-fredoka text-lg px-6 py-4 rounded-2xl hover:bg-secondary/30
                   active:scale-[0.99] transition-all duration-150 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-secondary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-fredoka text-lg leading-tight text-foreground">Coming Soon</p>
            <p className="font-nunito text-xs text-muted-foreground">New features on the way!</p>
          </div>
        </div>
        <Zap size={20} className="text-secondary-foreground/60 group-hover:text-secondary-foreground transition-colors" />
      </button>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowComingSoonModal(false)}
        >
          <div
            className="sonic-card max-w-sm w-full p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                <Clock size={24} className="text-secondary-foreground" />
              </div>
              <h2 className="font-fredoka text-2xl text-foreground">Coming Soon!</h2>
            </div>
            <p className="font-nunito text-foreground leading-relaxed">
              Sorry, this area is being thought about. Please send in ideas!
            </p>
            <p className="font-nunito text-sm text-muted-foreground">
              Head over to <strong>Settings → Send Your Best Ideas</strong> to share your thoughts with us. 💡
            </p>
            <Button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full rounded-full font-fredoka"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
