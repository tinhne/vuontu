import { useDeferredValue, useMemo, useState } from 'react';
import { CircleHelp, Search } from 'lucide-react';
import PlanCard from '../components/PlanCard';
import DeckCard from '../components/DeckCard';
import { Empty, IconTile, Modal, Segmented } from '../components/ui';
import { customDeckIds, deckCounts, deckInfo, deckWords, levelDeckIds, topicDeckIds } from '../lib/decks';
import { useProgress } from '../lib/progress';
import { dayNumber } from '../lib/srs';
import { foldVi } from '../lib/text';

type Tab = 'all' | 'level' | 'topic' | 'custom';

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Quy luật ôn tập ngắt quãng"
      onClose={onClose}
      icon={
        <IconTile tone="rose" size="sm">
          <CircleHelp size={20} />
        </IconTile>
      }
    >
      <div className="rich">
        <p>
          Não quên dần theo thời gian, nhưng mỗi lần nhớ lại đúng lúc sắp quên thì trí nhớ bền hơn. Vườn Từ dùng thuật toán dựa trên
          <strong> SM-2</strong> để tính ngày ôn tiếp theo cho từng thẻ.
        </p>
        <ul>
          <li>
            <strong>Quên:</strong> thẻ quay lại cuối phiên hôm nay và học lại từ đầu.
          </li>
          <li>
            <strong>Khó:</strong> nhớ được nhưng vất vả. Khoảng cách tăng ít.
          </li>
          <li>
            <strong>Nhớ:</strong> nhớ bình thường. Khoảng cách 1 → 3 → 8 → 20 ngày…
          </li>
          <li>
            <strong>Dễ:</strong> nhớ ngay. Khoảng cách tăng nhanh nhất.
          </li>
        </ul>
        <p>
          Mỗi ngày bạn ôn hết thẻ <strong>đến hạn</strong> trước, rồi học thêm một số <strong>từ mới</strong> (đặt trong Cài đặt). Thẻ có khoảng cách từ 21
          ngày trở lên được tính là <strong>thuộc lòng</strong>.
        </p>
        <p className="muted small">Mẹo: hãy thành thật khi chấm. Bấm “Nhớ” cho thẻ chưa thật nhớ chỉ khiến bạn quên nó sau này.</p>
      </div>
      <div className="formula">
        <div>● Đỏ: đang học lại · ● Cam: đến hạn ôn · ● Xanh: chưa học</div>
      </div>
    </Modal>
  );
}

export default function Review() {
  const p = useProgress();
  const today = dayNumber();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [rules, setRules] = useState(false);
  const q = foldVi(useDeferredValue(query).trim());

  const decks = useMemo(() => {
    const ids = tab === 'level' ? levelDeckIds() : tab === 'topic' ? topicDeckIds() : tab === 'custom' ? customDeckIds(p) : [...levelDeckIds(), ...customDeckIds(p), ...topicDeckIds()];
    return ids
      .map((id) => ({ info: deckInfo(id, p)!, counts: deckCounts(deckWords(id, p), p, today) }))
      .filter((d) => d.info && (!q || foldVi(`${d.info.title} ${d.info.subtitle}`).includes(q)));
  }, [tab, p, today, q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ôn tập ngắt quãng</h1>
          <p>Thuật toán SM-2 chọn đúng thẻ bạn sắp quên để ôn. Chấm Quên / Khó / Nhớ / Dễ sau mỗi thẻ để lịch ôn tự điều chỉnh.</p>
        </div>
        <button type="button" className="btn soft tone-rose" onClick={() => setRules(true)}>
          <CircleHelp size={18} /> Quy luật học
        </button>
      </div>

      <PlanCard />

      <div className="section-head">
        <h2>Chuyên đề ôn tập</h2>
        <span className="grow" />
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          label="Lọc bộ thẻ"
          options={[
            { id: 'all', label: 'Tất cả' },
            { id: 'level', label: 'CEFR' },
            { id: 'topic', label: 'Chủ đề IELTS' },
            { id: 'custom', label: 'Bộ thẻ của tôi' },
          ]}
        />
        <label className="search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm chuyên đề…" aria-label="Tìm chuyên đề" />
        </label>
      </div>

      {decks.length === 0 ? (
        <Empty>{tab === 'custom' && !q ? 'Bạn chưa có bộ thẻ nào. Tạo ở mục “Bộ thẻ cá nhân”.' : 'Không có chuyên đề nào khớp.'}</Empty>
      ) : (
        <div className="grid cols-2">
          {decks.map((d) => (
            <DeckCard key={d.info.id} info={d.info} counts={d.counts} />
          ))}
        </div>
      )}

      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  );
}
