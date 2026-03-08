import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "../backend";

export function useUsageTimer(profile: Profile | null | undefined) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (
      profile?.usageTimeRemaining !== undefined &&
      profile.usageTimeRemaining !== null
    ) {
      const secs = Number(profile.usageTimeRemaining);
      setTimeRemaining(secs);
      setIsExpired(secs <= 0);
    } else {
      setTimeRemaining(null);
      setIsExpired(false);
    }
  }, [profile?.usageTimeRemaining]);

  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          setIsExpired(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRemaining]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return { timeRemaining, isExpired, formatTime };
}
