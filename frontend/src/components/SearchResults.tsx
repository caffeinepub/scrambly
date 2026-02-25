import type { SonicKnowledgeEntry } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Gamepad2, Star, Film, Music } from 'lucide-react';

interface SearchResultsProps {
  results: SonicKnowledgeEntry[];
  isLoading: boolean;
  query: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  character: <Star size={14} />,
  game: <Gamepad2 size={14} />,
  lore: <BookOpen size={14} />,
  media: <Film size={14} />,
  music: <Music size={14} />,
};

const typeColors: Record<string, string> = {
  character: 'bg-primary/10 text-primary',
  game: 'bg-secondary/20 text-secondary-foreground',
  lore: 'bg-accent/20 text-accent-foreground',
  media: 'bg-chart-4/20 text-foreground',
  music: 'bg-chart-5/20 text-foreground',
};

export default function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sonic-card p-4 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!query) return null;

  if (results.length === 0) {
    return (
      <div className="text-center py-12 mt-6">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-xl font-fredoka text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground font-nunito">
          Try searching for "Sonic", "Tails", "Shadow", or "Chaos Emerald"!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground font-nunito mb-4">
        Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<strong>{query}</strong>"
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((entry, i) => (
          <div key={i} className="sonic-card p-4 hover:shadow-sonic transition-shadow duration-200 group">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-fredoka text-lg text-foreground group-hover:text-primary transition-colors">
                {entry.name}
              </h3>
              <span className={`flex items-center gap-1 text-xs font-nunito font-700 px-2 py-0.5 rounded-full ${typeColors[entry.content_type] || 'bg-muted text-muted-foreground'}`}>
                {typeIcons[entry.content_type]}
                {entry.content_type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-nunito leading-relaxed mb-3">
              {entry.description}
            </p>
            {entry.highlights && (
              <div className="bg-secondary/10 rounded-xl p-2">
                <p className="text-xs font-nunito font-700 text-secondary-foreground">✨ {entry.highlights}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
