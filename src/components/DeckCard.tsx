import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { IconTile, ProgressBar, formatNumber } from './ui';
import type { DeckCounts, DeckInfo } from '../lib/decks';

export function Counts({ counts }: { counts: DeckCounts }) {
  return (
    <div className="counts">
      <span className="c-learning" title="Đang học lại">
        <i />
        {counts.learning}
      </span>
      <span className="c-due" title="Đến hạn ôn">
        <i />
        {counts.due}
      </span>
      <span className="c-new" title="Chưa học">
        <i />
        {formatNumber(counts.fresh)}
      </span>
      <span className="total">· {formatNumber(counts.total)} từ</span>
    </div>
  );
}

/** A deck tile: opens the deck, and the round button starts studying it right away. */
export default function DeckCard({ info, counts, to }: { info: DeckInfo; counts: DeckCounts; to?: string }) {
  const navigate = useNavigate();
  const learned = counts.total - counts.fresh;
  return (
    <Link to={to ?? `/deck/${info.id}`} className={`deck-card tone-${info.tone}`}>
      <IconTile tone={info.tone}>{info.icon}</IconTile>
      <div className="deck-card-body">
        <h3>{info.title}</h3>
        <p className="muted">{info.subtitle}</p>
        <Counts counts={counts} />
        {counts.total > 0 && <ProgressBar value={learned / counts.total} className="mini-progress" label={`Đã học ${learned}/${counts.total}`} />}
      </div>
      <button
        type="button"
        className="play"
        aria-label={`Ôn tập ${info.title}`}
        title="Ôn tập ngay"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/study?deck=${encodeURIComponent(info.id)}`);
        }}
      >
        <Play size={18} fill="currentColor" />
      </button>
    </Link>
  );
}
