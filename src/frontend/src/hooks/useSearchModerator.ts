import { useCallback, useState } from "react";
import { useGetCallerUserProfile } from "./useQueries";

const ADMIN_USERNAME = "TailsTheBeast124";

const INAPPROPRIATE_TERMS = [
  "porn",
  "hentai",
  "nsfw",
  "explicit",
  "nude",
  "naked",
  "xxx",
  "adult content",
  "inappropriate anime",
  "anime",
];

const MAX_WARNINGS_BEFORE_BAN = 5;

export interface SearchModerationResult {
  allowed: boolean;
  warningCount: number;
  isBanned: boolean;
  shouldReplaceResults: boolean;
}

const WARN_KEY = "scrambly_search_warnings";
const BAN_KEY = "scrambly_search_banned";
const APPEAL_KEY = "scrambly_search_appeal_used";

function getWarnings(): number {
  return Number.parseInt(localStorage.getItem(WARN_KEY) || "0", 10);
}

function setWarnings(count: number) {
  localStorage.setItem(WARN_KEY, String(count));
}

function isBanned(): boolean {
  return localStorage.getItem(BAN_KEY) === "true";
}

function setBanned(val: boolean) {
  localStorage.setItem(BAN_KEY, val ? "true" : "false");
}

function isAppealUsed(): boolean {
  return localStorage.getItem(APPEAL_KEY) === "true";
}

function setAppealUsed(val: boolean) {
  localStorage.setItem(APPEAL_KEY, val ? "true" : "false");
}

export function useSearchModerator() {
  const { data: profile } = useGetCallerUserProfile();
  const [warningCount, setWarningCount] = useState(getWarnings());
  const [banned, setBannedState] = useState(isBanned());
  const [appealUsed, setAppealUsedState] = useState(isAppealUsed());

  const isAdmin = profile?.name === ADMIN_USERNAME;

  const validateSearch = useCallback(
    (query: string): SearchModerationResult => {
      const lower = query.toLowerCase().trim();
      const hasInappropriate = INAPPROPRIATE_TERMS.some((term) =>
        lower.includes(term),
      );

      // Admin: allow everything, replace results with Sonic vs Metal Sonic
      if (isAdmin && hasInappropriate) {
        return {
          allowed: true,
          warningCount,
          isBanned: false,
          shouldReplaceResults: true,
        };
      }

      if (!hasInappropriate) {
        return {
          allowed: true,
          warningCount,
          isBanned: banned,
          shouldReplaceResults: false,
        };
      }

      if (banned) {
        return {
          allowed: false,
          warningCount,
          isBanned: true,
          shouldReplaceResults: false,
        };
      }

      // Issue warning
      const newCount = warningCount + 1;
      setWarnings(newCount);
      setWarningCount(newCount);

      if (newCount >= MAX_WARNINGS_BEFORE_BAN) {
        setBanned(true);
        setBannedState(true);
        return {
          allowed: false,
          warningCount: newCount,
          isBanned: true,
          shouldReplaceResults: false,
        };
      }

      return {
        allowed: false,
        warningCount: newCount,
        isBanned: false,
        shouldReplaceResults: false,
      };
    },
    [isAdmin, warningCount, banned],
  );

  const processAppeal = useCallback(() => {
    if (isAppealUsed()) return false;
    // Grant +2% life: set warning count to MAX_WARNINGS_BEFORE_BAN - 1
    const restoredCount = MAX_WARNINGS_BEFORE_BAN - 1;
    setWarnings(restoredCount);
    setWarningCount(restoredCount);
    setBanned(false);
    setBannedState(false);
    setAppealUsed(true);
    setAppealUsedState(true);
    return true;
  }, []);

  return {
    warningCount,
    isBanned: banned,
    isAppealAvailable: !appealUsed && banned,
    appealUsed,
    validateSearch,
    processAppeal,
    maxWarnings: MAX_WARNINGS_BEFORE_BAN,
  };
}
