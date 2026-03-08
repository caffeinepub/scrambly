import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";

const CANVAS_W = 480;
const CANVAS_H = 320;
const PLAYER_SPEED = 5;
const RING_RADIUS = 10;
const OBSTACLE_W = 20;
const OBSTACLE_H = 30;

interface Ring {
  x: number;
  y: number;
  collected: boolean;
}
interface Obstacle {
  x: number;
  y: number;
  speed: number;
}

export default function RingCollectorGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const gsRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    player: { x: 220, y: 260 },
    rings: [] as Ring[],
    obstacles: [] as Obstacle[],
    frameId: 0,
    tick: 0,
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    Number.parseInt(localStorage.getItem("ringCollectorHS") || "0", 10),
  );

  const spawnRing = () => ({
    x: 20 + Math.random() * (CANVAS_W - 40),
    y: -RING_RADIUS,
    collected: false,
  });

  const spawnObstacle = () => ({
    x: 20 + Math.random() * (CANVAS_W - 40),
    y: -OBSTACLE_H,
    speed: 2 + Math.random() * 2,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: spawnRing/spawnObstacle are stable render-scope functions
  const resetGame = useCallback(() => {
    const gs = gsRef.current;
    gs.score = 0;
    gs.gameOver = false;
    gs.running = true;
    gs.player = { x: 220, y: 260 };
    gs.rings = [spawnRing(), spawnRing(), spawnRing()];
    gs.obstacles = [spawnObstacle()];
    gs.tick = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: spawnObstacle/spawnRing are stable render-scope functions
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gsRef.current;

    const loop = () => {
      if (!gs.running) return;
      gs.tick++;

      // Move player
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("KeyA"))
        gs.player.x = Math.max(16, gs.player.x - PLAYER_SPEED);
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("KeyD"))
        gs.player.x = Math.min(CANVAS_W - 16, gs.player.x + PLAYER_SPEED);

      // Move rings
      for (const r of gs.rings) r.y += 2.5;
      gs.rings = gs.rings.filter((r) => r.y < CANVAS_H + 20 || !r.collected);

      // Collect rings
      for (const r of gs.rings) {
        if (
          !r.collected &&
          Math.hypot(r.x - gs.player.x, r.y - gs.player.y) < RING_RADIUS + 16
        ) {
          r.collected = true;
          gs.score++;
          setScore(gs.score);
        }
      }
      gs.rings = gs.rings.filter((r) => !r.collected && r.y < CANVAS_H + 20);

      // Spawn rings
      if (gs.tick % 60 === 0) gs.rings.push(spawnRing());

      // Move obstacles
      for (const o of gs.obstacles) o.y += o.speed;
      gs.obstacles = gs.obstacles.filter((o) => o.y < CANVAS_H + 40);
      if (gs.tick % 90 === 0) gs.obstacles.push(spawnObstacle());

      // Obstacle collision
      for (const o of gs.obstacles) {
        if (
          gs.player.x + 14 > o.x - OBSTACLE_W / 2 &&
          gs.player.x - 14 < o.x + OBSTACLE_W / 2 &&
          gs.player.y + 14 > o.y &&
          gs.player.y - 14 < o.y + OBSTACLE_H
        ) {
          gs.running = false;
          gs.gameOver = true;
          setGameOver(true);
          if (gs.score > highScore) {
            setHighScore(gs.score);
            localStorage.setItem("ringCollectorHS", String(gs.score));
          }
          return;
        }
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#001a40");
      grad.addColorStop(1, "#003070");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Rings
      for (const r of gs.rings) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, RING_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r.x, r.y, RING_RADIUS - 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFA500";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Obstacles (Badniks)
      for (const o of gs.obstacles) {
        ctx.fillStyle = "#FF4444";
        ctx.fillRect(o.x - OBSTACLE_W / 2, o.y, OBSTACLE_W, OBSTACLE_H);
        ctx.fillStyle = "#CC0000";
        ctx.fillRect(o.x - OBSTACLE_W / 2, o.y, OBSTACLE_W, 8);
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(o.x - 6, o.y + 10, 5, 5);
        ctx.fillRect(o.x + 1, o.y + 10, 5, 5);
      }

      // Player
      ctx.beginPath();
      ctx.arc(gs.player.x, gs.player.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#1E90FF";
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gs.player.x + 6, gs.player.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gs.player.x + 7, gs.player.y - 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      // Score
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px Fredoka One, sans-serif";
      ctx.fillText(`Rings: ${gs.score}`, 12, 28);

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
            Ring Collector
          </h1>
          <div className="ml-auto flex items-center gap-2 text-sonic-yellow">
            <Trophy className="w-5 h-5" />
            <span className="font-nunito font-bold">{highScore}</span>
          </div>
        </div>

        <div className="bg-sonic-blue/20 rounded-2xl p-4 border-2 border-sonic-yellow/30 flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl border-2 border-sonic-yellow/50 w-full max-w-[480px]"
          />

          {!started && !gameOver && (
            <div className="text-center">
              <p className="text-white font-nunito mb-3">
                Use{" "}
                <kbd className="bg-sonic-yellow text-sonic-dark px-2 py-1 rounded font-bold">
                  ← →
                </kbd>{" "}
                to collect rings, avoid red Badniks!
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
                Rings: <strong>{score}</strong>{" "}
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
        </div>
      </div>
    </div>
  );
}
