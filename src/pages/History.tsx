import { BookOpen, Brain, CalendarDays, Flame, Gamepad2, GraduationCap, History as HistoryIcon, Layers, Trophy, Zap } from 'lucide-react';
import { Empty, IconTile, StatTile, formatNumber } from '../components/ui';
import { longestStreak, streak, useProgress, type LogKind } from '../lib/progress';
import { dayNumber } from '../lib/srs';
import type { Tone } from '../types';

const KIND: Record<LogKind, { tone: Tone; icon: typeof Brain }> = {
  study: { tone: 'rose', icon: Brain },
  practice: { tone: 'blue', icon: BookOpen },
  quiz: { tone: 'violet', icon: GraduationCap },
  game: { tone: 'amber', icon: Gamepad2 },
};

export function ActivityIcon({ kind }: { kind: LogKind }) {
  const { tone, icon: Icon } = KIND[kind] ?? KIND.study;
  return (
    <IconTile tone={tone} size="sm" soft>
      <Icon size={18} />
    </IconTile>
  );
}

const WEEKS = 26;

function when(t: number) {
  const d = new Date(t);
  const today = new Date();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Hôm nay, ${time}`;
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return `Hôm qua, ${time}`;
  return `${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}, ${time}`;
}

export default function History() {
  const p = useProgress();
  const today = dayNumber();
  const studyDays = Object.values(p.days).filter((x) => x > 0).length;
  const totalReviews = Object.values(p.reviews).reduce((a, b) => a + b, 0);

  // Heatmap columns are weeks (Monday first), the last column ends with this week.
  const todayDow = (new Date(today * 86_400_000).getUTCDay() + 6) % 7;
  const start = today - todayDow - (WEEKS - 1) * 7;
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const day = start + i;
    const xp = p.days[String(day)] ?? 0;
    const level = xp === 0 ? 0 : xp < 20 ? 1 : xp < 50 ? 2 : xp < 100 ? 3 : 4;
    return { day, xp, level, future: day > today };
  });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = today - 13 + i;
    return { day, xp: p.days[String(day)] ?? 0, cards: p.reviews[String(day)] ?? 0 };
  });
  const max14 = Math.max(10, ...last14.map((d) => d.xp));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Lịch sử học</h1>
          <p>Mỗi ô là một ngày, càng xanh đậm là càng nhiều XP. Giữ chuỗi ngày học để vườn luôn xanh.</p>
        </div>
      </div>

      <div className="grid cols-4">
        <StatTile tone="emerald" icon={<Zap size={22} />} value={formatNumber(p.xp)} label="tổng XP" />
        <StatTile tone="orange" icon={<Flame size={22} />} value={`${streak(p, today)} / ${longestStreak(p)}`} label="chuỗi hiện tại / dài nhất" />
        <StatTile tone="blue" icon={<CalendarDays size={22} />} value={studyDays} label="ngày đã học" />
        <StatTile tone="violet" icon={<Layers size={22} />} value={formatNumber(totalReviews)} label="lượt ôn flashcard" />
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>6 tháng gần đây</h3>
        <div className="heatmap-wrap">
          <div className="heatmap" role="img" aria-label="Lịch học 26 tuần gần đây">
            {cells.map((c) => (
              <span
                key={c.day}
                className={`heat l${c.level} ${c.future ? 'future' : ''}`}
                title={`${new Date(c.day * 86_400_000).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}: ${c.xp} XP`}
              />
            ))}
          </div>
        </div>
        <div className="heat-legend">
          Ít <span className="heat" /> <span className="heat l1" /> <span className="heat l2" /> <span className="heat l3" /> <span className="heat l4" /> Nhiều
        </div>
      </section>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>XP 14 ngày qua</h3>
          <div className="week-chart" style={{ gridTemplateColumns: 'repeat(14, 1fr)', height: 150 }}>
            {last14.map((d) => (
              <div key={d.day} className={`week-bar ${d.xp ? 'on' : ''} ${d.day === today ? 'today' : ''}`} title={`${d.xp} XP · ${d.cards} thẻ`}>
                <div style={{ height: `${Math.max(3, (d.xp / max14) * 100)}%` }} />
                <span>{new Date(d.day * 86_400_000).getUTCDate()}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h3>Thành tích</h3>
          <ul className="timeline">
            {Object.entries(p.games).length === 0 && <li className="muted">Chơi một trò để có kỷ lục đầu tiên.</li>}
            {Object.entries(p.games).map(([id, score]) => (
              <li key={id}>
                <IconTile tone="amber" size="sm" soft>
                  <Trophy size={18} />
                </IconTile>
                <div className="grow">
                  <b>{{ match: 'Ghép đôi', scramble: 'Xếp chữ', speed: 'Tốc độ 60 giây', truefalse: 'Đúng hay Sai?', dictation: 'Nghe chép' }[id] ?? id}</b>
                </div>
                <span className="xp-plus">
                  {score} {id === 'match' ? 'giây' : 'điểm'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="section-head">
        <h2>Hoạt động gần đây</h2>
      </div>
      {p.log.length === 0 ? (
        <Empty icon={<HistoryIcon size={24} />}>Chưa có hoạt động nào. Các phiên ôn tập, bài kiểm tra và trò chơi sẽ hiện ở đây.</Empty>
      ) : (
        <div className="card">
          <ul className="timeline">
            {p.log.slice(0, 50).map((e) => (
              <li key={e.t}>
                <ActivityIcon kind={e.kind} />
                <div className="grow">
                  <b>{e.title}</b>
                  <span className="muted small">
                    {when(e.t)} · {e.detail}
                  </span>
                </div>
                {e.xp > 0 && <span className="xp-plus">+{e.xp} XP</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
