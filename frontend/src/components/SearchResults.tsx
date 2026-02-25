import type { SonicKnowledgeEntry } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Gamepad2, Star, Film, Music, Youtube, Swords, ExternalLink, Zap } from 'lucide-react';
import type { YouTubeChannelEntry } from '../data/youtubeChannels';

export type SearchEntry = SonicKnowledgeEntry | (YouTubeChannelEntry & { content_type: 'channel' });

interface SearchResultsProps {
  results: SearchEntry[];
  isLoading: boolean;
  query: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  character: <Star size={14} />,
  game: <Gamepad2 size={14} />,
  lore: <BookOpen size={14} />,
  media: <Film size={14} />,
  music: <Music size={14} />,
  video: <Youtube size={14} />,
  matchup: <Swords size={14} />,
  item: <Zap size={14} />,
  ability: <Zap size={14} />,
  channel: <Youtube size={14} />,
};

const typeColors: Record<string, string> = {
  character: 'bg-primary/10 text-primary',
  game: 'bg-secondary/20 text-secondary-foreground',
  lore: 'bg-accent/20 text-accent-foreground',
  media: 'bg-chart-4/20 text-foreground',
  music: 'bg-chart-5/20 text-foreground',
  video: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  matchup: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  item: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  ability: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  channel: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function isChannelEntry(entry: SearchEntry): entry is YouTubeChannelEntry & { content_type: 'channel' } {
  return entry.content_type === 'channel' && 'channelUrl' in entry;
}

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
          Try searching for "Knuckles", "Sonic", "Shadow", "youtube", or "Chaos Emerald"!
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
        {results.map((entry, i) => {
          const isChannel = isChannelEntry(entry);
          return (
            <div
              key={i}
              className={`sonic-card p-4 hover:shadow-sonic transition-shadow duration-200 group ${
                isChannel ? 'border-2 border-red-200 dark:border-red-900/40' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-fredoka text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                  {entry.name}
                </h3>
                <span
                  className={`flex items-center gap-1 text-xs font-nunito font-700 px-2 py-0.5 rounded-full shrink-0 ${
                    typeColors[entry.content_type] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {typeIcons[entry.content_type]}
                  {entry.content_type}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-nunito leading-relaxed mb-3">
                {entry.description}
              </p>
              {entry.highlights && (
                <div className="bg-secondary/10 rounded-xl p-2 mb-3">
                  <p className="text-xs font-nunito font-700 text-secondary-foreground">✨ {entry.highlights}</p>
                </div>
              )}
              {isChannel && (
                <a
                  href={(entry as YouTubeChannelEntry).channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-nunito font-700 text-red-600 dark:text-red-400 hover:underline"
                >
                  <ExternalLink size={12} />
                  Visit Channel
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
