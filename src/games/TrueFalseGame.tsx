import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import GameOver, { type GameProps } from './GameOver';
import { words as allWords } from '../data';
import { saveGameResult } from '../lib/progress';
import { sample } from '../lib/text';
import type { Word } from '../types';

const LIVES = 3;

interface Round {
  word: Word;
  shown: string;
  isTrue: boolean;
}

function makeRound(pool: Word[], last?: Word): Round {
  const candidates = pool.length > 1 && last ? pool.filter((w) => w.id !== last.id) : pool;
  const word = sample(candidates, 1)[0];
  if (Math.random() < 0.5) return { word, shown: word.meaningVi, isTrue: true };
  // A wrong meaning of the same part of speech makes the decision harder.
  const others = allWords.filter((w) => w.meaningVi !== word.meaningVi);
  const samePos = others.filter((w) => w.pos === word.pos);
  const decoy = sample(samePos.length > 20 ? samePos : others, 1)[0];
  return { word, shown: decoy.meaningVi, isTrue: false };
}

/** Seconds per question: 5s, shrinking to 2.5s as the score grows. */
function timeFor(score: number) {
  return Math.max(2500, 5000 - score * 100);
}

export default function TrueFalseGame({ pool, gameId, onAgain }: GameProps) {
  const [round, setRound] = useState(() => makeRound(pool));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [best, setBest] = useState(0);
  const [streakNow, setStreakNow] = useState(0);
  const [deadline, setDeadline] = useState(() => Date.now() + timeFor(0));
  const [now, setNow] = useState(Date.now);
  const [flash, setFlash] = useState<null | 'right' | 'wrong'>(null);
  const [result, setResult] = useState<{ record: boolean } | null>(null);

  const next = useCallback(
    (gotIt: boolean) => {
      const newScore = score + (gotIt ? 1 : 0);
      const newLives = lives - (gotIt ? 0 : 1);
      setFlash(gotIt ? 'right' : 'wrong');
      setScore(newScore);
      setLives(newLives);
      setStreakNow(gotIt ? streakNow + 1 : 0);
      setBest(Math.max(best, gotIt ? streakNow + 1 : 0));
      setTimeout(
        () => {
          setFlash(null);
          if (newLives <= 0) {
            setResult({ record: saveGameResult(gameId, newScore, newScore, { title: 'Đúng hay Sai?', detail: `${newScore} câu đúng · chuỗi dài nhất ${Math.max(best, gotIt ? streakNow + 1 : 0)}` }) });
            return;
          }
          setRound((r) => makeRound(pool, r.word));
          setDeadline(Date.now() + timeFor(newScore));
        },
        gotIt ? 250 : 900,
      );
    },
    [score, lives, streakNow, best, gameId, pool],
  );

  const answer = useCallback(
    (sayTrue: boolean) => {
      if (flash || result) return;
      next(sayTrue === round.isTrue);
    },
    [flash, result, next, round.isTrue],
  );

  useEffect(() => {
    if (flash || result) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= deadline) next(false);
    }, 100);
    return () => clearInterval(t);
  }, [deadline, flash, result, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') answer(true);
      if (e.key === 'ArrowRight') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  if (result) {
    return <GameOver title={`${score} câu đúng`} detail={`Chuỗi đúng dài nhất: ${best}`} xp={score} record={result.record} onAgain={onAgain} />;
  }

  const total = timeFor(score);
  const left = Math.max(0, deadline - now);

  return (
    <div>
      <div className="game-bar">
        <span className="lives" aria-label={`Còn ${lives} mạng`}>
          {'♥'.repeat(lives)}
          <span style={{ opacity: 0.25 }}>{'♥'.repeat(LIVES - lives)}</span>
        </span>
        <span>
          {score} điểm{streakNow >= 3 && <span className="combo"> 🔥 {streakNow}</span>}
        </span>
      </div>
      <div className="timer-line">
        <div style={{ width: `${flash ? 0 : (left / total) * 100}%` }} />
      </div>
      <div className="card play-card">
        <div className="fc-word">{round.word.word}</div>
        <div className="ipa">{round.word.ipa}</div>
        <div className="tf-meaning" style={flash ? { outline: `2px solid var(--${flash === 'right' ? 'right' : 'wrong'})` } : undefined}>
          {round.shown}
        </div>
        {flash === 'wrong' && <p className="muted small">Nghĩa đúng: {round.word.meaningVi}</p>}
        <div className="tf-buttons">
          <button type="button" className="btn" onClick={() => answer(true)}>
            <Check size={22} /> Đúng <kbd className="hide-sm">←</kbd>
          </button>
          <button type="button" className="btn danger" onClick={() => answer(false)}>
            <X size={22} /> Sai <kbd className="hide-sm">→</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
