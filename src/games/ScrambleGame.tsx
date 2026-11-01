import { useEffect, useMemo, useState } from 'react';
import { Delete, Lightbulb, SkipForward } from 'lucide-react';
import GameOver, { type GameProps } from './GameOver';
import { ProgressBar, SpeakButton } from '../components/ui';
import { saveGameResult } from '../lib/progress';
import { speak } from '../lib/speech';
import { sample, shuffle } from '../lib/text';
import { POS_VI } from '../types';

const ROUNDS = 10;

function scramble(word: string): string[] {
  const letters = word.split('');
  for (let tries = 0; tries < 10; tries++) {
    const mixed = shuffle(letters);
    if (mixed.join('') !== word) return mixed;
  }
  return letters.reverse();
}

export default function ScrambleGame({ pool, gameId, onAgain }: GameProps) {
  const rounds = useMemo(() => {
    const singles = pool.filter((w) => /^[a-z]{3,12}$/.test(w.word));
    return sample(singles.length >= 3 ? singles : pool, ROUNDS);
  }, [pool]);
  const [index, setIndex] = useState(0);
  const word = rounds[index];
  const target = word?.word ?? '';
  const [tiles, setTiles] = useState(() => scramble(target));
  const [placed, setPlaced] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState<'playing' | 'right' | 'wrong' | 'skipped'>('playing');
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ xp: number; record: boolean } | null>(null);

  const answer = placed.map((i) => tiles[i]).join('');

  useEffect(() => {
    if (status !== 'playing' || answer.length !== target.length) return;
    if (answer === target) {
      setStatus('right');
      setScore((s) => s + (hints ? 1 : 3));
      speak(target);
    } else {
      setStatus('wrong');
      const t = setTimeout(() => setStatus('playing'), 600);
      return () => clearTimeout(t);
    }
  }, [answer, target, status, hints]);

  const next = () => {
    if (index + 1 >= rounds.length) {
      const record = saveGameResult(gameId, score, score, { title: 'Xếp chữ', detail: `${score} điểm · ${rounds.length} từ` });
      setResult({ xp: score, record });
      return;
    }
    const w = rounds[index + 1].word;
    setIndex(index + 1);
    setTiles(scramble(w));
    setPlaced([]);
    setHints(0);
    setStatus('playing');
  };

  useEffect(() => {
    if (status !== 'right' && status !== 'skipped') return;
    const t = setTimeout(next, status === 'right' ? 1100 : 1800);
    return () => clearTimeout(t);
  });

  useEffect(() => {
    if (status !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Backspace') {
        setPlaced((p) => p.slice(0, -1));
        return;
      }
      const key = e.key.toLowerCase();
      const i = tiles.findIndex((ch, k) => ch === key && !placed.includes(k));
      if (i !== -1) setPlaced([...placed, i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, tiles, placed]);

  const hint = () => {
    // Rebuild the answer as the correct prefix plus one more correct letter.
    const prefixLen = [...answer].findIndex((ch, i) => ch !== target[i]);
    const keep = prefixLen === -1 ? placed.length : prefixLen;
    const used = new Set(placed.slice(0, keep));
    const nextIdx = tiles.findIndex((ch, i) => !used.has(i) && ch === target[keep]);
    if (nextIdx === -1) return;
    setPlaced([...placed.slice(0, keep), nextIdx]);
    setHints((h) => h + 1);
  };

  if (result) {
    return <GameOver title={`${score} điểm`} detail={`${rounds.length} từ · đúng không cần gợi ý được 3 điểm`} xp={result.xp} record={result.record} onAgain={onAgain} />;
  }

  return (
    <div>
      <div className="game-bar">
        <span>
          Từ {index + 1}/{rounds.length}
        </span>
        <span>{score} điểm</span>
      </div>
      <ProgressBar value={index / rounds.length} />

      <div className="card play-card">
        <p className="meaning">{word.meaningVi}</p>
        <p className="muted small">
          {POS_VI[word.pos]} · {word.cefr} · {target.length} chữ cái
        </p>

        <div className={`answer-slots ${status}`}>
          {target.split('').map((_, i) => (
            <button
              key={i}
              type="button"
              className="slot"
              disabled={status !== 'playing' || placed[i] === undefined}
              onClick={() => setPlaced(placed.slice(0, i))}
              aria-label={placed[i] === undefined ? 'Ô trống' : `Bỏ chữ ${tiles[placed[i]]}`}
            >
              {status === 'skipped' ? target[i] : placed[i] === undefined ? '' : tiles[placed[i]]}
            </button>
          ))}
        </div>

        <div className="tiles">
          {tiles.map((ch, i) => (
            <button key={i} type="button" className="tile" disabled={placed.includes(i) || status !== 'playing'} onClick={() => setPlaced([...placed, i])}>
              {ch}
            </button>
          ))}
        </div>

        {status === 'right' && (
          <p className="feedback right">
            Chính xác! <b>{target}</b> <span className="ipa">{word.ipa}</span>
          </p>
        )}
        {status === 'skipped' && (
          <p className="feedback wrong">
            Đáp án: <b>{target}</b> <SpeakButton text={target} />
          </p>
        )}

        <div className="btn-row center">
          <button type="button" className="btn ghost small" onClick={() => setPlaced(placed.slice(0, -1))} disabled={!placed.length || status !== 'playing'}>
            <Delete size={16} /> Xoá
          </button>
          <button type="button" className="btn ghost small" onClick={hint} disabled={status !== 'playing'}>
            <Lightbulb size={16} /> Gợi ý
          </button>
          <button type="button" className="btn ghost small" onClick={() => setStatus('skipped')} disabled={status !== 'playing'}>
            <SkipForward size={16} /> Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
