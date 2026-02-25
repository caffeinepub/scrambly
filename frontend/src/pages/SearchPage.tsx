import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { useSearchSonicContent, useGetAllEntriesByType } from '../hooks/useQueries';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Zap, Star, Gamepad2, BookOpen } from 'lucide-react';

const SONIC_CATEGORIES = [
  { key: 'character', label: 'Characters', icon: <Star size={14} /> },
  { key: 'game', label: 'Games', icon: <Gamepad2 size={14} /> },
  { key: 'lore', label: 'Lore', icon: <BookOpen size={14} /> },
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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useSearchSonicContent(query);

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
      <SearchBar onSearch={setQuery} />

      {/* Search Results or Browse */}
      {query ? (
        <SearchResults results={results} isLoading={isLoading} query={query} />
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
