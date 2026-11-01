import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Lightbulb, Snail, Volume2 } from 'lucide-react';
import GameOver, { type GameProps } from './GameOver';
import { ProgressBar } from '../components/ui';
import { saveGameResult } from '../lib/progress';
import { speak } from '../lib/speech';
import { normalizeAnswer, sample } from '../lib/text';

const ROUNDS = 10;

export default function DictationGame({ pool, gameId, onAgain }: GameProps) {
  const rounds = useMemo(() => sample(pool, ROUNDS), [pool]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ record: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const word = rounds[index];
  const right = normalizeAnswer(typed) === word.word;

  useEffect(() => {
    const t = setTimeout(() => speak(word.word), 300);
    return () => clearTimeout(t);
  }, [word]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!checked) {
      if (!typed.trim()) return;
      setChecked(true);
      if (right) setScore((s) => s + (showMeaning ? 2 : 3));
      return;
    }
    if (index + 1 >= rounds.length) {
      setResult({ record: saveGameResult(gameId, score, score, { title: 'Nghe chép', detail: `${score} điểm · ${rounds.length} từ` }) });
      return;
    }
    setIndex(index + 1);
    setTyped('');
    setChecked(false);
    setShowMeaning(false);
    inputRef.current?.focus();
  };

  if (result) {
    return <GameOver title={`${score} điểm`} detail={`${rounds.length} từ · đúng chính tả được 3 điểm`} xp={score} record={result.record} onAgain={onAgain} />;
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
        <div className="btn-row center">
          <button type="button" className="btn big-round" onClick={() => speak(word.word)} aria-label="Nghe lại">
            <Volume2 size={32} />
          </button>
          <button type="button" className="btn ghost big-round" onClick={() => speak(word.word, true)} aria-label="Nghe chậm">
            <Snail size={28} />
          </button>
        </div>

        {showMeaning || checked ? (
          <p className="meaning center">{word.meaningVi}</p>
        ) : (
          <button type="button" className="btn ghost small" onClick={() => setShowMeaning(true)}>
            <Lightbulb size={16} /> Xem nghĩa (gợi ý)
          </button>
        )}

        <form onSubmit={submit} className="fill-form">
          <input
            ref={inputRef}
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={checked}
            placeholder="Gõ từ bạn nghe được"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={checked ? (right ? 'right' : 'wrong') : ''}
            aria-label="Từ bạn nghe được"
          />
          <button type="submit" className="btn">
            {checked ? 'Tiếp' : 'Kiểm tra'}
          </button>
        </form>

        {checked && (
          <p className={`feedback ${right ? 'right' : 'wrong'}`}>
            {right ? 'Chính xác! ' : 'Đáp án: '}
            <b>{word.word}</b> <span className="ipa">{word.ipa}</span>
          </p>
        )}
      </div>
    </div>
  );
}
