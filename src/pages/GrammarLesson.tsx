import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleX, CircleCheck, Lightbulb } from 'lucide-react';
import Quiz from '../components/Quiz';
import { RichText, SpeakButton } from '../components/ui';
import { lessonById, lessons } from '../data';
import { PASS_PERCENT, useProgress } from '../lib/progress';
import { CEFR_NAMES, DIFFICULTIES, DIFFICULTY_VI, type Difficulty } from '../types';

export default function GrammarLesson() {
  const { lessonId = '' } = useParams();
  return <LessonView key={lessonId} lessonId={lessonId} />;
}

function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = lessonById.get(lessonId);
  const p = useProgress();
  const [quiz, setQuiz] = useState<Difficulty | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (!lesson) return <Navigate to="/grammar" replace />;

  const index = lessons.indexOf(lesson);
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const scores = p.grammar[lesson.id] ?? {};

  if (quiz) {
    return (
      <div className="page narrow">
        <button type="button" className="back" onClick={() => setQuiz(null)}>
          <ChevronLeft size={18} /> {lesson.titleVi}
        </button>
        <Quiz
          key={attempt}
          lesson={lesson}
          difficulty={quiz}
          onExit={() => setQuiz(null)}
          onNext={(d) => {
            setQuiz(d);
            setAttempt((a) => a + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="page narrow">
      <Link to="/grammar" className="back">
        <ChevronLeft size={18} /> Ngữ pháp
      </Link>

      <header className="lesson-head">
        <span className={`tag cefr cefr-${lesson.level}`}>
          {lesson.level} · {CEFR_NAMES[lesson.level]}
        </span>
        <h1>{lesson.titleVi}</h1>
        <p className="muted">{lesson.titleEn}</p>
        <p className="lesson-summary">{lesson.summaryVi}</p>
      </header>

      {lesson.sections.map((s, i) => (
        <section key={i} className="card lesson-section">
          <h2>{s.headingVi}</h2>
          <RichText text={s.bodyVi} />
          {s.examples.length > 0 && (
            <ul className="examples">
              {s.examples.map((ex, k) => (
                <li key={k}>
                  <div className="example-en">
                    {ex.en} <SpeakButton text={ex.en} label="Nghe câu ví dụ" />
                  </div>
                  <div className="example-vi">{ex.vi}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {lesson.mistakes.length > 0 && (
        <section className="card lesson-section">
          <h2>
            <Lightbulb size={20} className="accent" /> Lỗi hay gặp
          </h2>
          <ul className="mistakes">
            {lesson.mistakes.map((m, i) => (
              <li key={i}>
                <div className="wrong">
                  <CircleX size={16} /> {m.wrong}
                </div>
                <div className="right">
                  <CircleCheck size={16} /> {m.right}
                </div>
                <div className="muted small">{m.noteVi}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card lesson-section">
        <h2>Kiểm tra</h2>
        <p className="muted">Đạt từ {PASS_PERCENT}% ở cả 3 mức để hoàn thành bài.</p>
        <div className="quiz-picker">
          {DIFFICULTIES.map((d) => {
            const s = scores[d];
            return (
              <button key={d} type="button" className={`quiz-pick ${s !== undefined && s >= PASS_PERCENT ? 'pass' : ''}`} onClick={() => setQuiz(d)}>
                <b>{DIFFICULTY_VI[d]}</b>
                <span>{lesson.quiz[d].length} câu</span>
                <span className="muted small">{s === undefined ? 'Chưa làm' : `Cao nhất ${s}%`}</span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="lesson-nav">
        {prev ? (
          <Link to={`/grammar/${prev.id}`} className="btn ghost">
            <ChevronLeft size={18} /> {prev.titleVi}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/grammar/${next.id}`} className="btn ghost">
            {next.titleVi} <ChevronRight size={18} />
          </Link>
        )}
      </nav>
    </div>
  );
}
