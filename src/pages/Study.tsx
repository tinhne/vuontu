import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, PartyPopper, RotateCcw } from 'lucide-react';
import { Empty, IconTile, ProgressBar, SpeakButton, StarButton } from '../components/ui';
import { deckInfo, deckWords, findWord } from '../lib/decks';
import { getProgress, logActivity, newLeftToday, reviewCard } from '../lib/progress';
import { dayNumber, formatInterval, isDue, RATINGS, RATING_VI, schedule, type Rating } from '../lib/srs';
import { speak } from '../lib/speech';
import { shuffle } from '../lib/text';
import { CEFR_LEVELS, posLabel } from '../types';

type Mode = 'mixed' | 'review' | 'new';

function buildQueue(deckId: string, mode: Mode, extra: number): string[] {
  const p = getProgress();
  const today = dayNumber();
  const list = deckWords(deckId, p);

  const due = mode === 'new' ? [] : list.filter((w) => p.cards[w.id] && isDue(p.cards[w.id], today)).sort((a, b) => p.cards[a.id].due - p.cards[b.id].due);
  if (mode === 'review') return due.map((w) => w.id);

  // Picking a specific deck is a deliberate choice, so it always offers a few new words.
  const limit = (deckId === 'all' ? newLeftToday(p, today) : Math.max(newLeftToday(p, today), 10)) + extra;
  // Easier words first, shuffled within each level so sessions don't feel identical.
  const unseen = list.filter((w) => !p.cards[w.id]);
  const fresh = CEFR_LEVELS.flatMap((lvl) => shuffle(unseen.filter((w) => w.cefr === lvl))).slice(0, limit);
  return [...due, ...fresh].map((w) => w.id);
}

// Remount on every new ?deck/&mode so the queue is rebuilt.
export default function StudyRoute() {
  return <Study key={useLocation().search} />;
}

