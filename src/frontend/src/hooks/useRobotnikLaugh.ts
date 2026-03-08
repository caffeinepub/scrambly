import { useCallback, useRef } from "react";

/**
 * Synthesizes a Dr. Robotnik/Eggman-style villain laugh using the Web Audio API.
 * Returns a `playLaugh` callback that fires the sound non-blocking.
 * Works fully offline — no external audio assets required.
 */
export function useRobotnikLaugh() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playLaugh = useCallback(() => {
    try {
      // Lazily create AudioContext on first use (browser autoplay policy)
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // Resume if suspended (required after user gesture in some browsers)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Robotnik laugh: "Hoo hoo hoo hoo!" — 4 descending bursts
      const laughPattern = [
        { freq: 320, start: 0.0, dur: 0.12 },
        { freq: 290, start: 0.16, dur: 0.12 },
        { freq: 260, start: 0.32, dur: 0.12 },
        { freq: 230, start: 0.48, dur: 0.14 },
        // Second wave — slightly lower pitch
        { freq: 300, start: 0.7, dur: 0.12 },
        { freq: 270, start: 0.86, dur: 0.12 },
        { freq: 240, start: 1.02, dur: 0.14 },
        // Final long "HOOO"
        { freq: 210, start: 1.22, dur: 0.28 },
      ];

      // biome-ignore lint/complexity/noForEach: Web Audio API scheduling loop, for..of doesn't work here
      laughPattern.forEach(({ freq, start, dur }) => {
        // Main oscillator — sawtooth for a brassy, villain-like timbre
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + start);
        // Slight pitch drop for each burst (evil chuckle feel)
        osc.frequency.linearRampToValueAtTime(freq * 0.85, now + start + dur);

        gainNode.gain.setValueAtTime(0, now + start);
        gainNode.gain.linearRampToValueAtTime(0.28, now + start + 0.02);
        gainNode.gain.setValueAtTime(0.28, now + start + dur - 0.03);
        gainNode.gain.linearRampToValueAtTime(0, now + start + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.01);

        // Sub-oscillator for body/depth
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(freq * 0.5, now + start);
        subGain.gain.setValueAtTime(0.12, now + start);
        subGain.gain.linearRampToValueAtTime(0, now + start + dur);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now + start);
        sub.stop(now + start + dur + 0.01);
      });
    } catch {
      // Silently ignore if Web Audio is unavailable
    }
  }, []);

  return { playLaugh };
}
