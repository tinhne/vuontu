import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  GraduationCap,
  History,
  House,
  Layers,
  Library,
  Menu,
  Moon,
  Search,
  Settings,
  Sprout,
  Star,
  Sun,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { lessons, words } from '../data';
import { dueWordIds, newLeftToday, streak, updateSettings, useProgress } from '../lib/progress';
import { dayNumber } from '../lib/srs';
import { useTheme } from '../lib/theme';
import { formatNumber } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number | string;
  hot?: boolean;
}

const TITLES: [RegExp, string, LucideIcon][] = [
  [/^\/$/, 'Trang chủ', House],
  [/^\/vocab/, 'Kho từ vựng', Library],
  [/^\/deck\/starred/, 'Từ đã lưu', Star],
  [/^\/deck\/custom/, 'Bộ thẻ cá nhân', Layers],
  [/^\/deck/, 'Kho từ vựng', Library],
  [/^\/decks/, 'Bộ thẻ cá nhân', Layers],
  [/^\/review/, 'Ôn ngắt quãng', Brain],
  [/^\/study/, 'Phiên ôn tập', Brain],
  [/^\/practice/, 'Luyện flashcard', BookOpen],
  [/^\/grammar/, 'Ngữ pháp CEFR', GraduationCap],
  [/^\/games/, 'Trò chơi', Gamepad2],
  [/^\/lookup/, 'Tra từ điển', Search],
  [/^\/history/, 'Lịch sử học', History],
  [/^\/settings/, 'Cài đặt', Settings],
];

export default function Layout() {
  const p = useProgress();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const today = dayNumber();
  const days = streak(p, today);
  const todayCards = useMemo(() => dueWordIds(p, today).length + newLeftToday(p, today), [p, today]);
  const [, title, TitleIcon] = TITLES.find(([re]) => re.test(pathname)) ?? TITLES[0];

  useEffect(() => setOpen(false), [pathname]);

  const groups: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { to: '/', label: 'Trang chủ', icon: House, end: true },
        { to: '/vocab', label: 'Kho từ vựng', icon: Library, badge: formatNumber(words.length) },
        { to: '/grammar', label: 'Ngữ pháp CEFR', icon: GraduationCap, badge: lessons.length },
      ],
    },
    {
      label: 'Luyện tập',
      items: [
        { to: '/review', label: 'Ôn ngắt quãng', icon: Brain, badge: todayCards || undefined, hot: todayCards > 0 },
        { to: '/practice', label: 'Luyện flashcard', icon: BookOpen },
        { to: '/games', label: 'Trò chơi', icon: Gamepad2, badge: 5 },
        { to: '/lookup', label: 'Tra từ điển', icon: Search },
        { to: '/history', label: 'Lịch sử học', icon: History },
      ],
    },
    {
      label: 'Của tôi',
      items: [
        { to: '/decks', label: 'Bộ thẻ cá nhân', icon: Layers, badge: Object.keys(p.decks).length },
        { to: '/deck/starred', label: 'Từ đã lưu', icon: Star, badge: Object.keys(p.starred).length },
      ],
    },
  ];

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Sprout size={20} />
          </span>
          <span>
            Vườn Từ
            <small>IELTS · CEFR A1–C2</small>
          </span>
        </Link>
        {groups.map((g, i) => (
          <nav key={i} aria-label={g.label ?? 'Chính'}>
            {g.label && <div className="side-label">{g.label}</div>}
            {g.items.map(({ to, label, icon: Icon, end, badge, hot }) => (
              <NavLink key={to} to={to} end={end} className="side-link">
                <Icon size={18} />
                {label}
                {badge !== undefined && <span className={`badge ${hot ? 'hot' : ''}`}>{badge}</span>}
              </NavLink>
            ))}
          </nav>
        ))}
        <div style={{ height: 16 }} />
        <div className="side-profile">
          <span className="avatar">{(p.settings.name.trim()[0] ?? 'H').toUpperCase()}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>{p.settings.name || 'Học viên'}</b>
            <span>
              {formatNumber(p.xp)} XP · 🔥 {days}
            </span>
          </div>
          <NavLink to="/settings" className="icon-btn" aria-label="Cài đặt">
            <Settings size={18} />
          </NavLink>
        </div>
      </aside>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn boxed menu-btn" onClick={() => setOpen(true)} aria-label="Mở menu">
            <Menu size={20} />
          </button>
          <div className="nav-pair">
            <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => navigate(1)} aria-label="Tiến tới">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="topbar-title">
            <TitleIcon size={20} />
            <span>{title}</span>
          </div>
          <div className="topbar-right">
            <span className="chip tone-orange" title="Chuỗi ngày học">
              <Flame size={14} /> {days}
              <span className="chip-xp-label"> ngày</span>
            </span>
            <span className="chip tone-emerald" title="Tổng XP">
              {formatNumber(p.xp)}
              <span className="chip-xp-label"> XP</span>
            </span>
            <button
              type="button"
              className="icon-btn boxed"
              onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title="Đổi giao diện sáng / tối"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Điều hướng nhanh">
        {[
          { to: '/', label: 'Trang chủ', icon: House, end: true },
          { to: '/review', label: 'Ôn tập', icon: Brain },
          { to: '/vocab', label: 'Từ vựng', icon: Library },
          { to: '/games', label: 'Trò chơi', icon: Gamepad2 },
          { to: '/lookup', label: 'Tra từ', icon: Search },
        ].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab-link">
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
