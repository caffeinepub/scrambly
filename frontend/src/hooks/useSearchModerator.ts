import { useState, useCallback } from 'react';

const STORAGE_KEY = 'scrambly_search_moderation';

interface ModerationState {
  warningCount: number;
  pornWarningCount: number;
  banStatus: null | 'anime' | 'porn';
  appealUsed: boolean;
  postAppeal: boolean; // true after a successful appeal (post-appeal state)
}

interface WarningResult {
  allowed: boolean;
  warning?: {
    count: number;
    remaining: number;
    message: string;
  };
  ban?: {
    type: 'anime' | 'porn';
    message: string;
  };
}

const MAX_WARNINGS_BEFORE_BAN = 3;

// +2% of max warnings = 0.02 * 3 = 0.06 → represented as a fractional life restore.
// In integer terms, the appeal sets warningCount to MAX - 1 (one warning below ban),
// giving the user back 1 "life" slot (the +2% partial restore).
const APPEAL_WARNING_RESTORE = MAX_WARNINGS_BEFORE_BAN - 1; // = 2

function loadState(): ModerationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        warningCount: parsed.warningCount ?? 0,
        pornWarningCount: parsed.pornWarningCount ?? 0,
        banStatus: parsed.banStatus ?? null,
        appealUsed: parsed.appealUsed ?? false,
        postAppeal: parsed.postAppeal ?? false,
      };
    }
  } catch {
    // ignore
  }
  return { warningCount: 0, pornWarningCount: 0, banStatus: null, appealUsed: false, postAppeal: false };
}

function saveState(state: ModerationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useSearchModerator() {
  const [state, setState] = useState<ModerationState>(loadState);

  const updateState = useCallback((updater: (prev: ModerationState) => ModerationState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const checkQuery = useCallback(
    (query: string): WarningResult => {
      const lower = query.trim().toLowerCase();

      // Already banned — block everything
      if (state.banStatus) {
        return {
          allowed: false,
          ban: {
            type: state.banStatus,
            message:
              state.banStatus === 'porn'
                ? 'You have been permanently banned due to searching for inappropriate content.'
                : 'Sorry, you searched too many inappropriate and unsafe things.',
          },
        };
      }

      // ── Porn check ──────────────────────────────────────────────────────────
      if (lower === 'porn' || lower.includes('porn')) {
        const newPornCount = state.pornWarningCount + 1;
        const newTotal = state.warningCount + 2;

        // Second porn search (already had porn warnings) → permanent ban
        if (state.pornWarningCount >= 1) {
          const next: ModerationState = {
            ...state,
            warningCount: newTotal,
            pornWarningCount: newPornCount,
            banStatus: 'porn',
          };
          updateState(() => next);
          return {
            allowed: false,
            ban: {
              type: 'porn',
              message: 'You have been permanently banned due to searching for inappropriate content.',
            },
          };
        }

        // First porn search → 2 warnings
        updateState((prev) => ({
          ...prev,
          warningCount: prev.warningCount + 2,
          pornWarningCount: prev.pornWarningCount + 1,
        }));

        const remaining = Math.max(0, MAX_WARNINGS_BEFORE_BAN - newTotal);
        return {
          allowed: false,
          warning: {
            count: newTotal,
            remaining,
            message: `⚠️ Warning! Searching for inappropriate content is not allowed. You now have ${newTotal} warning${newTotal !== 1 ? 's' : ''}. ${remaining > 0 ? `${remaining} warning${remaining !== 1 ? 's' : ''} remaining before a ban.` : 'You are close to being banned!'}`,
          },
        };
      }

      // ── "All about anime" ban trigger ────────────────────────────────────────
      if (lower === 'all about anime' && state.warningCount >= 1) {
        const next: ModerationState = {
          ...state,
          warningCount: state.warningCount + 1,
          banStatus: 'anime',
        };
        updateState(() => next);
        return {
          allowed: false,
          ban: {
            type: 'anime',
            message: 'Sorry, you searched too many inappropriate and unsafe things.',
          },
        };
      }

      // ── MHA check ────────────────────────────────────────────────────────────
      if (lower === 'mha') {
        const newCount = state.warningCount + 1;
        updateState((prev) => ({ ...prev, warningCount: prev.warningCount + 1 }));

        // Check if this triggers an anime ban
        if (newCount >= MAX_WARNINGS_BEFORE_BAN) {
          updateState((prev) => ({ ...prev, banStatus: 'anime' }));
          return {
            allowed: false,
            ban: {
              type: 'anime',
              message: 'Sorry, you searched too many inappropriate and unsafe things.',
            },
          };
        }

        const remaining = Math.max(0, MAX_WARNINGS_BEFORE_BAN - newCount);
        return {
          allowed: false,
          warning: {
            count: newCount,
            remaining,
            message: `⚠️ Warning! MHA (My Hero Academia) content is not allowed on this platform. You now have ${newCount} warning${newCount !== 1 ? 's' : ''}. ${remaining > 0 ? `${remaining} warning${remaining !== 1 ? 's' : ''} remaining before a ban.` : 'One more violation will result in a ban!'}`,
          },
        };
      }

      // ── Anime check ──────────────────────────────────────────────────────────
      if (lower.includes('anime')) {
        const newCount = state.warningCount + 1;
        updateState((prev) => ({ ...prev, warningCount: prev.warningCount + 1 }));

        // Check if this triggers a ban
        if (newCount >= MAX_WARNINGS_BEFORE_BAN) {
          updateState((prev) => ({ ...prev, banStatus: 'anime' }));
          return {
            allowed: false,
            ban: {
              type: 'anime',
              message: 'Sorry, you searched too many inappropriate and unsafe things.',
            },
          };
        }

        const remaining = Math.max(0, MAX_WARNINGS_BEFORE_BAN - newCount);
        return {
          allowed: false,
          warning: {
            count: newCount,
            remaining,
            message: `⚠️ Warning! Anime content is not allowed on this platform. You now have ${newCount} warning${newCount !== 1 ? 's' : ''}. ${remaining > 0 ? `${remaining} warning${remaining !== 1 ? 's' : ''} remaining before a ban.` : 'One more violation will result in a ban!'}`,
          },
        };
      }

      return { allowed: true };
    },
    [state, updateState]
  );

  const resetBan = useCallback(() => {
    updateState((prev) => ({ ...prev, banStatus: null }));
  }, [updateState]);

  const markAppealUsed = useCallback(() => {
    updateState((prev) => ({ ...prev, appealUsed: true }));
  }, [updateState]);

  /**
   * Process a successful appeal:
   * - Clears the ban
   * - Grants +2% life by setting warningCount to MAX_WARNINGS_BEFORE_BAN - 1
   *   (one warning slot below the ban threshold — a partial life restore)
   * - Marks appeal as used (one-time only)
   * - Sets postAppeal flag
   */
  const processAppeal = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      banStatus: null,
      warningCount: APPEAL_WARNING_RESTORE,
      appealUsed: true,
      postAppeal: true,
    }));
  }, [updateState]);

  /**
   * Returns true if the user can appeal their current ban.
   * Only allowed on the first ban and only if the appeal hasn't been used yet.
   */
  const isAppealAvailable = !state.appealUsed && state.banStatus !== null;

  return {
    state,
    checkQuery,
    resetBan,
    markAppealUsed,
    processAppeal,
    isBanned: state.banStatus !== null,
    banType: state.banStatus,
    warningCount: state.warningCount,
    appealUsed: state.appealUsed,
    postAppeal: state.postAppeal,
    isAppealAvailable,
  };
}
