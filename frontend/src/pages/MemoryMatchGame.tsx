import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CARD_SYMBOLS = ['🦔', '🦊', '🦔', '🦊', '💍', '💍', '⭐', '⭐', '🌀', '🌀', '🏃', '🏃', '💎', '💎', '🤖', '🤖'];

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatchGame() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);

  const initCards = useCallback(() => {
    const shuffled = shuffle(CARD_SYMBOLS);
    setCards(shuffled.map((symbol, id) => ({ id, symbol, flipped: false, matched: false })));
    setFlipped([]);
    setMoves(0);
    setWon(false);
    setSeconds(0);
    setLocked(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started || won) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, won]);

  const handleFlip = (id: number) => {
    if (locked || cards[id].flipped || cards[id].matched) return;
    if (flipped.length === 2) return;

    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (cards[a].symbol === cards[b].symbol) {
        setCards(prev => prev.map(c => (c.id === a || c.id === b) ? { ...c, matched: true } : c));
        setFlipped([]);
        // Check win
        setTimeout(() => {
          setCards(prev => {
            const allMatched = prev.every(c => c.matched || c.id === a || c.id === b);
            if (allMatched) setWon(true);
            return prev;
          });
        }, 100);
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === a || c.id === b) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-sonic-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate({ to: '/games' })} className="text-sonic-yellow hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-sonic-yellow font-fredoka">Memory Match</h1>
        </div>

        <div className="bg-sonic-blue/20 rounded-2xl p-6 border-2 border-sonic-yellow/30">
          {started && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-nunito">Moves: <strong className="text-sonic-yellow">{moves}</strong></span>
              <span className="text-white font-nunito flex items-center gap-1">
                <Clock className="w-4 h-4 text-sonic-yellow" /> {formatTime(seconds)}
              </span>
            </div>
          )}

          {!started ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🃏</div>
              <p className="text-white font-nunito mb-6">Flip cards to find matching Sonic character pairs!</p>
              <Button onClick={initCards} className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400">
                Start Game
              </Button>
            </div>
          ) : won ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-sonic-yellow font-fredoka text-2xl mb-1">You Won!</p>
              <p className="text-white font-nunito mb-4">{moves} moves in {formatTime(seconds)}</p>
              <Button onClick={initCards} className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400">
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleFlip(card.id)}
                  className={`h-16 rounded-xl border-2 text-2xl transition-all duration-200 font-bold
                    ${card.flipped || card.matched
                      ? 'border-sonic-yellow bg-sonic-yellow/20 scale-95'
                      : 'border-white/20 bg-sonic-blue/40 hover:border-sonic-yellow/50 hover:bg-sonic-blue/60'
                    }
                    ${card.matched ? 'opacity-60' : ''}
                  `}
                >
                  {card.flipped || card.matched ? card.symbol : '?'}
                </button>
              ))}
            </div>
          )}

          {started && !won && (
            <Button onClick={initCards} variant="ghost" className="w-full mt-4 text-white/40 hover:text-white font-nunito text-sm">
              <RotateCcw className="w-3 h-3 mr-1" /> Restart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
