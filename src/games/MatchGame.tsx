import { useEffect, useMemo, useState } from 'react';
import { Timer } from 'lucide-react';
import GameOver, { type GameProps } from './GameOver';
import { getProgress, saveGameResult } from '../lib/progress';
import { speak } from '../lib/speech';
import { sample, shuffle } from '../lib/text';
import type { Word } from '../types';

const PAIRS = 6;

/** Picks words whose meanings are all different so every pair is unambiguous. */
function pickWords(pool: Word[]): Word[] {
  const picked: Word[] = [];
  for (const w of shuffle(pool)) {
    if (!picked.some((p) => p.meaningVi === w.meaningVi || p.word === w.word)) picked.push(w);
    if (picked.length === PAIRS) break;
  }
  return picked;
}

export default function MatchGame({ pool, gameId, onAgain }: GameProps) {
  const words = useMemo(() => pickWords(pool), [pool]);
  const left = useMemo(() => sample(words, words.length), [words]);
  const right = useMemo(() => sample(words, words.length), [words]);
  const [selected, setSelected] = useState<{ side: 'en' | 'vi'; id: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [start] = useState(Date.now);
  const [now, setNow] = useState(Date.now);
  const [result, setResult] = useState<{ seconds: number; xp: number; record: boolean } | null>(null);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [result]);

  const choose = (side: 'en' | 'vi', id: string) => {
    if (matched.has(id) || result) return;
    if (side === 'en' && getProgress().settings.autoSpeak) speak(words.find((w) => w.id === id)!.word);
    if (!selected || selected.side === side) {
      setSelected({ side, id });
      return;
    }
    if (selected.id === id) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelected(null);
      if (next.size === words.length) {
        const seconds = Math.round((Date.now() - start) / 1000);
        const xp = words.length + 5 - Math.min(5, mistakes);
        const record = saveGameResult(gameId, seconds, xp, { title: 'Ghép đôi', detail: `${words.length} cặp · ${seconds} giây · ${mistakes} lần nhầm`, lowerIsBetter: true });
        setResult({ seconds, xp, record });
      }
    } else {
      setMistakes((m) => m + 1);
      setWrong([`${selected.side}-${selected.id}`, `${side}-${id}`]);
      setSelected(null);
      setTimeout(() => setWrong([]), 500);
    }
  };

  if (result) {
    return (
      <GameOver
        title={`Hoàn thành trong ${result.seconds} giây`}
        detail={`${words.length} cặp · ${mistakes} lần nhầm`}
        xp={result.xp}
        record={result.record}
        onAgain={onAgain}
      />
    );
  }

  const cell = (side: 'en' | 'vi', w: Word) => {
    const state = matched.has(w.id)
      ? 'matched'
      : wrong.includes(`${side}-${w.id}`)
        ? 'wrong'
        : selected?.side === side && selected.id === w.id
          ? 'selected'
          : '';
    return (
      <button key={`${side}-${w.id}`} type="button" className={`match-cell ${state}`} onClick={() => choose(side, w.id)} disabled={matched.has(w.id)}>
        {side === 'en' ? w.word : w.meaningVi}
      </button>
    );
  };

  return (
    <div>
      <div className="game-bar">
        <span>
          {matched.size}/{words.length} cặp
        </span>
        <span>
          <Timer size={16} /> {Math.floor((now - start) / 1000)}s
        </span>
      </div>
      <div className="match-grid">
        <div className="match-col">{left.map((w) => cell('en', w))}</div>
        <div className="match-col">{right.map((w) => cell('vi', w))}</div>
      </div>
    </div>
  );
}
