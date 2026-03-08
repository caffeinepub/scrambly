import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import React, { useState, useRef, useCallback } from "react";

const ROUNDS = 8;

function getTargetZone() {
  const start = 20 + Math.random() * 50;
  const width = 10 + Math.random() * 20;
  return { start, end: Math.min(start + width, 95) };
}

export default function SpinDashChallengeGame() {
  const navigate = useNavigate();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [charging, setCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [target, setTarget] = useState(getTargetZone);
  const [result, setResult] = useState<"hit" | "miss" | null>(null);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    Number.parseInt(localStorage.getItem("spinDashHS") || "0", 10),
  );
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCharge = useCallback(() => {
    if (result !== null || !started || finished) return;
    setCharging(true);
    chargeInterval.current = setInterval(() => {
      setChargeLevel((l) => {
        if (l >= 100) {
          clearInterval(chargeInterval.current!);
          return 100;
        }
        return l + 2;
      });
    }, 30);
  }, [result, started, finished]);

  const releaseCharge = useCallback(() => {
    if (!charging) return;
    clearInterval(chargeInterval.current!);
    setCharging(false);
    const level = chargeLevel;
    const hit = level >= target.start && level <= target.end;
    setResult(hit ? "hit" : "miss");
    if (hit) setScore((s) => s + 1);
    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= ROUNDS) {
        setFinished(true);
        setScore((s) => {
          if (s > highScore) {
            setHighScore(s);
            localStorage.setItem("spinDashHS", String(s));
          }
          return s;
        });
      } else {
        setRound(nextRound);
        setTarget(getTargetZone());
        setChargeLevel(0);
        setResult(null);
      }
    }, 900);
  }, [charging, chargeLevel, target, round, highScore]);

  const startGame = () => {
    setRound(0);
    setScore(0);
    setChargeLevel(0);
    setResult(null);
    setFinished(false);
    setTarget(getTargetZone());
    setStarted(true);
  };

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
            Spin Dash Challenge
          </h1>
          <div className="ml-auto flex items-center gap-2 text-sonic-yellow">
            <Trophy className="w-5 h-5" />
            <span className="font-nunito font-bold">
              {highScore}/{ROUNDS}
            </span>
          </div>
        </div>

        <div className="bg-sonic-blue/20 rounded-2xl p-6 border-2 border-sonic-yellow/30">
          {!started ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🌀</div>
              <h2 className="text-sonic-yellow font-fredoka text-2xl mb-3">
                Spin Dash Challenge!
              </h2>
              <p className="text-white font-nunito mb-2">
                Hold the button to charge your spin dash.
              </p>
              <p className="text-white/60 font-nunito text-sm mb-6">
                Release when the meter is inside the{" "}
                <span className="text-sonic-yellow font-bold">yellow zone</span>{" "}
                to score!
              </p>
              <Button
                onClick={startGame}
                className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400"
              >
                Start Challenge
              </Button>
            </div>
          ) : finished ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">
                {score >= ROUNDS * 0.75
                  ? "🏆"
                  : score >= ROUNDS * 0.5
                    ? "⭐"
                    : "💙"}
              </div>
              <p className="text-sonic-yellow font-fredoka text-2xl mb-1">
                Challenge Complete!
              </p>
              <p className="text-white font-nunito mb-1">
                Score: <strong className="text-sonic-yellow">{score}</strong> /{" "}
                {ROUNDS}
              </p>
              <p className="text-white/60 font-nunito text-sm mb-6">
                {score >= ROUNDS * 0.75
                  ? "Spin Dash Master!"
                  : score >= ROUNDS * 0.5
                    ? "Good timing!"
                    : "Keep practicing!"}
              </p>
              <Button
                onClick={startGame}
                className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-white font-nunito">
                  Round{" "}
                  <strong className="text-sonic-yellow">{round + 1}</strong> /{" "}
                  {ROUNDS}
                </span>
                <span className="text-white font-nunito">
                  Score: <strong className="text-sonic-yellow">{score}</strong>
                </span>
              </div>

              {/* Meter */}
              <div className="mb-6">
                <p className="text-white/60 font-nunito text-sm mb-2 text-center">
                  Charge Meter
                </p>
                <div className="relative w-full h-10 bg-white/10 rounded-full overflow-hidden border-2 border-white/20">
                  {/* Target zone */}
                  <div
                    className="absolute top-0 h-full bg-sonic-yellow/40 border-x-2 border-sonic-yellow"
                    style={{
                      left: `${target.start}%`,
                      width: `${target.end - target.start}%`,
                    }}
                  />
                  {/* Charge bar */}
                  <div
                    className={`absolute top-0 left-0 h-full transition-none rounded-full ${
                      result === "hit"
                        ? "bg-green-400"
                        : result === "miss"
                          ? "bg-red-400"
                          : "bg-sonic-blue"
                    }`}
                    style={{ width: `${chargeLevel}%` }}
                  />
                  {/* Indicator line */}
                  <div
                    className="absolute top-0 w-1 h-full bg-white"
                    style={{ left: `${chargeLevel}%` }}
                  />
                </div>
                {result && (
                  <p
                    className={`text-center font-fredoka text-lg mt-2 ${result === "hit" ? "text-green-400" : "text-red-400"}`}
                  >
                    {result === "hit" ? "✅ Perfect Hit!" : "❌ Missed!"}
                  </p>
                )}
              </div>

              <button
                type="button"
                onMouseDown={startCharge}
                onMouseUp={releaseCharge}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startCharge();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  releaseCharge();
                }}
                disabled={result !== null}
                className={`w-full py-6 rounded-2xl font-fredoka text-2xl font-bold transition-all select-none
                  ${
                    charging
                      ? "bg-sonic-yellow text-sonic-dark scale-95 shadow-lg shadow-sonic-yellow/40"
                      : result !== null
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-sonic-blue text-white hover:bg-sonic-blue/80 active:scale-95"
                  }`}
              >
                {charging
                  ? "🌀 Charging..."
                  : result !== null
                    ? "⏳ Next round..."
                    : "🌀 Hold to Charge!"}
              </button>
              <p className="text-white/40 font-nunito text-xs text-center mt-3">
                Hold the button to charge, release inside the yellow zone!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
