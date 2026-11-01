import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Pause, Play, RotateCcw, Shuffle, X, BookOpen } from 'lucide-react';
import { Empty, ProgressBar, Segmented, SpeakButton, StarButton } from '../components/ui';
import { deckInfo, deckWords, sourceDeckIds } from '../lib/decks';
import { addXp, getProgress, logActivity, useProgress } from '../lib/progress';
import { speak } from '../lib/speech';
import { shuffle } from '../lib/text';
import { posLabel, type Word } from '../types';

type Filter = 'all' | 'unseen' | 'learning';
type Face = 'en' | 'vi';
const SIZES = [20, 50, 100];

export default function Practice() {
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const deckId = params.get('deck') ?? 'all';
  const [filter, setFilter] = useState<Filter>('all');
  const [face, setFace] = useState<Face>('en');
  const [size, setSize] = useState(20);
  const [seed, setSeed] = useState(0);

  const cards = useMemo(() => {
    const prog = getProgress();
    const list = deckWords(deckId, prog).filter((w) =>
      filter === 'unseen' ? !prog.cards[w.id] : filter === 'learning' ? prog.cards[w.id] && prog.cards[w.id].interval < 21 : true,
    );
    return shuffle(list).slice(0, size);
  }, [deckId, filter, size, seed]); // seed: reshuffle on demand

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1>Luyện flashcard</h1>
          <p>Lật thẻ thoải mái, không ảnh hưởng lịch ôn tập. Dùng phím ← → để chuyển thẻ, Space để lật.</p>
        </div>
      </div>

      <div className="card tight" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <select value={deckId} onChange={(e) => setParams({ deck: e.target.value }, { replace: true })} aria-label="Bộ thẻ" style={{ flex: '1 1 220px' }}>
          {sourceDeckIds(p).map((id) => (
            <option key={id} value={id}>
              {deckInfo(id, p)?.title}
            </option>
          ))}
        </select>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          label="Lọc thẻ"
          options={[
            { id: 'all', label: 'Tất cả' },
            { id: 'unseen', label: 'Chưa học' },
            { id: 'learning', label: 'Chưa thuộc' },
          ]}
        />
        <Segmented<Face>
          value={face}
          onChange={setFace}
          label="Mặt trước"
          options={[
            { id: 'en', label: 'Anh → Việt' },
            { id: 'vi', label: 'Việt → Anh' },
          ]}
        />
        <select value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Số thẻ" style={{ minWidth: 0 }}>
          {SIZES.map((n) => (
            <option key={n} value={n}>
              {n} thẻ
            </option>
          ))}
        </select>
      </div>

      {cards.length === 0 ? (
        <Empty icon={<BookOpen size={24} />}>Không có thẻ nào khớp bộ lọc này.</Empty>
      ) : (
        <Deck key={`${deckId}-${filter}-${size}-${seed}-${face}`} cards={cards} face={face} title={deckInfo(deckId, p)?.title ?? ''} onReshuffle={() => setSeed((s) => s + 1)} />
      )}
    </div>
  );
}

