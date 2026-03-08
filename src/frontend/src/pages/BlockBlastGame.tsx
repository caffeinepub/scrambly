import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Game Constants ───────────────────────────────────────────────────────────
const COLS = 8;
const ROWS = 10;
const CELL = 48;
const COLORS = [
  "#1a6fc4",
  "#f5c800",
  "#e63946",
  "#2dc653",
  "#9b5de5",
  "#f77f00",
];

type Grid = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

const PIECES = [
  { shape: [[1, 1, 1, 1]] },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
    ],
  },
  {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
];

function randomPiece(): Piece {
  const template = PIECES[Math.floor(Math.random() * PIECES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    shape: template.shape,
    color,
    x: Math.floor(COLS / 2) - Math.floor(template.shape[0].length / 2),
    y: 0,
  };
}

function isValid(grid: Grid, piece: Piece, dx = 0, dy = 0): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && grid[ny][nx]) return false;
    }
  }
  return true;
}

function placePiece(grid: Grid, piece: Piece): Grid {
  const newGrid = grid.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nx = piece.x + c;
      const ny = piece.y + r;
      if (ny >= 0) newGrid[ny][nx] = piece.color;
    }
  }
  return newGrid;
}

function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const newGrid = grid.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - newGrid.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { grid: [...empty, ...newGrid], cleared };
}

function rotatePiece(piece: Piece): Piece {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  const rotated = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => piece.shape[rows - 1 - r][c]),
  );
  return { ...piece, shape: rotated };
}

