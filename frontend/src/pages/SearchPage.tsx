import { useState, useMemo, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import SearchResults, { type SearchEntry } from '../components/SearchResults';
import ExternalSearchButtons from '../components/ExternalSearchButtons';
import { useSearchSonicContent, useGetAllEntriesByType, useGetCallerUserProfile } from '../hooks/useQueries';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Zap, Star, Gamepad2, BookOpen, Youtube } from 'lucide-react';
import type { SonicKnowledgeEntry } from '../backend';
import { knucklesContent } from '../data/knucklesContent';
import { sonicCharacters } from '../data/sonicCharacters';
import { sonicItems } from '../data/sonicItems';
import { sonicAbilities, AMY_ABILITY_ALIASES } from '../data/sonicAbilities';
import { youtubeChannels, type YouTubeChannelEntry } from '../data/youtubeChannels';
import { ALL_VIDEOS } from './VideosPage';
import { isKidMode } from '../components/KidModeWrapper';
import { useSearchModerator } from '../hooks/useSearchModerator';
import SearchWarningNotice from '../components/SearchWarningNotice';
import SearchBanScreen from '../components/SearchBanScreen';

const SONIC_CATEGORIES = [
  { key: 'character', label: 'Characters', icon: <Star size={14} /> },
  { key: 'game', label: 'Games', icon: <Gamepad2 size={14} /> },
  { key: 'lore', label: 'Lore', icon: <BookOpen size={14} /> },
];

// All local knowledge entries merged
const ALL_LOCAL_ENTRIES: SonicKnowledgeEntry[] = [
  ...knucklesContent,
  ...sonicCharacters,
  ...sonicItems,
  ...sonicAbilities,
];

