import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_W = 480;
const CANVAS_H = 320;
const PLAYER_R = 16;
const OBS_W = 30;
const OBS_H = 50;

interface Obstacle { x: number; y: number; speed: number; color: string; }

export default function SonicDodgeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const gsRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    player: { x: CANVAS_W / 2, y: CANVAS_H / 2 },
    obstacles: [] as Obstacle[],
    frameId: 0,
    tick: 0,
    speed: 1,
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('sonicDodgeHS') || '0', 10));

  const OBS_COLORS = ['#FF4444', '#FF8800', '#FF44AA', '#AA44FF'];

  const spawnObs = (speed: number): Obstacle => {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * CANVAS_W; y = -OBS_H; }
    else if (side === 1) { x = CANVAS_W + OBS_W; y = Math.random() * CANVAS_H; }
    else if (side === 2) { x = Math.random() * CANVAS_W; y = CANVAS_H + OBS_H; }
    else { x = -OBS_W; y = Math.random() * CANVAS_H; }
    return { x, y, speed: speed + Math.random() * 1.5, color: OBS_COLORS[Math.floor(Math.random() * OBS_COLORS.length)] };
  };

  const resetGame = useCallback(() => {
    const gs = gsRef.current;
    gs.score = 0;
    gs.gameOver = false;
    gs.running = true;
    gs.player = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
    gs.obstacles = [];
    gs.tick = 0;
    gs.speed = 2;
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gs = gsRef.current;

    const loop = () => {
      if (!gs.running) return;
      gs.tick++;

      const spd = 4;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) gs.player.x = Math.max(PLAYER_R, gs.player.x - spd);
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) gs.player.x = Math.min(CANVAS_W - PLAYER_R, gs.player.x + spd);
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) gs.player.y = Math.max(PLAYER_R, gs.player.y - spd);
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) gs.player.y = Math.min(CANVAS_H - PLAYER_R, gs.player.y + spd);

      // Increase speed over time
      gs.speed = 2 + gs.tick / 600;

      // Spawn obstacles
      if (gs.tick % 50 === 0) gs.obstacles.push(spawnObs(gs.speed));

      // Move obstacles toward player
      for (const o of gs.obstacles) {
        const dx = gs.player.x - o.x;
        const dy = gs.player.y - o.y;
        const dist = Math.hypot(dx, dy) || 1;
        o.x += (dx / dist) * o.speed;
        o.y += (dy / dist) * o.speed;
      }

      // Remove far obstacles
      gs.obstacles = gs.obstacles.filter(o =>
        o.x > -100 && o.x < CANVAS_W + 100 && o.y > -100 && o.y < CANVAS_H + 100
      );

      // Collision
      for (const o of gs.obstacles) {
        if (
          gs.player.x + PLAYER_R > o.x - OBS_W / 2 &&
          gs.player.x - PLAYER_R < o.x + OBS_W / 2 &&
          gs.player.y + PLAYER_R > o.y - OBS_H / 2 &&
          gs.player.y - PLAYER_R < o.y + OBS_H / 2
        ) {
          gs.running = false;
          gs.gameOver = true;
          const finalScore = Math.floor(gs.tick / 60);
          setScore(finalScore);
          setGameOver(true);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('sonicDodgeHS', String(finalScore));
          }
          return;
        }
      }

      gs.score = Math.floor(gs.tick / 60);
      if (gs.tick % 60 === 0) setScore(gs.score);

      // Draw
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#001a40');
      grad.addColorStop(1, '#003070');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,215,0,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

      // Obstacles
      for (const o of gs.obstacles) {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x - OBS_W / 2, o.y - OBS_H / 2, OBS_W, OBS_H);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(o.x - OBS_W / 2, o.y - OBS_H / 2, OBS_W, 8);
      }

      // Player
      ctx.beginPath();
      ctx.arc(gs.player.x, gs.player.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fillStyle = '#1E90FF';
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gs.player.x + 6, gs.player.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gs.player.x + 7, gs.player.y - 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px Fredoka One, sans-serif';
      ctx.fillText(`Time: ${gs.score}s`, 12, 28);

      gs.frameId = requestAnimationFrame(loop);
    };

    gs.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gs.frameId);
  }, [started, highScore]);

  return (
    <div className="min-h-screen bg-sonic-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate({ to: '/games' })} className="text-sonic-yellow hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-sonic-yellow font-fredoka">Sonic Dodge</h1>
          <div className="ml-auto flex items-center gap-2 text-sonic-yellow">
            <Trophy className="w-5 h-5" />
            <span className="font-nunito font-bold">{highScore}s</span>
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
              <p className="text-white font-nunito mb-3">Use <kbd className="bg-sonic-yellow text-sonic-dark px-2 py-1 rounded font-bold">WASD</kbd> or <kbd className="bg-sonic-yellow text-sonic-dark px-2 py-1 rounded font-bold">Arrow Keys</kbd> to dodge obstacles!</p>
              <Button onClick={resetGame} className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400">
                Start Game
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="text-center">
              <p className="text-sonic-yellow font-fredoka text-2xl mb-1">Game Over!</p>
              <p className="text-white font-nunito mb-3">Survived: <strong>{score}s</strong> {score >= highScore && score > 0 ? '🏆 New High Score!' : ''}</p>
              <Button onClick={resetGame} className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400">
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