function Deck({ cards, face, title, onReshuffle }: { cards: Word[]; face: Face; title: string; onReshuffle: () => void }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [auto, setAuto] = useState(false);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const w = cards[i];
  const known = Object.values(marks).filter(Boolean).length;
  const unknown = Object.values(marks).length - known;
  const done = i >= cards.length;

  // Practice earns a little XP: one per card you rate, logged when you leave.
  useEffect(
    () => () => {
      const n = Object.keys(marksRef.current).length;
      if (n === 0) return;
      const k = Object.values(marksRef.current).filter(Boolean).length;
      addXp(n);
      logActivity('practice', `Luyện flashcard · ${title}`, `${n} thẻ · biết ${k}, chưa biết ${n - k}`, n);
    },
    [title],
  );

  const go = useCallback((delta: number) => {
    setFlipped(false);
    setI((x) => Math.max(0, Math.min(cards.length, x + delta)));
  }, [cards.length]);

  const mark = useCallback(
    (ok: boolean) => {
      if (!w) return;
      setMarks((m) => ({ ...m, [w.id]: ok }));
      go(1);
    },
    [w, go],
  );

  useEffect(() => {
    if (w && !flipped && face === 'en' && getProgress().settings.autoSpeak) speak(w.word);
  }, [w, flipped, face]);

  useEffect(() => {
    if (!auto || done) return;
    const t = setTimeout(() => (flipped ? go(1) : setFlipped(true)), flipped ? 2600 : 2200);
    return () => clearTimeout(t);
  }, [auto, flipped, done, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (done) {
    return (
      <div className="card summary" style={{ marginTop: 16 }}>
        <h1>Xong {cards.length} thẻ!</h1>
        <p className="muted">
          Biết {known} · Chưa biết {unknown}
        </p>
        <div className="btn-row center">
          <button type="button" className="btn" onClick={onReshuffle}>
            <Shuffle size={18} /> Xáo bộ mới
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setI(0);
              setFlipped(false);
            }}
          >
            <RotateCcw size={18} /> Xem lại từ đầu
          </button>
        </div>
      </div>
    );
  }

  const front =
    face === 'en' ? (
      <>
        <span className={`tag cefr cefr-${w.cefr}`}>{w.cefr}</span>
        <div className="fc-word">{w.word}</div>
        <div className="fc-ipa">
          {w.ipa} <SpeakButton text={w.word} />
        </div>
        <span className="tag">{posLabel(w)}</span>
      </>
    ) : (
      <>
        <span className="tag">{posLabel(w)}</span>
        <div className="fc-word" style={{ fontSize: '1.9rem' }}>
          {w.meaningVi}
        </div>
      </>
    );

  return (
    <>
      <div className="study-head" style={{ marginTop: 18 }}>
        <span className="muted small">
          Thẻ {i + 1}/{cards.length}
        </span>
        <span className="row small">
          <span className="chip tone-emerald">
            <Check size={13} /> {known}
          </span>
          <span className="chip tone-rose">
            <X size={13} /> {unknown}
          </span>
        </span>
      </div>
      <ProgressBar value={i / cards.length} />
      <div className="flashcard" onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} aria-label="Bấm để lật thẻ">
        <span className="corner">
          <StarButton wordId={w.id} />
        </span>
        <div className="fc-front">{front}</div>
        {flipped && (
          <div className="fc-back">
            {face === 'en' ? (
              <p className="meaning">{w.meaningVi}</p>
            ) : (
              <p className="meaning">
                {w.word} <span className="ipa small">{w.ipa}</span> <SpeakButton text={w.word} />
              </p>
            )}
            {w.example && (
              <div className="example">
                <div className="example-en">
                  {w.example} <SpeakButton text={w.example} label="Nghe câu ví dụ" />
                </div>
                <div className="example-vi">{w.exampleVi}</div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="practice-bar">
        <button type="button" className="icon-btn boxed" onClick={() => go(-1)} disabled={i === 0} aria-label="Thẻ trước">
          <ArrowLeft size={18} />
        </button>
        <button type="button" className={`btn ${auto ? '' : 'ghost'} sm`} onClick={() => setAuto((a) => !a)}>
          {auto ? <Pause size={16} /> : <Play size={16} />} Tự chạy
        </button>
        <span className="spacer" />
        <button type="button" className="btn danger" onClick={() => mark(false)}>
          <X size={18} /> Chưa biết
        </button>
        <button type="button" className="btn" onClick={() => mark(true)}>
          <Check size={18} /> Đã biết
        </button>
        <span className="spacer" />
        <button type="button" className="icon-btn boxed" onClick={() => go(1)} aria-label="Thẻ sau">
          <ArrowRight size={18} />
        </button>
      </div>
    </>
  );
}
