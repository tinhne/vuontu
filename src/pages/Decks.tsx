import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Layers, Plus, Star } from 'lucide-react';
import DeckCard from '../components/DeckCard';
import { Empty, IconTile, Modal } from '../components/ui';
import { customDeckIds, deckCounts, deckInfo, deckWords } from '../lib/decks';
import { createDeck, updateDeck, useProgress } from '../lib/progress';
import { dayNumber } from '../lib/srs';
import { TONES, type CustomDeck, type Tone } from '../types';

const ICONS = ['📒', '📗', '🧠', '✈️', '💼', '🎯', '🔥', '🌍', '🍀', '🎧', '📝', '🏆'];

export function DeckFormModal({ deck, onClose, onCreated }: { deck?: CustomDeck; onClose: () => void; onCreated?: (id: string) => void }) {
  const [name, setName] = useState(deck?.name ?? '');
  const [description, setDescription] = useState(deck?.description ?? '');
  const [icon, setIcon] = useState(deck?.icon ?? ICONS[0]);
  const [tone, setTone] = useState<Tone>(deck?.tone ?? 'emerald');

  return (
    <Modal title={deck ? 'Sửa bộ thẻ' : 'Tạo bộ thẻ mới'} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (deck) {
            updateDeck(deck.id, { name: name.trim(), description: description.trim(), icon, tone });
            onClose();
          } else {
            onCreated?.(createDeck(name.trim(), description.trim(), icon, tone));
          }
        }}
      >
        <label className="field full">
          Tên bộ thẻ *
          <input className="input" autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Từ vựng Writing Task 2" />
        </label>
        <label className="field full">
          Mô tả
          <input className="input" maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Không bắt buộc" />
        </label>
        <div className="field full">
          Biểu tượng
          <div className="row wrap">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`icon-btn boxed ${ic === icon ? 'tone-emerald' : ''}`}
                style={ic === icon ? { outline: '2px solid var(--accent)' } : undefined}
                onClick={() => setIcon(ic)}
                aria-label={`Chọn biểu tượng ${ic}`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div className="field full">
          Màu
          <div className="row wrap">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                className={`icon-tile sm tone-${t}`}
                style={{ border: 0, outline: t === tone ? '3px solid var(--text)' : 'none', outlineOffset: 2 }}
                onClick={() => setTone(t)}
                aria-label={`Màu ${t}`}
              />
            ))}
          </div>
        </div>
        <div className="full row" style={{ marginTop: 6 }}>
          <IconTile tone={tone}>{icon}</IconTile>
          <b>{name || 'Bộ thẻ mới'}</b>
          <span className="spacer" />
          <button type="submit" className="btn">
            {deck ? 'Lưu' : 'Tạo bộ thẻ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Decks() {
  const p = useProgress();
  const navigate = useNavigate();
  const today = dayNumber();
  const [creating, setCreating] = useState(false);
  const ids = customDeckIds(p);
  const starredCount = Object.keys(p.starred).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Bộ thẻ cá nhân</h1>
          <p>Tự gom từ bạn cần: từ gặp trong đề thi, từ trong sách, từ của lớp học. Thêm từ có sẵn trong kho, tự nhập, hoặc nhập cả danh sách từ file CSV.</p>
        </div>
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          <Plus size={18} /> Tạo bộ thẻ
        </button>
      </div>

      <div className="grid cols-2">
        <DeckCard info={deckInfo('starred', p)!} counts={deckCounts(deckWords('starred', p), p, today)} />
        {ids.map((id) => (
          <DeckCard key={id} info={deckInfo(id, p)!} counts={deckCounts(deckWords(id, p), p, today)} />
        ))}
      </div>

      {ids.length === 0 && (
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <Empty icon={<Layers size={24} />}>
            <p>
              <b>Chưa có bộ thẻ nào.</b>
              <br />
              Tạo bộ đầu tiên để học đúng những từ bạn cần.
            </p>
            <button type="button" className="btn" onClick={() => setCreating(true)}>
              <Plus size={18} /> Tạo bộ thẻ
            </button>
          </Empty>
          <div className="card">
            <div className="row" style={{ marginBottom: 10 }}>
              <IconTile tone="blue" size="sm">
                <FileSpreadsheet size={20} />
              </IconTile>
              <h3 style={{ margin: 0 }}>Nhập từ CSV</h3>
            </div>
            <p className="muted small">Chuẩn bị file có các cột sau (dòng tiêu đề không bắt buộc), rồi mở bộ thẻ và bấm “Nhập CSV”:</p>
            <div className="formula">
              <div>word,meaning,example,example_vi,ipa</div>
              <div>resilient,kiên cường,She stayed resilient.,Cô ấy vẫn kiên cường.</div>
            </div>
            <p className="muted small">
              <Star size={14} style={{ verticalAlign: -2 }} /> Mẹo: bấm sao ở bất kỳ từ nào để lưu nhanh vào “Từ đã lưu”{starredCount ? ` (đang có ${starredCount} từ)` : ''}.
            </p>
          </div>
        </div>
      )}

      {creating && (
        <DeckFormModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            navigate(`/deck/custom:${id}`);
          }}
        />
      )}
    </div>
  );
}
