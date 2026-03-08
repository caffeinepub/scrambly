import { Star, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsUserModerator } from "../hooks/useQueries";

const MOD_BANNER_KEY = "scrambly_mod_banner_dismissed";

export default function ModeratorWelcomeBanner() {
  const { identity } = useInternetIdentity();
  const [dismissed, setDismissed] = useState(false);

  const principal = identity?.getPrincipal();
  const { data: isModerator } = useIsUserModerator(principal ?? null);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(MOD_BANNER_KEY) === "true";
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(MOD_BANNER_KEY, "true");
    setDismissed(true);
  };

  if (!isModerator || dismissed || !identity) return null;

  return (
    <div className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 fill-white text-white animate-pulse" />
        <div>
          <span className="font-bold text-lg">🎉 Yay, you're a mod!</span>
          <span className="ml-2 text-sm font-medium opacity-90">
            Help with Scrambly to make it better!
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
