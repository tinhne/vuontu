import { useCallback, useEffect, useState } from 'react';
import { Timer, Zap } from 'lucide-react';
import GameOver, { type GameProps } from './GameOver';
import { ProgressBar } from '../components/ui';
import { words as allWords } from '../data';
import { saveGameResult } from '../lib/progress';
import { sample, shuffle } from '../lib/text';
import type { Word } from '../types';

const SECONDS = 60;

interface Round {
  word: Word;
  options: string[];
  answer: number;
}

function makeRound(pool: Word[], last?: Word): Round {
  const candidates = pool.length > 1 && last ? pool.filter((w) => w.id !== last.id) : pool;
  const word = sample(candidates, 1)[0];
  // Prefer distractors with the same part of speech so the answer isn't obvious from grammar alone.
  const others = shuffle(allWords.filter((w) => w.meaningVi !== word.meaningVi));
  const distractors: string[] = [];
  for (const w of [...others.filter((o) => o.pos === word.pos), ...others]) {
    if (!distractors.includes(w.meaningVi)) distractors.push(w.meaningVi);
    if (distractors.length === 3) break;
  }
  const options = shuffle([word.meaningVi, ...distractors]);
  return { word, options, answer: options.indexOf(word.meaningVi) };
}

export default function SpeedGame({ pool, gameId, onAgain }: GameProps) {
  const [round, setRound] = useState(() => makeRound(pool));
  const [deadline] = useState(() => Date.now() + SECONDS * 1000);
  const [left, setLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<{ index: number; right: boolean } | null>(null);
  const [result, setResult] = useState<{ record: boolean } | null>(null);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 200);
    return () => clearInterval(t);
  }, [deadline, result]);

  useEffect(() => {
    if (left === 0 && !result) setResult({ record: saveGameResult(gameId, score, score, { title: 'Tốc độ 60 giây', detail: `${score} từ đúng` }) });
  }, [left, result, gameId, score]);

  const choose = useCallback(
    (i: number) => {
      if (flash || result) return;
      const right = i === round.answer;
      setFlash({ index: i, right });
      if (right) {
        setScore((s) => s + 1);
        setCombo((c) => c + 1);
      } else {
        setCombo(0);
      }
      setTimeout(
        () => {
          setFlash(null);
          setRound((r) => makeRound(pool, r.word));
        },
        right ? 250 : 700,
      );
    },
    [flash, result, round, pool],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  if (result) {
    return <GameOver title={`${score} từ đúng`} detail={`trong ${SECONDS} giây`} xp={score} record={result.record} onAgain={onAgain} />;
  }

  return (
    <div>
      <div className="game-bar">
        <span>
          <Timer size={16} /> {left}s
        </span>
        <span>
          {score} điểm{combo >= 3 && <span className="combo"> <Zap size={14} /> x{combo}</span>}
        </span>
      </div>
      <ProgressBar value={left / SECONDS} />
      <div className="card play-card">
        <div className="fc-word">{round.word.word}</div>
        <div className="ipa">{round.word.ipa}</div>
        <div className="options">
          {round.options.map((opt, i) => {
            const state = !flash ? '' : i === round.answer ? 'right' : i === flash.index ? 'wrong' : 'dim';
            return (
              <button key={`${round.word.id}-${i}`} type="button" className={`option ${state}`} onClick={() => choose(i)}>
                <span className="option-key">{i + 1}</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
