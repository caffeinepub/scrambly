import React, { useState, useRef, useEffect } from "react";
import { Search, Clock, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchResults from "../components/SearchResults";
import SearchWarningNotice from "../components/SearchWarningNotice";
import SearchBanScreen from "../components/SearchBanScreen";
import ExternalSearchButtons from "../components/ExternalSearchButtons";
import { useSearchModerator } from "../hooks/useSearchModerator";
import { sonicVsMetalSonicVideos } from "../data/sonicVsMetalSonicVideos";
import { sonicExeVsMetalSonicVideos } from "../data/sonicExeVsMetalSonicVideos";
import { useSearchSonicContent, useGetCallerUserProfile } from "../hooks/useQueries";
import { knucklesContent } from "../data/knucklesContent";
import { sonicCharacters } from "../data/sonicCharacters";
import { sonicItems } from "../data/sonicItems";
import { sonicAbilities, AMY_ABILITY_ALIASES } from "../data/sonicAbilities";
import { youtubeChannels, type YouTubeChannelEntry } from "../data/youtubeChannels";
import { ALL_VIDEOS } from "./VideosPage";
import type { SonicKnowledgeEntry } from "../backend";
import type { SearchEntry } from "../components/SearchResults";
import type { VideoEntry } from "../data/speedrunVideos";

const SEARCH_TIME_LIMIT_KEY = "scrambly_parental_settings";

function getSearchTimeLimitMinutes(): number {
  try {
    const stored = localStorage.getItem(SEARCH_TIME_LIMIT_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.searchTimeLimitMinutes || 60;
    }
  } catch {}
  return 60;
}

// All local knowledge entries merged
const ALL_LOCAL_ENTRIES: SonicKnowledgeEntry[] = [
  ...knucklesContent,
  ...sonicCharacters,
  ...sonicItems,
  ...sonicAbilities,
];

function videoToEntry(video: { id: string; title: string; category: string }): SonicKnowledgeEntry {
  return {
    name: video.title,
    content_type: "video",
    description: `${video.category} video — click to watch on the Videos page.`,
    highlights: `📺 Category: ${video.category}`,
  };
}

function matchesAmyAbility(query: string): boolean {
  const lower = query.trim().toLowerCase();
  return AMY_ABILITY_ALIASES.some((alias) => lower.includes(alias) || alias.includes(lower));
}

function matchesChannel(query: string, channel: YouTubeChannelEntry): boolean {
  const lower = query.trim().toLowerCase();
  return channel.aliases.some((alias) => lower.includes(alias) || alias.includes(lower));
}

interface ReplacementVideoResultsProps {
  videos: VideoEntry[];
  title: string;
}

function ReplacementVideoResults({ videos, title }: ReplacementVideoResultsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={`${video.id}-${video.title}`}
            className="bg-card rounded-xl overflow-hidden shadow border border-border"
          >
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground">{video.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [lastWarningCount, setLastWarningCount] = useState(0);
  const [searchLocked, setSearchLocked] = useState(false);
  const [searchTimeUsed, setSearchTimeUsed] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { warningCount, isBanned, isAppealAvailable, appealUsed, validateSearch, processAppeal, maxWarnings } =
    useSearchModerator();

  const { data: backendResults = [], isLoading: backendLoading } = useSearchSonicContent(submittedQuery);

  // Search time limit tracking
  useEffect(() => {
    const limitMinutes = getSearchTimeLimitMinutes();
    const limitSeconds = limitMinutes * 60;

    if (submittedQuery && !searchLocked) {
      searchTimerRef.current = setInterval(() => {
        setSearchTimeUsed((prev) => {
          const next = prev + 1;
          if (next >= limitSeconds) {
            setSearchLocked(true);
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [submittedQuery, searchLocked]);

  if (isBanned) {
    return (
      <SearchBanScreen
        banType="anime"
        message="You have been banned for searching inappropriate content."
        isAppealAvailable={isAppealAvailable}
        appealUsed={appealUsed}
        onAppealSubmitted={() => {
          processAppeal();
        }}
      />
    );
  }

  if (searchLocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center border border-border shadow-xl">
          <Lock className="w-14 h-14 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Search Time Limit Reached</h1>
          <p className="text-muted-foreground mb-4">
            You've reached your search time limit set by your parent. Please check with your parent to continue
            searching.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>
              Time used: {Math.floor(searchTimeUsed / 60)} min {searchTimeUsed % 60} sec
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const result = validateSearch(query);

    if (!result.allowed && !result.shouldReplaceResults) {
      setLastWarningCount(result.warningCount);
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    setSubmittedQuery(query);
  };

  // Check for sonic.exe vs metal sonic query
  const isSonicExeQuery = submittedQuery.toLowerCase().trim() === "sonic.exe vs metal sonic";

  // Check if results should be replaced (admin inappropriate search)
  const shouldReplaceResults = submittedQuery
    ? validateSearch(submittedQuery).shouldReplaceResults
    : false;

  // Compute combined local + backend results
  const trimmed = submittedQuery.trim().toLowerCase();
  const localMatches: SonicKnowledgeEntry[] = trimmed
    ? ALL_LOCAL_ENTRIES.filter((entry) => {
        const haystack = `${entry.name} ${entry.description} ${entry.highlights}`.toLowerCase();
        return haystack.includes(trimmed);
      })
    : [];

  const amyAbilityMatches: SonicKnowledgeEntry[] = trimmed && matchesAmyAbility(submittedQuery)
    ? sonicAbilities.filter((a) => !localMatches.some((m) => m.name === a.name))
    : [];

  const channelMatches: (YouTubeChannelEntry & { content_type: "channel" })[] = trimmed
    ? youtubeChannels
        .filter((ch) => matchesChannel(submittedQuery, ch))
        .map((ch) => ({ ...ch, content_type: "channel" as const }))
    : [];

  const videoMatches: SonicKnowledgeEntry[] = trimmed
    ? ALL_VIDEOS.filter((v) => {
        const haystack = `${v.title} ${v.category}`.toLowerCase();
        return haystack.includes(trimmed);
      }).map(videoToEntry)
    : [];

  const seen = new Set<string>();
  const mergedResults: SearchEntry[] = [];
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
      mergedResults.push(entry as SearchEntry);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">🔍 Search Scrambly</h1>
          <p className="text-muted-foreground">Search for Sonic characters, abilities, items, and more!</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <Input
            placeholder="Search for Sonic, Shadow, Chaos Emeralds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg"
          />
          <Button type="submit" size="lg">
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </form>

        {/* Warning Notice */}
        {showWarning && (
          <SearchWarningNotice
            count={lastWarningCount}
            remaining={Math.max(0, maxWarnings - lastWarningCount)}
            message={`⚠️ Warning! That search term is not allowed on this platform. You now have ${lastWarningCount} warning${lastWarningCount !== 1 ? "s" : ""}. ${Math.max(0, maxWarnings - lastWarningCount) > 0 ? `${Math.max(0, maxWarnings - lastWarningCount)} warning${Math.max(0, maxWarnings - lastWarningCount) !== 1 ? "s" : ""} remaining before a ban.` : "One more violation will result in a ban!"}`}
            onDismiss={() => setShowWarning(false)}
          />
        )}

        {/* Results */}
        {submittedQuery && !showWarning && (
          <>
            {/* sonic.exe vs metal sonic special results */}
            {isSonicExeQuery ? (
              <ReplacementVideoResults
                videos={sonicExeVsMetalSonicVideos}
                title="🎮 Sonic.EXE vs Metal Sonic — YouTube Results"
              />
            ) : shouldReplaceResults ? (
              /* Admin inappropriate search — show Sonic vs Metal Sonic */
              <ReplacementVideoResults
                videos={sonicVsMetalSonicVideos}
                title="🎮 Sonic the Hedgehog vs Metal Sonic"
              />
            ) : (
              <SearchResults
                results={mergedResults}
                isLoading={backendLoading}
                query={submittedQuery}
              />
            )}

            {/* External search fallback */}
            <ExternalSearchButtons query={submittedQuery} />
          </>
        )}
      </div>
    </div>
  );
}
