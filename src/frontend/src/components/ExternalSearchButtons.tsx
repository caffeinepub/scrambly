import { useRobotnikLaugh } from "../hooks/useRobotnikLaugh";

interface ExternalSearchButtonsProps {
  query: string;
}

/**
 * Displays "Search Google" and "Search DuckDuckGo" buttons when a query is present.
 * Clicking either button plays the Dr. Robotnik laugh and opens the external search URL.
 * Visible to all users regardless of authentication state.
 */
export default function ExternalSearchButtons({
  query,
}: ExternalSearchButtonsProps) {
  const { playLaugh } = useRobotnikLaugh();

  if (!query.trim()) return null;

  const encodedQuery = encodeURIComponent(query.trim());

  const handleGoogle = () => {
    playLaugh();
    window.open(
      `https://www.google.com/search?q=${encodedQuery}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleDuckDuckGo = () => {
    playLaugh();
    window.open(
      `https://duckduckgo.com/?q=${encodedQuery}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="mt-6">
      <p className="text-xs font-nunito text-muted-foreground mb-3 flex items-center gap-1.5">
        <span className="text-base">🥚</span>
        <span>
          Can't find it in Scrambly? Try searching the web — but beware, Dr.
          Eggman is watching!
        </span>
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Google Search Button */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-fredoka text-sm font-700 bg-sonic-blue text-sonic-yellow border-2 border-sonic-yellow/50 shadow-sonic hover:bg-sonic-blue/90 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
        >
          <GoogleIcon />
          Search Google
        </button>

        {/* DuckDuckGo Search Button */}
        <button
          type="button"
          onClick={handleDuckDuckGo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-fredoka text-sm font-700 bg-secondary text-secondary-foreground border-2 border-secondary/60 shadow-md hover:bg-secondary/80 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
        >
          <DuckDuckGoIcon />
          Search DuckDuckGo
        </button>
      </div>
    </div>
  );
}

/** Inline SVG Google "G" logo */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Inline SVG DuckDuckGo duck icon */
function DuckDuckGoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="12" cy="12" r="11" fill="#DE5833" />
      <circle cx="12" cy="10" r="5.5" fill="#F5F5F5" />
      <circle cx="10.5" cy="9" r="1.5" fill="#1A1A1A" />
      <circle cx="10.9" cy="8.6" r="0.5" fill="white" />
      <path
        d="M9 12.5 Q12 14.5 15 12.5"
        stroke="#DE5833"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M11 12 Q12 13 13 12" fill="#F5A623" />
    </svg>
  );
}
