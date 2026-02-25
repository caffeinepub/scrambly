import { Link } from '@tanstack/react-router';
import { Gamepad2, Play, Zap } from 'lucide-react';

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
                           transition-all duration-150 shadow-md"
              >
                <Play size={16} />
                Play Now
              </Link>
            </div>
          </div>
        ))}

        {/* Coming Soon Card */}
        <div className="sonic-card overflow-hidden opacity-60">
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <div className="text-center">
              <Zap size={40} className="text-muted-foreground mx-auto mb-2" />
              <p className="font-fredoka text-muted-foreground">More Games Coming!</p>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-fredoka text-xl text-muted-foreground mb-1">Coming Soon</h3>
            <p className="text-sm text-muted-foreground font-nunito">
              More Sonic-themed games are on the way. Stay tuned!
            </p>
          </div>
        </div>
      </div>

      {/* Offline Notice */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-3">
        <Zap size={20} className="text-secondary-foreground shrink-0" />
        <p className="text-sm font-nunito text-secondary-foreground">
          <strong>Offline Ready!</strong> All games work without an internet connection. Play anywhere, anytime!
        </p>
      </div>
    </div>
  );
}
