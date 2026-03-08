import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";

interface Platform {
  x: number;
  y: number;
  width: number;
}

interface Player {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
}

const CANVAS_W = 480;
const CANVAS_H = 320;
const GRAVITY = 0.5;
const JUMP_FORCE = -11;
const PLATFORM_SPEED = 3;
const PLAYER_SIZE = 28;

export default function SonicJumpGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    player: { x: 80, y: 240, vy: 0, onGround: false } as Player,
    platforms: [] as Platform[],
    frameId: 0,
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return Number.parseInt(
      localStorage.getItem("sonicJumpHighScore") || "0",
      10,
    );
  });

  const initPlatforms = () => {
    const platforms: Platform[] = [];
    platforms.push({ x: 0, y: 290, width: CANVAS_W });
    for (let i = 0; i < 4; i++) {
      platforms.push({
        x: 150 + i * 130,
        y: 200 + Math.random() * 60,
        width: 80 + Math.random() * 40,
      });
    }
    return platforms;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initPlatforms is stable, defined in render
  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.score = 0;
    gs.gameOver = false;
    gs.running = true;
    gs.player = { x: 80, y: 240, vy: 0, onGround: false };
    gs.platforms = initPlatforms();
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.player.onGround && gs.running) {
      gs.player.vy = JUMP_FORCE;
      gs.player.onGround = false;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gs = gameStateRef.current;

    const loop = () => {
      if (!gs.running) return;

      // Update player
      gs.player.vy += GRAVITY;
      gs.player.y += gs.player.vy;
      gs.player.onGround = false;

      // Platform collision
      for (const p of gs.platforms) {
        if (
          gs.player.x + PLAYER_SIZE > p.x &&
          gs.player.x < p.x + p.width &&
          gs.player.y + PLAYER_SIZE >= p.y &&
          gs.player.y + PLAYER_SIZE <= p.y + 16 &&
          gs.player.vy >= 0
        ) {
          gs.player.y = p.y - PLAYER_SIZE;
          gs.player.vy = 0;
          gs.player.onGround = true;
        }
      }

      // Move platforms
      for (const p of gs.platforms) {
        p.x -= PLATFORM_SPEED;
      }

      // Remove off-screen platforms and add new ones
      gs.platforms = gs.platforms.filter((p) => p.x + p.width > -10);
      while (gs.platforms.length < 6) {
        const last = gs.platforms[gs.platforms.length - 1];
        gs.platforms.push({
          x: last ? last.x + 120 + Math.random() * 80 : CANVAS_W,
          y: 180 + Math.random() * 80,
          width: 70 + Math.random() * 50,
        });
      }

      // Score
      gs.score += 1;
      if (gs.score % 6 === 0) setScore(Math.floor(gs.score / 6));

      // Fall off screen
      if (gs.player.y > CANVAS_H + 50) {
        gs.running = false;
        gs.gameOver = true;
        const finalScore = Math.floor(gs.score / 6);
        setGameOver(true);
        setScore(finalScore);
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem("sonicJumpHighScore", String(finalScore));
        }
        return;
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#0054A6");
      grad.addColorStop(1, "#003070");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Platforms
      for (const p of gs.platforms) {
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(p.x, p.y, p.width, 14);
        ctx.fillStyle = "#CC9900";
        ctx.fillRect(p.x, p.y + 10, p.width, 4);
      }

      // Player (Sonic circle)
      ctx.beginPath();
      ctx.arc(
        gs.player.x + PLAYER_SIZE / 2,
        gs.player.y + PLAYER_SIZE / 2,
        PLAYER_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#1E90FF";
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Eye
      ctx.beginPath();
      ctx.arc(
        gs.player.x + PLAYER_SIZE / 2 + 6,
        gs.player.y + PLAYER_SIZE / 2 - 4,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        gs.player.x + PLAYER_SIZE / 2 + 7,
        gs.player.y + PLAYER_SIZE / 2 - 4,
        2,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#000";
      ctx.fill();

      // Score
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px Fredoka One, sans-serif";
      ctx.fillText(`Score: ${Math.floor(gs.score / 6)}`, 12, 28);

      gs.frameId = requestAnimationFrame(loop);
    };

    gs.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gs.frameId);
  }, [started, highScore]);

  return (
    <div className="min-h-screen bg-sonic-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/games" })}
            className="text-sonic-yellow hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-sonic-yellow font-fredoka">
            Sonic Jump
          </h1>
          <div className="ml-auto flex items-center gap-2 text-sonic-yellow">
            <Trophy className="w-5 h-5" />
            <span className="font-nunito font-bold">{highScore}</span>
          </div>
        </div>

        <div className="bg-sonic-blue/20 rounded-2xl p-4 border-2 border-sonic-yellow/30 flex flex-col items-center gap-4">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: game canvas, keyboard handled via keydown listener in useEffect */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl border-2 border-sonic-yellow/50 cursor-pointer w-full max-w-[480px]"
            onClick={jump}
            style={{ imageRendering: "pixelated" }}
          />

          {!started && !gameOver && (
            <div className="text-center">
              <p className="text-white font-nunito mb-3">
                Press{" "}
                <kbd className="bg-sonic-yellow text-sonic-dark px-2 py-1 rounded font-bold">
                  Space
                </kbd>{" "}
                or tap the canvas to jump!
              </p>
              <Button
                onClick={resetGame}
                className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400"
              >
                Start Game
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="text-center">
              <p className="text-sonic-yellow font-fredoka text-2xl mb-1">
                Game Over!
              </p>
              <p className="text-white font-nunito mb-3">
                Score: <strong>{score}</strong>{" "}
                {score >= highScore && score > 0 ? "🏆 New High Score!" : ""}
              </p>
              <Button
                onClick={resetGame}
                className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          )}

          {started && !gameOver && (
            <p className="text-white/60 font-nunito text-sm">
              Press <kbd className="bg-white/20 px-1 rounded">Space</kbd> /{" "}
              <kbd className="bg-white/20 px-1 rounded">↑</kbd> or tap to jump
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