function Study() {
  const [params] = useSearchParams();
  const deckId = params.get('deck') ?? 'all';
  const mode = (['review', 'new'].includes(params.get('mode') ?? '') ? params.get('mode') : 'mixed') as Mode;
  const info = deckInfo(deckId, getProgress());

  const [queue, setQueue] = useState(() => buildQueue(deckId, mode, Number(params.get('extra')) || 0));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ done: 0, again: 0, xp: 0 });
  const [initialSize, setInitialSize] = useState(queue.length);
  const logged = useRef(false);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const word = queue[pos] ? findWord(queue[pos], getProgress()) : undefined;
  const finished = pos >= queue.length;
  const title = info?.title ?? 'Ôn tập';

  const writeLog = useCallback(() => {
    const s = statsRef.current;
    if (logged.current || s.done === 0) return;
    logged.current = true;
    logActivity('study', `Ôn tập · ${title}`, `${s.done} lượt trả lời · ${s.again} lần quên`, s.xp);
  }, [title]);

  // Log a session the learner leaves halfway, too.
  useEffect(() => writeLog, [writeLog]);
  useEffect(() => {
    if (finished && queue.length > 0) writeLog();
  }, [finished, queue.length, writeLog]);

  useEffect(() => {
    if (word && getProgress().settings.autoSpeak) speak(word.word);
  }, [word]);

  const rate = useCallback(
    (rating: Rating) => {
      if (!word) return;
      const xp = reviewCard(word.id, rating);
      setStats((s) => ({ done: s.done + 1, again: s.again + (rating === 'again' ? 1 : 0), xp: s.xp + xp }));
      // Forgotten cards come back at the end of this session.
      if (rating === 'again') setQueue((q) => [...q, word.id]);
      setFlipped(false);
      setPos((i) => i + 1);
    },
    [word],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, flipped, rate]);

  const restart = (extra: number) => {
    writeLog();
    logged.current = false;
    const q = buildQueue(deckId, 'new', extra);
    setQueue(q);
    setInitialSize(q.length);
    setPos(0);
    setFlipped(false);
    setStats({ done: 0, again: 0, xp: 0 });
  };

  const backTo = deckId === 'all' ? '/review' : `/deck/${deckId}`;

  if (queue.length === 0) {
    const p = getProgress();
    const deckDone = deckWords(deckId, p).every((w) => p.cards[w.id]);
    return (
      <div className="page narrow">
        <Link to={backTo} className="back">
          <ChevronLeft size={18} /> Quay lại
        </Link>
        <h1>{title}</h1>
        <Empty icon={<PartyPopper size={24} />}>
          <p>{deckDone ? 'Bạn đã học hết từ trong bộ này và không còn thẻ đến hạn. Tuyệt vời!' : 'Không còn thẻ đến hạn và đã đủ chỉ tiêu từ mới hôm nay.'}</p>
          {!deckDone && (
            <button type="button" className="btn" onClick={() => restart(10)}>
              Học thêm 10 từ mới
            </button>
          )}
        </Empty>
      </div>
    );
  }

  if (finished || !word) {
    return (
      <div className="page narrow">
        <div className="card summary">
          <IconTile tone="emerald" size="lg">
            <PartyPopper size={30} />
          </IconTile>
          <h1>Xong phiên học!</h1>
          <p className="muted">
            {initialSize} thẻ · {stats.done} lượt trả lời · {stats.again} lần quên
          </p>
          <p className="big-number">+{stats.xp} XP</p>
          <div className="btn-row center">
            <button type="button" className="btn" onClick={() => restart(10)}>
              Học thêm 10 từ
            </button>
            <Link to={backTo} className="btn ghost">
              Quay lại
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const today = dayNumber();
  const card = getProgress().cards[word.id];

  return (
    <div className="page narrow">
      <div className="study-head">
        <Link to={backTo} className="back">
          <ChevronLeft size={18} /> {title}
        </Link>
        <span className="row small muted">
          {!card && <span className="chip tone-blue">Từ mới</span>}
          {Math.min(pos + 1, queue.length)}/{queue.length}
        </span>
      </div>
      <ProgressBar value={pos / queue.length} />

      <div
        className="flashcard"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Mặt sau thẻ' : 'Bấm để lật thẻ'}
      >
        <span className="corner">
          <StarButton wordId={word.id} />
        </span>
        <div className="fc-front">
          <span className={`tag cefr cefr-${word.cefr}`}>{word.cefr}</span>
          <div className="fc-word">{word.word}</div>
          <div className="fc-ipa">
            {word.ipa} <SpeakButton text={word.word} /> <SpeakButton text={word.word} slow />
          </div>
          <span className="tag">{posLabel(word)}</span>
          {!flipped && <p className="muted small fc-hint">Bấm vào thẻ hoặc phím Space để xem nghĩa</p>}
        </div>
        {flipped && (
          <div className="fc-back">
            <p className="meaning">{word.meaningVi}</p>
            {word.example && (
              <div className="example">
                <div className="example-en">
                  {word.example} <SpeakButton text={word.example} label="Nghe câu ví dụ" />
                </div>
                <div className="example-vi">{word.exampleVi}</div>
              </div>
            )}
            {word.collocations.length > 0 && (
              <div className="chips-row">
                {word.collocations.map((c) => (
                  <span key={c} className="chip plain">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {word.synonyms.length > 0 && <p className="muted small">Đồng nghĩa: {word.synonyms.join(', ')}</p>}
          </div>
        )}
      </div>

      {flipped ? (
        <div className="rating-row">
          {RATINGS.map((r, i) => {
            const next = schedule(card, r, today);
            return (
              <button key={r} type="button" className={`rate rate-${r}`} onClick={() => rate(r)}>
                <b>{RATING_VI[r]}</b>
                <span>{r === 'again' ? 'Ôn lại ngay' : formatInterval(next.interval)}</span>
                <kbd className="hide-sm">{i + 1}</kbd>
              </button>
            );
          })}
        </div>
      ) : (
        <button type="button" className="btn wide lg" onClick={() => setFlipped(true)}>
          <RotateCcw size={18} /> Lật thẻ
        </button>
      )}
    </div>
  );
}
