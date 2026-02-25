import { useState, useEffect } from 'react';

const AD_BLOCKER_KEY = 'scrambly_ad_blocker';

export function useAdBlocker() {
  const [adBlockerEnabled, setAdBlockerEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AD_BLOCKER_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AD_BLOCKER_KEY, String(adBlockerEnabled));
    } catch {
      // ignore
    }
  }, [adBlockerEnabled]);

  const toggle = () => setAdBlockerEnabled((prev) => !prev);

  return { adBlockerEnabled, toggle, setAdBlockerEnabled };
}
