import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 9;
const GAME_DURATION = 30;

export default function WhackAChaoGame() {
  const navigate = useNavigate();
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    Number.parseInt(localStorage.getItem("whackChaoHS") || "0", 10),
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showChao = useCallback(() => {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    setActive(idx);
    chaoRef.current = setTimeout(
      () => {
        setActive(null);
        if (running) {
          chaoRef.current = setTimeout(showChao, 400 + Math.random() * 400);
        }
      },
      700 + Math.random() * 400,
    );
  }, [running]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFinished(false);
    setRunning(true);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: showChao is a stable ref-based function
  useEffect(() => {
    if (!running) return;
    showChao();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          setFinished(true);
          clearInterval(timerRef.current!);
          if (chaoRef.current) clearTimeout(chaoRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current!);
      if (chaoRef.current) clearTimeout(chaoRef.current);
    };
  }, [running]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: highScore is read inside setState callback safely
  useEffect(() => {
    if (finished) {
      setActive(null);
      setScore((s) => {
        if (s > highScore) {
          setHighScore(s);
          localStorage.setItem("whackChaoHS", String(s));
        }
        return s;
      });
    }
  }, [finished]);

  const handleWhack = (idx: number) => {
    if (!running || active !== idx) return;
    setScore((s) => s + 1);
    setActive(null);
    if (chaoRef.current) clearTimeout(chaoRef.current);
    chaoRef.current = setTimeout(showChao, 300 + Math.random() * 300);
  };

  const chaoColors = [
    "#7EC8E3",
    "#A8E6CF",
    "#FFD3B6",
    "#FFAAA5",
    "#FF8B94",
    "#A8D8EA",
    "#AA96DA",
    "#FCBAD3",
    "#FFFFD2",
  ];

  return (
    <div className="min-h-screen bg-sonic-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/games" })}
            className="text-sonic-yellow hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-sonic-yellow font-fredoka">
            Whack-a-Chao!
          </h1>
          <div className="ml-auto flex items-center gap-2 text-sonic-yellow">
            <Trophy className="w-5 h-5" />
            <span className="font-nunito font-bold">{highScore}</span>
          </div>
        </div>

        <div className="bg-sonic-blue/20 rounded-2xl p-6 border-2 border-sonic-yellow/30">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <p className="text-white/60 font-nunito text-xs uppercase tracking-wide">
                Score
              </p>
              <p className="text-sonic-yellow font-fredoka text-3xl">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 font-nunito text-xs uppercase tracking-wide">
                Time
              </p>
              <p
                className={`font-fredoka text-3xl ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}
              >
                {timeLeft}s
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: GRID_SIZE }).map((_, idx) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: grid positions are stable by index
                key={idx}
                type="button"
                onClick={() => handleWhack(idx)}
                className={`relative h-24 rounded-2xl border-2 transition-all duration-100 overflow-hidden
                  ${
                    active === idx
                      ? "border-sonic-yellow bg-sonic-yellow/20 scale-95 shadow-lg shadow-sonic-yellow/30"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
              >
                {/* Hole */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-6 bg-black/40 rounded-full" />
                {/* Chao */}
                {active === idx && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center text-lg"
                      style={{ backgroundColor: chaoColors[idx] }}
                    >
                      😊
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {!running && !finished && (
            <Button
              onClick={startGame}
              className="w-full bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg hover:bg-yellow-400"
            >
              Start Game!
            </Button>
          )}

          {finished && (
            <div className="text-center">
              <p className="text-sonic-yellow font-fredoka text-2xl mb-1">
                Time's Up!
              </p>
              <p className="text-white font-nunito mb-4">
                You whacked{" "}
                <strong className="text-sonic-yellow">{score}</strong> Chao!{" "}
                {score >= highScore && score > 0 ? "🏆 New High Score!" : ""}
              </p>
              <Button
                onClick={startGame}
                className="w-full bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg hover:bg-yellow-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
