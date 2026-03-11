import { useCallback, useEffect, useRef, useState } from "react";

const MUSIC_URL =
  "https://archive.org/download/05-casino-night-zone/05%20Casino%20Night%20Zone.ogg";
const VOLUME_KEY = "scrambly_music_volume";

let globalAudio: HTMLAudioElement | null = null;

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio(MUSIC_URL);
    globalAudio.loop = true;
    globalAudio.preload = "auto";
    const saved = localStorage.getItem(VOLUME_KEY);
    const vol = saved ? Number.parseInt(saved, 10) : 50;
    globalAudio.volume = vol <= 1 ? 0 : vol / 100;
  }
  return globalAudio;
}

export function useMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(getGlobalAudio());

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved ? Number.parseInt(saved, 10) : 50;
  });

  const isMuted = volume <= 1;

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(1, Math.min(100, val));
    setVolumeState(clamped);
    localStorage.setItem(VOLUME_KEY, String(clamped));
    const audio = audioRef.current;
    audio.volume = clamped <= 1 ? 0 : clamped / 100;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    // Attempt autoplay
    const play = () => {
      audio.play().catch(() => {
        // Autoplay blocked — wait for user interaction
        const resume = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", resume);
          document.removeEventListener("keydown", resume);
        };
        document.addEventListener("click", resume, { once: true });
        document.addEventListener("keydown", resume, { once: true });
      });
    };
    play();
  }, []);

  return { volume, setVolume, isMuted };
}