export default function BlockBlastGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    Number.parseInt(localStorage.getItem("bb_highscore") || "0"),
  );

  const gridRef = useRef<Grid>(emptyGrid());
  const pieceRef = useRef<Piece>(randomPiece());
  const nextPieceRef = useRef<Piece>(randomPiece());
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const dropIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(COLS * CELL, r * CELL);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, ROWS * CELL);
      ctx.stroke();
    }

    // Placed blocks
    const grid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          ctx.fillStyle = grid[r][c]!;
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, 6);
        }
      }
    }

    // Ghost piece
    const piece = pieceRef.current;
    let ghostY = piece.y;
    while (isValid(grid, { ...piece, y: ghostY + 1 })) ghostY++;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const nx = piece.x + c;
        const ny = ghostY + r;
        if (ny >= 0) {
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(nx * CELL + 2, ny * CELL + 2, CELL - 4, CELL - 4);
        }
      }
    }

    // Active piece
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const nx = piece.x + c;
        const ny = piece.y + r;
        if (ny >= 0) {
          ctx.fillStyle = piece.color;
          ctx.fillRect(nx * CELL + 2, ny * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(nx * CELL + 2, ny * CELL + 2, CELL - 4, 6);
        }
      }
    }
  }, []);

  const dropPiece = useCallback(() => {
    if (gameOverRef.current) return;
    const piece = pieceRef.current;
    if (isValid(gridRef.current, piece, 0, 1)) {
      pieceRef.current = { ...piece, y: piece.y + 1 };
    } else {
      const newGrid = placePiece(gridRef.current, piece);
      const { grid: clearedGrid, cleared } = clearLines(newGrid);
      gridRef.current = clearedGrid;
      const points = cleared * 100 * (cleared > 1 ? cleared : 1);
      scoreRef.current += points + 10;
      setScore(scoreRef.current);

      const next = nextPieceRef.current;
      nextPieceRef.current = randomPiece();
      pieceRef.current = next;

      if (!isValid(gridRef.current, next)) {
        gameOverRef.current = true;
        setGameOver(true);
        if (
          scoreRef.current >
          Number.parseInt(localStorage.getItem("bb_highscore") || "0")
        ) {
          localStorage.setItem("bb_highscore", String(scoreRef.current));
          setHighScore(scoreRef.current);
        }
        if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      }
    }
    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    gridRef.current = emptyGrid();
    pieceRef.current = randomPiece();
    nextPieceRef.current = randomPiece();
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setStarted(true);

    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    dropIntervalRef.current = setInterval(dropPiece, 600);
    draw();
  }, [dropPiece, draw]);

  useEffect(() => {
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      const piece = pieceRef.current;
      if (e.key === "ArrowLeft" && isValid(gridRef.current, piece, -1, 0)) {
        pieceRef.current = { ...piece, x: piece.x - 1 };
      } else if (
        e.key === "ArrowRight" &&
        isValid(gridRef.current, piece, 1, 0)
      ) {
        pieceRef.current = { ...piece, x: piece.x + 1 };
      } else if (e.key === "ArrowDown") {
        dropPiece();
        return;
      } else if (e.key === "ArrowUp" || e.key === " ") {
        const rotated = rotatePiece(piece);
        if (isValid(gridRef.current, rotated)) {
          pieceRef.current = rotated;
        }
      }
      draw();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, dropPiece, draw]);

  useEffect(() => {
    return () => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (started) draw();
  }, [started, draw]);

  // Touch controls
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameOverRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const piece = pieceRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && isValid(gridRef.current, piece, 1, 0)) {
        pieceRef.current = { ...piece, x: piece.x + 1 };
      } else if (dx < -20 && isValid(gridRef.current, piece, -1, 0)) {
        pieceRef.current = { ...piece, x: piece.x - 1 };
      }
    } else {
      if (dy > 20) {
        dropPiece();
        return;
      }
      if (dy < -20) {
        const rotated = rotatePiece(piece);
        if (isValid(gridRef.current, rotated)) pieceRef.current = rotated;
      }
    }
    draw();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/games"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-nunito text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Games
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Game Canvas */}
        <div className="sonic-card p-4 flex flex-col items-center">
          <h2 className="font-fredoka text-2xl text-primary mb-3">
            Block Blast
          </h2>
          <div
            className="relative border-2 border-primary/30 rounded-xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              className="block"
            />
            {!started && !gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <div className="text-4xl font-fredoka text-white">
                  Block Blast
                </div>
                <p className="text-white/70 font-nunito text-sm text-center px-4">
                  Use arrow keys or swipe to move. Up/Space to rotate. Down to
                  drop fast!
                </p>
                <Button
                  onClick={startGame}
                  className="rounded-full font-fredoka text-lg bg-secondary text-secondary-foreground"
                >
                  Start Game
                </Button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <div className="text-4xl font-fredoka text-destructive">
                  Game Over!
                </div>
                <div className="text-white font-nunito text-center">
                  <p>
                    Score: <strong className="text-secondary">{score}</strong>
                  </p>
                  <p>
                    Best:{" "}
                    <strong className="text-secondary">{highScore}</strong>
                  </p>
                </div>
                <Button
                  onClick={startGame}
                  className="rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
                >
                  <RotateCcw size={16} className="mr-1" /> Play Again
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Score Panel */}
        <div className="flex flex-col gap-4 w-full lg:w-48">
          <div className="sonic-card p-4 text-center">
            <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">
              Score
            </p>
            <p className="text-3xl font-fredoka text-primary">{score}</p>
          </div>
          <div className="sonic-card p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={14} className="text-secondary-foreground" />
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide">
                Best
              </p>
            </div>
            <p className="text-3xl font-fredoka text-secondary-foreground">
              {highScore}
            </p>
          </div>
          {started && !gameOver && (
            <Button
              onClick={startGame}
              variant="outline"
              className="rounded-full font-nunito font-700 text-sm"
            >
              <RotateCcw size={14} className="mr-1" /> Restart
            </Button>
          )}
          <div className="sonic-card p-3 text-xs font-nunito text-muted-foreground space-y-1">
            <p className="font-700 text-foreground mb-2">Controls:</p>
            <p>⬅️➡️ Move</p>
            <p>⬆️ / Space: Rotate</p>
            <p>⬇️ Drop faster</p>
            <p className="text-primary font-700 mt-2">Mobile: Swipe!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
