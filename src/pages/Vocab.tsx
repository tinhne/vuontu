import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Layers, Library, Search, Sparkles, Tags } from 'lucide-react';
import DeckCard from '../components/DeckCard';
import { Empty, Segmented, StatTile, formatNumber } from '../components/ui';
import { topics, words } from '../data';
import { deckCounts, deckInfo, deckWords, levelDeckIds, topicDeckIds } from '../lib/decks';
import { useProgress } from '../lib/progress';
import { dayNumber, mastery } from '../lib/srs';
import { foldVi } from '../lib/text';

type Tab = 'level' | 'topic';

export default function Vocab() {
  const p = useProgress();
  const today = dayNumber();
  const [tab, setTab] = useState<Tab>('level');
  const [query, setQuery] = useState('');
  const q = foldVi(useDeferredValue(query).trim());
  const learned = Object.keys(p.cards).length;
  const mastered = Object.values(p.cards).filter((c) => mastery(c) === 'mastered').length;

  const decks = useMemo(
    () =>
      (tab === 'level' ? levelDeckIds() : topicDeckIds())
        .map((id) => ({ info: deckInfo(id, p)!, counts: deckCounts(deckWords(id, p), p, today) }))
        .filter((d) => d.info && (!q || foldVi(`${d.info.title} ${d.info.subtitle}`).includes(q))),
    [tab, p, today, q],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Kho từ vựng</h1>
          <p>Mỗi từ có phiên âm, nghĩa tiếng Việt, câu ví dụ kèm bản dịch. Học theo trình độ CEFR hoặc theo chủ đề hay gặp trong IELTS.</p>
        </div>
        <div className="row">
          <Link to="/lookup" className="btn ghost">
            <Search size={18} /> Tra từ
          </Link>
          <Link to="/study" className="btn">
            <Brain size={18} /> Ôn tập
          </Link>
        </div>
      </div>

      <div className="grid cols-4">
        <StatTile tone="emerald" icon={<Library size={22} />} value={formatNumber(words.length)} label="từ trong kho" />
        <StatTile tone="blue" icon={<Layers size={22} />} value={formatNumber(learned)} label="từ đã học" />
        <StatTile tone="violet" icon={<Sparkles size={22} />} value={formatNumber(mastered)} label="từ thuộc lòng" />
        <StatTile tone="amber" icon={<Tags size={22} />} value={topics.length} label="chủ đề IELTS" />
      </div>

      <div className="section-head">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          label="Cách chia bộ thẻ"
          options={[
            { id: 'level', label: 'Theo trình độ CEFR' },
            { id: 'topic', label: 'Theo chủ đề IELTS' },
          ]}
        />
        <span className="grow" />
        <label className="search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bộ thẻ…" aria-label="Tìm bộ thẻ" />
        </label>
      </div>

      {decks.length === 0 ? (
        <Empty>Không có bộ thẻ nào khớp “{query}”.</Empty>
      ) : (
        <div className="grid cols-2">
          {decks.map((d) => (
            <DeckCard key={d.info.id} info={d.info} counts={d.counts} />
          ))}
        </div>
      )}
    </div>
  );
}
