import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Gamepad2, GraduationCap, Layers, Library, Sparkles, Target, Trophy } from 'lucide-react';
import Tree from '../components/Tree';
import PlanCard from '../components/PlanCard';
import { ActivityIcon } from './History';
import { IconTile, ProgressBar, Ring, StatTile, formatNumber } from '../components/ui';
import { lessons, words } from '../data';
import { lessonStatus, streak, useProgress } from '../lib/progress';
import { dayNumber, mastery } from '../lib/srs';
import { stageFor } from '../lib/xp';
import { CEFR_NAMES } from '../types';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function Home() {
  const p = useProgress();
  const today = dayNumber();
  const todayXp = p.days[String(today)] ?? 0;
  const days = streak(p, today);
  const { index, stage, next, progress } = stageFor(p.xp);
  const cards = Object.values(p.cards);
  const mastered = cards.filter((c) => mastery(c) === 'mastered').length;
  const nextLesson = lessons.find((l) => lessonStatus(p.grammar[l.id]) !== 'done');
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i;
    const date = new Date(day * 86_400_000);
    return { day, xp: p.days[String(day)] ?? 0, label: WEEKDAYS[date.getUTCDay()] };
  });
  const weekMax = Math.max(p.settings.dailyGoal, ...week.map((d) => d.xp));
  const weekTotal = week.reduce((s, d) => s + d.xp, 0);

  return (
    <div className="page">
      <section className="card hero">
        <div className="hero-tree">
          <Tree stage={index} size={170} />
        </div>
        <div className="hero-body">
          <p className="eyebrow">
            {greeting()}, {p.settings.name || 'bạn'}!
          </p>
          <h1>
            Cây của bạn đang ở giai đoạn <span className="accent">{stage.name}</span>
          </h1>
          <p className="muted">{stage.hint}</p>
          <div className="xp-line">
            <ProgressBar value={progress} label="Tiến độ tới giai đoạn tiếp theo" />
            <span className="muted small">{next ? `${formatNumber(p.xp)} / ${formatNumber(next.min)} XP để lên “${next.name}”` : `${formatNumber(p.xp)} XP`}</span>
          </div>
        </div>
        <Ring value={todayXp / p.settings.dailyGoal}>
          <b>{todayXp}</b>
          <span>/ {p.settings.dailyGoal} XP</span>
        </Ring>
      </section>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <StatTile tone="orange" icon={<Flame size={22} />} value={days} label="ngày liên tiếp" />
        <StatTile tone="emerald" icon={<Target size={22} />} value={`${Math.min(100, Math.round((todayXp / p.settings.dailyGoal) * 100))}%`} label="mục tiêu hôm nay" />
        <StatTile tone="blue" icon={<Layers size={22} />} value={formatNumber(cards.length)} label={`/ ${formatNumber(words.length)} từ đã học`} />
        <StatTile tone="violet" icon={<Sparkles size={22} />} value={formatNumber(mastered)} label="từ thuộc lòng" />
      </div>

      <div style={{ marginTop: 16 }}>
        <PlanCard />
      </div>

      <div className="section-head">
        <h2>Học gì tiếp?</h2>
      </div>
      <div className="grid cols-2">
        <Link to="/vocab" className="card action tone-blue">
          <IconTile tone="blue">
            <Library size={24} />
          </IconTile>
          <div>
            <h3>Kho từ vựng</h3>
            <p>{formatNumber(words.length)} từ theo 6 trình độ CEFR và 23 chủ đề IELTS</p>
          </div>
          <ArrowRight className="action-arrow" />
        </Link>
        <Link to={nextLesson ? `/grammar/${nextLesson.id}` : '/grammar'} className="card action tone-violet">
          <IconTile tone="violet">
            <GraduationCap size={24} />
          </IconTile>
          <div>
            <h3>{nextLesson ? 'Bài ngữ pháp tiếp theo' : 'Ngữ pháp CEFR'}</h3>
            <p>{nextLesson ? `${nextLesson.level} ${CEFR_NAMES[nextLesson.level]} · ${nextLesson.titleVi}` : `Đã hoàn thành ${lessons.length} bài`}</p>
          </div>
          <ArrowRight className="action-arrow" />
        </Link>
        <Link to="/games" className="card action tone-amber">
          <IconTile tone="amber">
            <Gamepad2 size={24} />
          </IconTile>
          <div>
            <h3>Trò chơi</h3>
            <p>5 trò: ghép đôi, xếp chữ, tốc độ, đúng/sai, nghe chép</p>
          </div>
          <ArrowRight className="action-arrow" />
        </Link>
        <Link to="/decks" className="card action tone-pink">
          <IconTile tone="pink">
            <Layers size={24} />
          </IconTile>
          <div>
            <h3>Bộ thẻ cá nhân</h3>
            <p>{Object.keys(p.decks).length ? `${Object.keys(p.decks).length} bộ thẻ của bạn` : 'Tự tạo bộ thẻ hoặc nhập từ file CSV'}</p>
          </div>
          <ArrowRight className="action-arrow" />
        </Link>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="row">
            <h3 style={{ margin: 0 }}>7 ngày qua</h3>
            <span className="spacer" />
            <span className="chip tone-emerald">{formatNumber(weekTotal)} XP</span>
          </div>
          <div className="week-chart" role="img" aria-label="XP mỗi ngày trong 7 ngày qua">
            {week.map((d) => (
              <div key={d.day} className={`week-bar ${d.xp > 0 ? 'on' : ''} ${d.day === today ? 'today' : ''}`} title={`${d.xp} XP`}>
                <div style={{ height: `${Math.max(4, (d.xp / weekMax) * 100)}%` }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="row">
            <h3 style={{ margin: 0 }}>Hoạt động gần đây</h3>
            <span className="spacer" />
            <Link to="/history" className="btn ghost sm">
              Xem tất cả
            </Link>
          </div>
          {p.log.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>
              <Trophy size={16} style={{ verticalAlign: -3 }} /> Chưa có hoạt động nào. Bắt đầu một phiên ôn tập nhé!
            </p>
          ) : (
            <ul className="timeline" style={{ marginTop: 8 }}>
              {p.log.slice(0, 4).map((e) => (
                <li key={e.t}>
                  <ActivityIcon kind={e.kind} />
                  <div className="grow">
                    <b>{e.title}</b>
                    <span className="muted small">{e.detail}</span>
                  </div>
                  {e.xp > 0 && <span className="xp-plus">+{e.xp} XP</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
