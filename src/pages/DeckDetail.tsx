import { useDeferredValue, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  ChevronLeft,
  Clock,
  Download,
  Gamepad2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Layers,
  X,
} from 'lucide-react';
import WordList from '../components/WordList';
import { Counts } from '../components/DeckCard';
import { Empty, IconTile, Modal, ProgressBar, Segmented, StatTile, formatNumber } from '../components/ui';
import { DeckFormModal } from './Decks';
import { allWords, deckCounts, deckInfo, deckWords } from '../lib/decks';
import { addCustomWords, addWordsToDeck, deleteDeck, removeWordFromDeck, useProgress } from '../lib/progress';
import { dayNumber, mastery } from '../lib/srs';
import { foldVi } from '../lib/text';
import { parseWordCsv, toCsv } from '../lib/csv';
import { CEFR_LEVELS, type Cefr } from '../types';

type Status = 'all' | 'new' | 'learning' | 'mastered';

export default function DeckDetail() {
  const { deckId = '' } = useParams();
  const p = useProgress();
  const navigate = useNavigate();
  const info = deckInfo(deckId, p);
  const today = dayNumber();
  const [level, setLevel] = useState<Cefr | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<null | 'add' | 'import' | 'edit'>(null);
  const q = foldVi(useDeferredValue(query).trim());

  const list = useMemo(() => deckWords(deckId, p), [deckId, p]);
  const counts = useMemo(() => deckCounts(list, p, today), [list, p, today]);
  const levels = useMemo(() => CEFR_LEVELS.filter((l) => list.some((w) => w.cefr === l)), [list]);
  const shown = useMemo(
    () =>
      list.filter((w) => {
        if (level !== 'all' && w.cefr !== level) return false;
        const m = mastery(p.cards[w.id]);
        if (status === 'new' && m !== 'new') return false;
        if (status === 'learning' && (m === 'new' || m === 'mastered')) return false;
        if (status === 'mastered' && m !== 'mastered') return false;
        return !q || w.word.toLowerCase().includes(q) || foldVi(w.meaningVi).includes(q);
      }),
    [list, level, status, q, p.cards],
  );

  if (!info) return <Navigate to="/vocab" replace />;
  const custom = info.kind === 'custom' ? p.decks[deckId.slice(7)] : undefined;
  const learned = counts.total - counts.fresh;
  const back = custom ? '/decks' : info.kind === 'starred' ? '/' : '/vocab';
  const enc = encodeURIComponent(deckId);

  const exportCsv = () => {
    const rows = [['word', 'meaning', 'example', 'example_vi', 'ipa'], ...list.map((w) => [w.word, w.meaningVi, w.example, w.exampleVi, w.ipa])];
    const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${info.title.replace(/[\\/:*?"<>|]/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <Link to={back} className="back">
        <ChevronLeft size={18} /> {custom ? 'Bộ thẻ cá nhân' : info.kind === 'starred' ? 'Trang chủ' : 'Kho từ vựng'}
      </Link>

      <section className="card deck-hero">
        <IconTile tone={info.tone} size="lg">
          {info.icon}
        </IconTile>
        <div className="deck-hero-body">
          <h1>{info.title}</h1>
          <p className="muted">{info.subtitle}</p>
          <Counts counts={counts} />
          <ProgressBar value={counts.total ? learned / counts.total : 0} label="Tiến độ bộ thẻ" />
          <p className="muted small">
            Đã học {formatNumber(learned)}/{formatNumber(counts.total)} từ
          </p>
          <div className="btn-row">
            <Link to={`/study?deck=${enc}`} className={`btn ${counts.total ? '' : 'disabled'}`}>
              <Brain size={18} /> Ôn tập ngay
            </Link>
            <Link to={`/practice?deck=${enc}`} className={`btn ghost ${counts.total ? '' : 'disabled'}`}>
              <BookOpen size={18} /> Luyện flashcard
            </Link>
            <Link to={`/games?deck=${enc}`} className={`btn ghost ${counts.total >= 6 ? '' : 'disabled'}`}>
              <Gamepad2 size={18} /> Chơi game
            </Link>
          </div>
          {custom && (
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button type="button" className="btn soft sm" onClick={() => setModal('add')}>
                <Plus size={16} /> Thêm từ
              </button>
              <button type="button" className="btn soft sm" onClick={() => setModal('import')}>
                <Upload size={16} /> Nhập CSV
              </button>
              <button type="button" className="btn ghost sm" onClick={exportCsv} disabled={!list.length}>
                <Download size={16} /> Xuất CSV
              </button>
              <button type="button" className="btn ghost sm" onClick={() => setModal('edit')}>
                <Pencil size={16} /> Sửa
              </button>
              <button
                type="button"
                className="btn danger sm"
                onClick={() => {
                  if (confirm(`Xoá bộ thẻ “${custom.name}”? Tiến độ học các từ vẫn được giữ.`)) {
                    deleteDeck(custom.id);
                    navigate('/decks');
                  }
                }}
              >
                <Trash2 size={16} /> Xoá bộ
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <StatTile tone="rose" icon={<RotateCcw size={22} />} value={counts.learning} label="Đang học lại" />
        <StatTile tone="amber" icon={<Clock size={22} />} value={counts.due} label="Đến hạn ôn" />
        <StatTile tone="blue" icon={<Layers size={22} />} value={formatNumber(counts.fresh)} label="Chưa học" />
        <StatTile tone="emerald" icon={<Sparkles size={22} />} value={formatNumber(counts.mastered)} label="Thuộc lòng" />
      </div>

      <div className="section-head">
        {levels.length > 1 && (
          <Segmented<Cefr | 'all'>
            value={level}
            onChange={setLevel}
            label="Lọc theo trình độ"
            options={[{ id: 'all', label: 'Mọi trình độ' }, ...levels.map((l) => ({ id: l, label: l }))]}
          />
        )}
        <Segmented<Status>
          value={status}
          onChange={setStatus}
          label="Lọc theo tiến độ"
          options={[
            { id: 'all', label: 'Tất cả' },
            { id: 'new', label: 'Chưa học' },
            { id: 'learning', label: 'Đang học' },
            { id: 'mastered', label: 'Thuộc lòng' },
          ]}
        />
        <span className="grow" />
        <label className="search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong bộ…" aria-label="Tìm từ trong bộ" />
        </label>
      </div>

      {list.length === 0 ? (
        <Empty icon={info.kind === 'starred' ? '⭐' : <Plus size={24} />}>
          {info.kind === 'starred' ? (
            <p>Bấm biểu tượng ngôi sao ở bất kỳ từ nào để lưu vào đây.</p>
          ) : (
            <>
              <p>Bộ thẻ còn trống. Thêm từ bằng tay, chọn từ trong kho, hoặc nhập cả danh sách từ file CSV.</p>
              <div className="btn-row center">
                <button type="button" className="btn" onClick={() => setModal('add')}>
                  <Plus size={18} /> Thêm từ
                </button>
                <button type="button" className="btn ghost" onClick={() => setModal('import')}>
                  <Upload size={18} /> Nhập CSV
                </button>
              </div>
            </>
          )}
        </Empty>
      ) : shown.length === 0 ? (
        <Empty>Không có từ nào khớp bộ lọc.</Empty>
      ) : (
        <WordList
          key={`${level}-${status}-${q}`}
          items={shown}
          actions={
            custom
              ? (w) => (
                  <button type="button" className="icon-btn speak" aria-label={`Bỏ ${w.word} khỏi bộ`} title="Bỏ khỏi bộ thẻ" onClick={() => removeWordFromDeck(custom.id, w.id)}>
                    <X size={18} />
                  </button>
                )
              : undefined
          }
        />
      )}

      {custom && modal === 'add' && <AddWordModal deckId={custom.id} onClose={() => setModal(null)} />}
      {custom && modal === 'import' && <ImportModal deckId={custom.id} onClose={() => setModal(null)} />}
      {custom && modal === 'edit' && <DeckFormModal deck={custom} onClose={() => setModal(null)} />}
    </div>
  );
}

function AddWordModal({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const p = useProgress();
  const [tab, setTab] = useState<'bank' | 'manual'>('bank');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ word: '', meaningVi: '', ipa: '', example: '', exampleVi: '' });
  const [note, setNote] = useState('');
  const inDeck = new Set(p.decks[deckId]?.wordIds ?? []);
  const q = foldVi(useDeferredValue(query).trim());
  const results = useMemo(
    () => (q ? allWords(p).filter((w) => w.word.toLowerCase().startsWith(q) || foldVi(w.meaningVi).includes(q)).slice(0, 30) : []),
    [q, p],
  );

  return (
    <Modal title="Thêm từ vào bộ thẻ" onClose={onClose} wide>
      <Segmented
        value={tab}
        onChange={setTab}
        label="Cách thêm"
        options={[
          { id: 'bank', label: 'Chọn từ trong kho' },
          { id: 'manual', label: 'Tự nhập từ mới' },
        ]}
      />
      {tab === 'bank' ? (
        <div style={{ marginTop: 14 }}>
          <label className="search">
            <Search size={18} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gõ từ tiếng Anh hoặc nghĩa tiếng Việt…" aria-label="Tìm từ" />
          </label>
          <div className="list" style={{ marginTop: 10, maxHeight: 380, overflowY: 'auto' }}>
            {results.map((w) => (
              <div key={w.id} className="list-row">
                <span className="list-main">
                  <b>{w.word}</b>
                  <span className="muted small">{w.meaningVi}</span>
                </span>
                <span className={`tag cefr cefr-${w.cefr}`}>{w.cefr}</span>
                <button type="button" className="btn sm" disabled={inDeck.has(w.id)} onClick={() => addWordsToDeck(deckId, [w.id])}>
                  {inDeck.has(w.id) ? 'Đã thêm' : 'Thêm'}
                </button>
              </div>
            ))}
            {q && results.length === 0 && <p className="muted center">Không thấy từ này trong kho. Hãy chuyển sang “Tự nhập từ mới”.</p>}
          </div>
        </div>
      ) : (
        <form
          className="form-grid"
          style={{ marginTop: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            const added = addCustomWords(deckId, [form]);
            setNote(added ? `Đã thêm “${form.word}”.` : 'Từ này đã có trong bộ.');
            if (added) setForm({ word: '', meaningVi: '', ipa: '', example: '', exampleVi: '' });
          }}
        >
          <label className="field">
            Từ / cụm từ *
            <input className="input" required value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
          </label>
          <label className="field">
            Nghĩa tiếng Việt *
            <input className="input" required value={form.meaningVi} onChange={(e) => setForm({ ...form, meaningVi: e.target.value })} />
          </label>
          <label className="field">
            Phiên âm
            <input className="input" placeholder="/ɪɡˈzæmpl/" value={form.ipa} onChange={(e) => setForm({ ...form, ipa: e.target.value })} />
          </label>
          <span />
          <label className="field full">
            Câu ví dụ
            <input className="input" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} />
          </label>
          <label className="field full">
            Dịch câu ví dụ
            <input className="input" value={form.exampleVi} onChange={(e) => setForm({ ...form, exampleVi: e.target.value })} />
          </label>
          <div className="full row">
            <button type="submit" className="btn">
              <Plus size={18} /> Thêm từ
            </button>
            {note && <span className="muted">{note}</span>}
          </div>
        </form>
      )}
    </Modal>
  );
}

const SAMPLE = `word,meaning,example,example_vi
resilient,kiên cường,She stayed resilient after the setback.,Cô ấy vẫn kiên cường sau thất bại.
mitigate,giảm nhẹ,Trees help mitigate urban heat.,Cây xanh giúp giảm nhiệt đô thị.`;

function ImportModal({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const parsed = useMemo(() => (text.trim() ? parseWordCsv(text) : null), [text]);

  return (
    <Modal title="Nhập từ file CSV" onClose={onClose} wide icon={<IconTile tone="blue" size="sm"><Upload size={20} /></IconTile>}>
      <p className="muted">
        Mỗi dòng một từ. Có thể kèm dòng tiêu đề <code>word, meaning, example, example_vi, ipa</code>, hoặc không có tiêu đề thì theo đúng thứ tự đó. Phân cách bằng dấu phẩy, chấm phẩy
        hoặc Tab (dán thẳng từ Excel / Google Sheets được).
      </p>
      <div className="row wrap" style={{ marginBottom: 10 }}>
        <label className="btn ghost sm">
          <Upload size={16} /> Chọn file .csv / .txt
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setText(await file.text());
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" className="btn ghost sm" onClick={() => setText(SAMPLE)}>
          Dùng dữ liệu mẫu
        </button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} aria-label="Nội dung CSV" style={{ width: '100%' }} />
      {parsed && (
        <p className="small" style={{ marginTop: 8 }}>
          Đọc được <b>{parsed.words.length}</b> từ{parsed.skipped ? `, bỏ qua ${parsed.skipped} dòng thiếu từ hoặc nghĩa` : ''}
          {parsed.hasHeader ? ' (có dòng tiêu đề)' : ''}.
          {parsed.words[0] && (
            <span className="muted">
              {' '}
              Ví dụ: <b>{parsed.words[0].word}</b> = {parsed.words[0].meaningVi}
            </span>
          )}
        </p>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn"
          disabled={!parsed?.words.length}
          onClick={() => {
            const added = addCustomWords(deckId, parsed!.words);
            setNote(`Đã thêm ${added} từ${parsed!.words.length - added ? `, ${parsed!.words.length - added} từ đã có sẵn trong bộ` : ''}.`);
            setText('');
          }}
        >
          <Upload size={18} /> Nhập {parsed?.words.length ?? 0} từ
        </button>
        {note && <span className="notice" style={{ margin: 0 }}>{note}</span>}
      </div>
    </Modal>
  );
}