function CategoryBrowse({ contentType }: { contentType: string }) {
  const { data: entries, isLoading } = useGetAllEntriesByType(contentType);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sonic-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded-full w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded-full w-full mb-1" />
            <div className="h-3 bg-muted rounded-full w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground font-nunito">
        No {contentType} entries yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {entries.map((entry, i) => (
        <div key={i} className="sonic-card p-4 hover:shadow-sonic transition-shadow group">
          <h3 className="font-fredoka text-lg text-foreground group-hover:text-primary transition-colors mb-1">
            {entry.name}
          </h3>
          <p className="text-sm text-muted-foreground font-nunito leading-relaxed mb-2">
            {entry.description}
          </p>
          {entry.highlights && (
            <p className="text-xs font-nunito font-700 text-secondary-foreground bg-secondary/10 px-2 py-1 rounded-lg">
              ✨ {entry.highlights}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Convert a video entry into a SonicKnowledgeEntry-compatible result card */
function videoToEntry(video: { id: string; title: string; category: string }): SonicKnowledgeEntry {
  return {
    name: video.title,
    content_type: 'video',
    description: `${video.category} video — click to watch on the Videos page.`,
    highlights: `📺 Category: ${video.category}`,
  };
}

/** Check if a query matches Amy's hammer/ability aliases */
function matchesAmyAbility(query: string): boolean {
  const lower = query.trim().toLowerCase();
  return AMY_ABILITY_ALIASES.some((alias) => lower.includes(alias) || alias.includes(lower));
}

/** Check if a query matches a YouTube channel entry */
function matchesChannel(query: string, channel: YouTubeChannelEntry): boolean {
  const lower = query.trim().toLowerCase();
  return channel.aliases.some((alias) => lower.includes(alias) || alias.includes(lower));
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeWarning, setActiveWarning] = useState<{
    count: number;
    remaining: number;
    message: string;
  } | null>(null);

  const { data: profile } = useGetCallerUserProfile();
  const kidMode = isKidMode(profile);

  const { state: modState, checkQuery, markAppealUsed, isBanned, banType, isAppealAvailable } = useSearchModerator();

  // Backend search results
  const { data: backendResults = [], isLoading: backendLoading } = useSearchSonicContent(query);

  const handleSearch = useCallback(
    (newQuery: string) => {
      if (!newQuery.trim()) {
        setQuery('');
        setActiveWarning(null);
        return;
      }

      const result = checkQuery(newQuery);

      if (result.ban) {
        // Ban triggered — don't update query, just let the ban screen show
        setActiveWarning(null);
        return;
      }

      if (result.warning) {
        setActiveWarning(result.warning);
        // Don't execute the search for warned queries
        return;
      }

      // Allowed — clear any previous warning and run the search
      setActiveWarning(null);
      setQuery(newQuery);
    },
    [checkQuery]
  );

  // Compute combined results with local data
  const { results, isLoading } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return { results: backendResults as SearchEntry[], isLoading: backendLoading };
    }

    // Special case: "youtube" → return all video entries
    if (trimmed === 'youtube') {
      const videoEntries = ALL_VIDEOS
        .filter((v) => kidMode ? v.kidSafe : true)
        .map(videoToEntry);
      return { results: videoEntries as SearchEntry[], isLoading: false };
    }

    // Local knowledge base matches
    const localMatches: SonicKnowledgeEntry[] = ALL_LOCAL_ENTRIES.filter((entry) => {
      const haystack = `${entry.name} ${entry.description} ${entry.highlights}`.toLowerCase();
      return haystack.includes(trimmed);
    });

    // Amy ability alias matching (for alias-only queries that don't hit the haystack)
    const amyAbilityMatches: SonicKnowledgeEntry[] = matchesAmyAbility(query)
      ? sonicAbilities.filter((a) => !localMatches.some((m) => m.name === a.name))
      : [];

    // YouTube channel matches
    const channelMatches: (YouTubeChannelEntry & { content_type: 'channel' })[] = youtubeChannels
      .filter((ch) => matchesChannel(query, ch))
      .map((ch) => ({ ...ch, content_type: 'channel' as const }));

    // Video entries that match the query
    const videoMatches: SonicKnowledgeEntry[] = ALL_VIDEOS
      .filter((v) => kidMode ? v.kidSafe : true)
      .filter((v) => {
        const haystack = `${v.title} ${v.category}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .map(videoToEntry);

    // Deduplicate: prefer local matches, then backend, then video matches
    const seen = new Set<string>();
    const merged: SearchEntry[] = [];

    for (const entry of [
      ...localMatches,
      ...amyAbilityMatches,
      ...channelMatches,
      ...backendResults,
      ...videoMatches,
    ]) {
      const key = entry.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(entry as SearchEntry);
      }
    }

    return { results: merged, isLoading: backendLoading };
  }, [query, backendResults, backendLoading, kidMode]);

  // Show ban screen if user is banned
  if (isBanned && banType) {
    return (
      <SearchBanScreen
        banType={banType}
        message={
          banType === 'porn'
            ? 'You have been permanently banned due to searching for inappropriate content.'
            : 'Sorry, you searched too many inappropriate and unsafe things.'
        }
        appealUsed={modState.appealUsed}
        isAppealAvailable={isAppealAvailable}
        onAppealSubmitted={markAppealUsed}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-sonic">
        <img
          src="/assets/generated/hero-banner.dim_1200x400.png"
          alt="Scrambly - Sonic Universe Search"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 sonic-gradient opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={28} className="text-secondary animate-bounce-sonic" />
            <h1 className="text-4xl md:text-5xl font-fredoka">SCRAMBLY</h1>
            <Zap size={28} className="text-secondary animate-bounce-sonic" />
          </div>
          <p className="font-nunito text-white/90 text-sm md:text-base">
            Your Sonic Universe Search Engine
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Active Warning Notice */}
      {activeWarning && (
        <SearchWarningNotice
          count={activeWarning.count}
          remaining={activeWarning.remaining}
          message={activeWarning.message}
          onDismiss={() => setActiveWarning(null)}
        />
      )}

      {/* Search hint chips */}
      {!query && !activeWarning && (
        <div className="flex flex-wrap gap-2">
          {['Knuckles', 'Shadow', 'Sonic', 'Amy', 'Tails', 'youtube'].map((hint) => (
            <button
              key={hint}
              onClick={() => handleSearch(hint)}
              className="px-3 py-1 rounded-full text-xs font-nunito font-700 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary transition-colors"
            >
              {hint === 'youtube' ? (
                <span className="flex items-center gap-1">
                  <Youtube size={11} /> youtube
                </span>
              ) : (
                hint
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search Results or Browse */}
      {query ? (
        <>
          {/* YouTube special case banner */}
          {query.trim().toLowerCase() === 'youtube' && (
            <div className="sonic-card p-4 flex items-center gap-3 border-2 border-primary/30 bg-primary/5">
              <Youtube size={24} className="text-primary shrink-0" />
              <div>
                <p className="font-fredoka text-foreground text-base">All Sonic Universe Videos</p>
                <p className="text-xs font-nunito text-muted-foreground">
                  Showing all {ALL_VIDEOS.filter((v) => kidMode ? v.kidSafe : true).length} videos from the catalogue
                  {kidMode ? ' (kid-safe only)' : ''}.
                </p>
              </div>
            </div>
          )}
          <SearchResults results={results} isLoading={isLoading} query={query} />

          {/* External search fallback — Google & DuckDuckGo */}
          <ExternalSearchButtons query={query} />
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-fredoka text-foreground mb-4 flex items-center gap-2">
            <Star size={22} className="text-secondary" />
            Browse the Sonic Universe
          </h2>
          <Tabs defaultValue="character">
            <TabsList className="rounded-full bg-muted p-1">
              {SONIC_CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="rounded-full font-nunito font-700 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat.icon}
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SONIC_CATEGORIES.map((cat) => (
              <TabsContent key={cat.key} value={cat.key}>
                <CategoryBrowse contentType={cat.key} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
