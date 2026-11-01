import { Link } from 'react-router-dom';
import { Brain, Layers, Play, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { IconTile, StatTile, formatNumber } from './ui';
import { allWords, deckCounts } from '../lib/decks';
import { newLeftToday, useProgress } from '../lib/progress';
import { dayNumber } from '../lib/srs';

/** Today's review plan: what is due, how many new cards are left, and a button to start. */
export default function PlanCard() {
  const p = useProgress();
  const today = dayNumber();
  const counts = deckCounts(allWords(p), p, today);
  const newLeft = Math.min(newLeftToday(p, today), counts.fresh);
  const total = counts.learning + counts.due + newLeft;

  return (
    <section className="card plan">
      <IconTile tone="rose" size="lg">
        <Brain size={32} />
      </IconTile>
      <div className="plan-body">
        <h2>Kế hoạch ôn tập hôm nay</h2>
        <p>
          {total > 0
            ? `Hệ thống đã xếp ${total} thẻ cho bạn hôm nay: thẻ đến hạn trước, rồi tới từ mới.`
            : 'Bạn đã hoàn thành kế hoạch hôm nay. Có thể học thêm từ mới hoặc chơi trò chơi để ôn.'}
        </p>
      </div>
      <Link to={total ? '/study' : '/study?extra=10'} className={`btn lg ${total ? '' : 'ghost'}`}>
        {total ? <Play size={18} fill="currentColor" /> : <Layers size={18} />}
        {total ? `Ôn tập ngay (${total} thẻ)` : 'Học thêm từ mới'}
      </Link>
      <div className="grid cols-4 plan-stats" style={{ width: '100%' }}>
        <StatTile tone="rose" icon={<RotateCcw size={22} />} value={counts.learning} label="Đang học lại" />
        <StatTile tone="amber" icon={<Clock size={22} />} value={counts.due} label="Đến hạn ôn" />
        <StatTile tone="blue" icon={<Sparkles size={22} />} value={newLeft} label="Thẻ mới hôm nay" />
        <StatTile tone="emerald" icon={<Layers size={22} />} value={formatNumber(counts.total)} label="Tổng kho thẻ" />
      </div>
    </section>
  );
}
