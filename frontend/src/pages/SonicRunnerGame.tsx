import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const W = 480;
const H = 240;
const GROUND = H - 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const INITIAL_SPEED = 4;

interface Runner {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  frame: number;
}

interface Obstacle {
  x: number;
  w: number;
  h: number;
  type: 'spike' | 'wall';
}

interface Ring {
  x: number;
  y: number;
  collected: boolean;
}

export default function SonicRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [rings, setRings] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('sr_highscore') || '0'));

  const runnerRef = useRef<Runner>({ x: 60, y: GROUND - 40, vy: 0, onGround: true, frame: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const ringsCountRef = useRef(0);
  const gameOverRef = useRef(false);
  const frameCountRef = useRef(0);
  const bgOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  const jump = useCallback(() => {
    const runner = runnerRef.current;
    if (runner.onGround && !gameOverRef.current) {
      runnerRef.current = { ...runner, vy: JUMP_FORCE, onGround: false };
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a6fc4');
    sky.addColorStop(1, '#4da6ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Speed lines (background)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = 20 + i * 25;
      const offset = (bgOffsetRef.current * 2) % W;
      ctx.beginPath();
      ctx.moveTo(W - offset, y);
      ctx.lineTo(W - offset - 60, y);
      ctx.stroke();
    }

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const cloudX = (W - (bgOffsetRef.current * 0.5) % W);
    ctx.beginPath();
    ctx.arc(cloudX % W, 40, 20, 0, Math.PI * 2);
    ctx.arc((cloudX + 25) % W, 35, 15, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#2dc653';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#1a8a3a';
    ctx.fillRect(0, GROUND, W, 8);

    // Rings
    ringsRef.current.forEach((ring) => {
      if (ring.collected) return;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#f5c800';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(245,200,0,0.3)';
      ctx.fill();
    });

    // Obstacles
    obstaclesRef.current.forEach((obs) => {
      if (obs.type === 'spike') {
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.moveTo(obs.x, GROUND);
        ctx.lineTo(obs.x + obs.w / 2, GROUND - obs.h);
        ctx.lineTo(obs.x + obs.w, GROUND);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#555';
        ctx.fillRect(obs.x, GROUND - obs.h, obs.w, obs.h);
        ctx.fillStyle = '#777';
        ctx.fillRect(obs.x, GROUND - obs.h, obs.w, 6);
      }
    });

    // Runner (Sonic-inspired blue hedgehog)
    const runner = runnerRef.current;
    const rx = runner.x;
    const ry = runner.y;

    // Body
    ctx.fillStyle = '#1a6fc4';
    ctx.beginPath();
    ctx.ellipse(rx, ry + 20, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#1a6fc4';
    ctx.beginPath();
    ctx.arc(rx + 5, ry, 16, 0, Math.PI * 2);
    ctx.fill();

    // Spines
    ctx.fillStyle = '#1a6fc4';
    ctx.beginPath();
    ctx.moveTo(rx - 5, ry - 10);
    ctx.lineTo(rx - 20, ry - 25);
    ctx.lineTo(rx - 2, ry - 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx - 2, ry - 12);
    ctx.lineTo(rx - 15, ry - 30);
    ctx.lineTo(rx + 2, ry - 6);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(rx + 14, ry - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(rx + 15, ry - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shoes (animated)
    const legOffset = runner.onGround ? Math.sin(frameCountRef.current * 0.3) * 5 : 0;
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(rx - 5, ry + 38 + legOffset, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rx + 8, ry + 38 - legOffset, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Score HUD
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px "Fredoka One", cursive';
    ctx.fillText(`Score: ${scoreRef.current}`, 12, 22);
    ctx.fillStyle = '#f5c800';
    ctx.fillText(`Rings: ${ringsCountRef.current}`, W / 2 - 40, 22);
    ctx.fillStyle = 'white';
    ctx.fillText(`Speed: ${speedRef.current.toFixed(1)}`, W - 100, 22);
  }, []);

  const gameLoop = useCallback(() => {
    if (gameOverRef.current) return;

    frameCountRef.current++;
    bgOffsetRef.current += speedRef.current;

    // Update runner
    const runner = runnerRef.current;
    let newVy = runner.vy + GRAVITY;
    let newY = runner.y + newVy;
    let onGround = false;

    if (newY >= GROUND - 40) {
      newY = GROUND - 40;
      newVy = 0;
      onGround = true;
    }

    runnerRef.current = { ...runner, y: newY, vy: newVy, onGround, frame: frameCountRef.current };

    // Spawn obstacles
    if (frameCountRef.current % Math.max(60, 120 - Math.floor(scoreRef.current / 200)) === 0) {
      const type = Math.random() > 0.5 ? 'spike' : 'wall';
      obstaclesRef.current.push({
        x: W + 20,
        w: type === 'spike' ? 30 : 20,
        h: type === 'spike' ? 40 : 50 + Math.random() * 20,
        type,
      });
    }

    // Spawn rings
    if (frameCountRef.current % 80 === 0) {
      ringsRef.current.push({
        x: W + 20,
        y: GROUND - 60 - Math.random() * 60,
        collected: false,
      });
    }

    // Move obstacles
    obstaclesRef.current = obstaclesRef.current
      .map((obs) => ({ ...obs, x: obs.x - speedRef.current }))
      .filter((obs) => obs.x > -60);

    // Move rings
    ringsRef.current = ringsRef.current
      .map((ring) => ({ ...ring, x: ring.x - speedRef.current }))
      .filter((ring) => ring.x > -20);

    // Collision with obstacles
    const r = runnerRef.current;
    for (const obs of obstaclesRef.current) {
      const rLeft = r.x - 14;
      const rRight = r.x + 14;
      const rTop = r.y - 16;
      const rBottom = r.y + 40;
      const oLeft = obs.x;
      const oRight = obs.x + obs.w;
      const oTop = GROUND - obs.h;

      if (rRight > oLeft && rLeft < oRight && rBottom > oTop && rTop < GROUND) {
        gameOverRef.current = true;
        setGameOver(true);
        if (scoreRef.current > parseInt(localStorage.getItem('sr_highscore') || '0')) {
          localStorage.setItem('sr_highscore', String(scoreRef.current));
          setHighScore(scoreRef.current);
        }
        cancelAnimationFrame(rafRef.current);
        draw();
        return;
      }
    }

    // Collect rings
    ringsRef.current = ringsRef.current.map((ring) => {
      if (ring.collected) return ring;
      const dx = Math.abs(r.x - ring.x);
      const dy = Math.abs(r.y + 10 - ring.y);
      if (dx < 20 && dy < 20) {
        ringsCountRef.current++;
        setRings(ringsCountRef.current);
        return { ...ring, collected: true };
      }
      return ring;
    });

    // Score
    scoreRef.current++;
    if (frameCountRef.current % 60 === 0) setScore(scoreRef.current);

    // Speed up
    speedRef.current = INITIAL_SPEED + scoreRef.current / 500;

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  const startGame = useCallback(() => {
    runnerRef.current = { x: 60, y: GROUND - 40, vy: 0, onGround: true, frame: 0 };
    obstaclesRef.current = [];
    ringsRef.current = [];
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    ringsCountRef.current = 0;
    frameCountRef.current = 0;
    bgOffsetRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setRings(0);
    setGameOver(false);
    setStarted(true);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!started) { startGame(); return; }
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, jump, startGame]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (!started) draw();
  }, [started, draw]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/games" className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-nunito text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Games
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="sonic-card p-4 flex flex-col items-center">
          <h2 className="font-fredoka text-2xl text-primary mb-3">Sonic Runner</h2>
          <div
            className="relative border-2 border-primary/30 rounded-xl overflow-hidden cursor-pointer"
            onClick={started && !gameOver ? jump : startGame}
          >
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="block max-w-full"
            />
            {!started && !gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                <div className="text-3xl font-fredoka text-white">Sonic Runner</div>
                <p className="text-white/70 font-nunito text-sm text-center px-4">
                  Press Space / Tap to jump over obstacles and collect rings!
                </p>
                <Button onClick={startGame} className="rounded-full font-fredoka text-lg bg-secondary text-secondary-foreground">
                  Start Running!
                </Button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                <div className="text-3xl font-fredoka text-destructive">Game Over!</div>
                <div className="text-white font-nunito text-center space-y-1">
                  <p>Score: <strong className="text-secondary">{score}</strong></p>
                  <p>Rings: <strong className="text-secondary">{rings}</strong></p>
                  <p>Best: <strong className="text-secondary">{highScore}</strong></p>
                </div>
                <Button onClick={startGame} className="rounded-full font-fredoka text-lg bg-primary text-primary-foreground">
                  <RotateCcw size={16} className="mr-1" /> Play Again
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-nunito mt-2">
            Tap / Space to jump • Avoid obstacles • Collect rings!
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-48">
          <div className="sonic-card p-4 text-center">
            <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Score</p>
            <p className="text-3xl font-fredoka text-primary">{score}</p>
          </div>
          <div className="sonic-card p-4 text-center">
            <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Rings</p>
            <p className="text-3xl font-fredoka text-secondary-foreground">💍 {rings}</p>
          </div>
          <div className="sonic-card p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={14} className="text-secondary-foreground" />
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide">Best</p>
            </div>
            <p className="text-3xl font-fredoka text-secondary-foreground">{highScore}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
