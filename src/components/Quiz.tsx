import { useRef, useState, type FormEvent } from 'react';
import { CircleCheck, CircleX, Trophy } from 'lucide-react';
import { IconTile, ProgressBar, Prompt } from './ui';
import { saveQuizResult } from '../lib/progress';
import { checkFill } from '../lib/text';
import { DIFFICULTIES, DIFFICULTY_VI, type Difficulty, type Lesson } from '../types';

const XP_PER_CORRECT: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 5 };

interface Props {
  lesson: Lesson;
  difficulty: Difficulty;
  onExit: () => void;
  onNext: (difficulty: Difficulty) => void;
}

export default function Quiz({ lesson, difficulty, onExit, onNext }: Props) {
  const questions = lesson.quiz[difficulty];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<{ percent: number; xp: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = questions[index];

  const submit = (isRight: boolean) => {
    setChecked(true);
    if (isRight) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setTyped('');
      setChecked(false);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    const percent = Math.round((correct / questions.length) * 100);
    const xp = correct * XP_PER_CORRECT[difficulty];
    saveQuizResult(lesson.id, difficulty, percent, xp, {
      title: `Ngữ pháp · ${lesson.titleVi}`,
      detail: `Mức ${DIFFICULTY_VI[difficulty]} · ${correct}/${questions.length} câu đúng`,
    });
    setResult({ percent, xp });
  };

  if (result) {
    const harder = DIFFICULTIES[DIFFICULTIES.indexOf(difficulty) + 1];
    return (
      <div className="card summary">
        <IconTile tone="violet" size="lg">
          <Trophy size={30} />
        </IconTile>
        <h1>
          {correct}/{questions.length} câu đúng
        </h1>
        <p className="muted">
          Mức {DIFFICULTY_VI[difficulty]} · {result.percent}%
        </p>
        <p className="big-number">+{result.xp} XP</p>
        <div className="btn-row center">
          <button type="button" className="btn ghost" onClick={() => onNext(difficulty)}>
            Làm lại
          </button>
          {harder && (
            <button type="button" className="btn" onClick={() => onNext(harder)}>
              Thử mức {DIFFICULTY_VI[harder]}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onExit}>
            Về bài học
          </button>
        </div>
      </div>
    );
  }

  const isRight = q.type === 'mcq' ? picked === q.answer : checkFill(typed, q.answers);

  const onFill = (e: FormEvent) => {
    e.preventDefault();
    if (checked) next();
    else if (typed.trim()) submit(checkFill(typed, q.type === 'fill' ? q.answers : []));
  };

  return (
    <div className="quiz">
      <div className="study-head">
        <span className="muted small">
          Mức {DIFFICULTY_VI[difficulty]} · Câu {index + 1}/{questions.length}
        </span>
      </div>
      <ProgressBar value={index / questions.length} />

      <div className="card quiz-card">
        <p className="quiz-prompt">
          <Prompt text={q.prompt} fill={checked && q.type === 'fill' ? q.answers[0] : undefined} />
        </p>

        {q.type === 'mcq' ? (
          <div className="options">
            {q.options.map((opt, i) => {
              const state = !checked ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={i}
                  type="button"
                  className={`option ${state}`}
                  disabled={checked}
                  onClick={() => {
                    setPicked(i);
                    submit(i === q.answer);
                  }}
                >
                  <span className="option-key">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <form className="fill-form" onSubmit={onFill}>
            <input
              ref={inputRef}
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              readOnly={checked}
              placeholder="Gõ đáp án vào đây"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={checked ? (isRight ? 'right' : 'wrong') : ''}
              aria-label="Đáp án"
            />
            {!checked && (
              <button type="submit" className="btn" disabled={!typed.trim()}>
                Kiểm tra
              </button>
            )}
          </form>
        )}

        {checked && (
          <div className={`feedback ${isRight ? 'right' : 'wrong'}`}>
            <div className="feedback-title">
              {isRight ? <CircleCheck size={18} /> : <CircleX size={18} />}
              {isRight ? 'Chính xác!' : 'Chưa đúng'}
              {!isRight && q.type === 'fill' && <span> · Đáp án: {q.answers.join(' / ')}</span>}
            </div>
            <p>{q.explanationVi}</p>
          </div>
        )}
      </div>

      {checked && (
        <button type="button" className="btn wide" onClick={next} autoFocus={q.type === 'mcq'}>
          {index + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}
        </button>
      )}
    </div>
  );
}
