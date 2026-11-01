import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { Empty, IconTile, ProgressBar } from '../components/ui';
import { lessons } from '../data';
import { lessonStatus, PASS_PERCENT, useProgress } from '../lib/progress';
import { CEFR_LEVELS, CEFR_NAMES, DIFFICULTIES, DIFFICULTY_VI, type Cefr, type Tone } from '../types';

const LEVEL_TONE: Record<Cefr, Tone> = { A1: 'emerald', A2: 'emerald', B1: 'blue', B2: 'blue', C1: 'violet', C2: 'violet' };

export default function Grammar() {
  const p = useProgress();
  const done = lessons.filter((l) => lessonStatus(p.grammar[l.id]) === 'done').length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ngữ pháp CEFR A1–C2</h1>
          <p>Mỗi bài có lý thuyết ngắn gọn, lỗi người Việt hay mắc và bài kiểm tra 3 mức Dễ / Vừa / Khó. Đạt từ {PASS_PERCENT}% cả 3 mức để hoàn thành bài.</p>
        </div>
        <div style={{ minWidth: 220 }}>
          <span className="muted small">
            Hoàn thành {done}/{lessons.length} bài
          </span>
          <ProgressBar value={lessons.length ? done / lessons.length : 0} label="Tiến độ ngữ pháp" />
        </div>
      </div>

      {lessons.length === 0 && <Empty>Bài ngữ pháp đang được cập nhật.</Empty>}

      {CEFR_LEVELS.map((level) => {
        const items = lessons.filter((l) => l.level === level);
        if (items.length === 0) return null;
        const levelDone = items.filter((l) => lessonStatus(p.grammar[l.id]) === 'done').length;
        return (
          <section key={level}>
            <div className="level-head">
              <IconTile tone={LEVEL_TONE[level]} size="sm">
                {level}
              </IconTile>
              <h2>{CEFR_NAMES[level]}</h2>
              <span className="muted small">
                {levelDone}/{items.length} bài
              </span>
            </div>
            <div className="grid cols-2">
              {items.map((l) => {
                const scores = p.grammar[l.id];
                const status = lessonStatus(scores);
                return (
                  <Link key={l.id} to={`/grammar/${l.id}`} className={`lesson-card tone-${LEVEL_TONE[level]}`}>
                    <span className={`lesson-num ${status}`}>{status === 'done' ? <CircleCheck size={18} /> : l.order}</span>
                    <span className="lesson-card-body">
                      <b>{l.titleVi}</b>
                      <span className="muted small">{l.titleEn}</span>
                      <span className="score-pills">
                        {DIFFICULTIES.map((d) => {
                          const s = scores?.[d];
                          return (
                            <span key={d} className={`score-pill ${s === undefined ? '' : s >= PASS_PERCENT ? 'pass' : 'tried'}`} title={`${DIFFICULTY_VI[d]}: ${s ?? '–'}%`}>
                              {DIFFICULTY_VI[d]}
                              {s !== undefined && ` ${s}%`}
                            </span>
                          );
                        })}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
