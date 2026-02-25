import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Question {
  q: string;
  options: string[];
  answer: number;
}

const QUESTIONS: Question[] = [
  { q: 'What year was the original Sonic the Hedgehog released?', options: ['1989', '1991', '1993', '1995'], answer: 1 },
  { q: 'Who is Sonic\'s best friend?', options: ['Knuckles', 'Shadow', 'Tails', 'Amy'], answer: 2 },
  { q: 'What is the name of Sonic\'s arch-nemesis?', options: ['Dr. Eggman', 'Metal Sonic', 'Chaos', 'Infinite'], answer: 0 },
  { q: 'What color is Knuckles the Echidna?', options: ['Blue', 'Red', 'Green', 'Purple'], answer: 1 },
  { q: 'What is the name of the space station in Sonic Adventure 2?', options: ['Death Egg', 'Space Colony ARK', 'Egg Fleet', 'Final Fortress'], answer: 1 },
  { q: 'Which character was introduced in Sonic CD?', options: ['Knuckles', 'Shadow', 'Amy Rose', 'Rouge'], answer: 2 },
  { q: 'What are the alien creatures in Sonic Colors called?', options: ['Chao', 'Wisps', 'Zeti', 'Ancients'], answer: 1 },
  { q: 'What is the name of the water god in Sonic Adventure?', options: ['Tikal', 'Chaos', 'Dark Gaia', 'Solaris'], answer: 1 },
  { q: 'In Sonic 3 & Knuckles, who tricks Knuckles into fighting Sonic?', options: ['Metal Sonic', 'Shadow', 'Dr. Robotnik', 'Mephiles'], answer: 2 },
  { q: 'What transformation does Sonic get using all 7 Chaos Emeralds?', options: ['Dark Sonic', 'Hyper Sonic', 'Super Sonic', 'Turbo Sonic'], answer: 2 },
  { q: 'What is the name of the villain in Sonic Lost World?', options: ['Infinite', 'Zavok', 'Lyric', 'Black Doom'], answer: 1 },
  { q: 'Which game introduced Shadow the Hedgehog?', options: ['Sonic Heroes', 'Sonic Adventure 2', 'Shadow the Hedgehog', 'Sonic 2006'], answer: 1 },
  { q: 'What is the name of the island in Sonic Frontiers?', options: ['Angel Island', 'Starfall Islands', 'Little Planet', 'Lost Hex'], answer: 1 },
  { q: 'What is the name of the AI created by Eggman in Sonic Frontiers?', options: ['Orbot', 'Cubot', 'Sage', 'Gamma'], answer: 2 },
  { q: 'In Sonic Boom, what is the name of the new female character?', options: ['Blaze', 'Marine', 'Sticks', 'Cream'], answer: 2 },
  { q: 'What is the Phantom Ruby\'s first appearance?', options: ['Sonic Forces', 'Sonic Mania', 'Sonic Generations', 'Sonic Colors'], answer: 1 },
  { q: 'What does "Tails" real name stand for?', options: ['Miles Prower (Miles Per Hour)', 'Miles Tails Prower', 'Michael Prower', 'Miles Edward Prower'], answer: 0 },
  { q: 'Which Sonic game features time travel mechanics?', options: ['Sonic 2', 'Sonic CD', 'Sonic 3', 'Sonic Advance'], answer: 1 },
  { q: 'What is the name of the villain in Sonic Prime?', options: ['Nine', 'Chaos Sonic', 'The End', 'Mephiles'], answer: 1 },
  { q: 'In Sonic Adventure 2, who is Shadow\'s creator?', options: ['Dr. Eggman', 'Gerald Robotnik', 'Black Doom', 'G.U.N.'], answer: 1 },
  { q: 'What is the name of the echidna tribe\'s guardian in Sonic Adventure?', options: ['Knuckles', 'Tikal', 'Chaos', 'Pachacamac'], answer: 1 },
  { q: 'Which game features the Deadly Six as villains?', options: ['Sonic Unleashed', 'Sonic Colors', 'Sonic Lost World', 'Sonic Forces'], answer: 2 },
];

export default function SonicTriviaGame() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === QUESTIONS[current].answer) setCorrect(c => c + 1);
  };

  const handleNext = () => {
    if (current + 1 >= QUESTIONS.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    setAnswered(false);
  };

  const q = QUESTIONS[current];
  const pct = Math.round((correct / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-sonic-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate({ to: '/games' })} className="text-sonic-yellow hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-sonic-yellow font-fredoka">Sonic Trivia</h1>
        </div>

        {!finished ? (
          <div className="bg-sonic-blue/20 rounded-2xl p-6 border-2 border-sonic-yellow/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/60 font-nunito text-sm">Question {current + 1} / {QUESTIONS.length}</span>
              <span className="text-sonic-yellow font-nunito font-bold">Score: {correct}</span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 mb-6">
              <div
                className="bg-sonic-yellow h-2 rounded-full transition-all"
                style={{ width: `${((current) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <h2 className="text-white font-fredoka text-xl mb-6 leading-snug">{q.q}</h2>

            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt, idx) => {
                let cls = 'border-2 border-white/20 bg-white/5 text-white hover:border-sonic-yellow hover:bg-sonic-yellow/10';
                if (answered) {
                  if (idx === q.answer) cls = 'border-2 border-green-400 bg-green-400/20 text-green-300';
                  else if (idx === selected) cls = 'border-2 border-red-400 bg-red-400/20 text-red-300';
                  else cls = 'border-2 border-white/10 bg-white/5 text-white/40';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-3 rounded-xl font-nunito transition-all flex items-center gap-3 ${cls}`}
                  >
                    {answered && idx === q.answer && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                    {answered && idx === selected && idx !== q.answer && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && (
              <Button onClick={handleNext} className="w-full mt-6 bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg hover:bg-yellow-400">
                {current + 1 >= QUESTIONS.length ? 'See Results' : 'Next Question →'}
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-sonic-blue/20 rounded-2xl p-8 border-2 border-sonic-yellow/30 text-center">
            <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💙'}</div>
            <h2 className="text-sonic-yellow font-fredoka text-3xl mb-2">Quiz Complete!</h2>
            <p className="text-white font-nunito text-lg mb-1">You scored <strong className="text-sonic-yellow">{correct}</strong> out of <strong>{QUESTIONS.length}</strong></p>
            <p className="text-white/60 font-nunito mb-6">{pct}% correct — {pct >= 80 ? 'Sonic Speed Expert!' : pct >= 50 ? 'Good effort, keep learning!' : 'Keep exploring Sonic lore!'}</p>
            <Button onClick={handleRestart} className="bg-sonic-yellow text-sonic-dark font-bold font-fredoka text-lg px-8 hover:bg-yellow-400">
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
