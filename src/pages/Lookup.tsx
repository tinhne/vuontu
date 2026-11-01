import { useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Search, BookA } from 'lucide-react';
import WordDetail, { MasteryDot } from '../components/WordDetail';
import { Empty, SpeakButton, formatNumber } from '../components/ui';
import { allWords } from '../lib/decks';
import { useProgress } from '../lib/progress';
import { foldVi } from '../lib/text';
import type { Word } from '../types';

const MAX_RESULTS = 50;

function search(list: Word[], query: string): Word[] {
  const q = foldVi(query.trim());
  if (!q) return [];
  const scored: [number, Word][] = [];
  for (const w of list) {
    const word = w.word.toLowerCase();
    let score = -1;
    if (word === q) score = 0;
    else if (word.startsWith(q)) score = 1;
    else if (word.includes(q)) score = 2;
    else {
      const meaning = foldVi(w.meaningVi);
      if (meaning.split(/[,;()]\s*/).some((part) => part.trim() === q)) score = 3;
      else if (meaning.includes(q)) score = 4;
      else if (w.synonyms.some((s) => s.toLowerCase().includes(q)) || w.collocations.some((c) => c.toLowerCase().includes(q))) score = 5;
    }
    if (score >= 0) scored.push([score, w]);
  }
  return scored
    .sort((a, b) => a[0] - b[0] || a[1].word.length - b[1].word.length)
    .slice(0, MAX_RESULTS)
    .map(([, w]) => w);
}

export default function Lookup() {
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const deferred = useDeferredValue(query);
  const selectedId = params.get('w');
  const list = useMemo(() => allWords(p), [p]);
  const results = useMemo(() => search(list, deferred), [list, deferred]);
  const selected = results.find((w) => w.id === selectedId) ?? results[0];
  const looksEnglish = /^[a-zA-Z][a-zA-Z' -]*$/.test(query.trim());

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tra từ điển</h1>
          <p>Tra nhanh {formatNumber(list.length)} từ bằng tiếng Anh hoặc tiếng Việt, có dấu hay không dấu đều được.</p>
        </div>
      </div>

      <label className="search big">
        <Search size={22} />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="ví dụ: sustainable, ô nhiễm, giao duc…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Từ cần tra"
        />
      </label>

      {query.trim() && results.length === 0 && (
        <Empty icon={<BookA size={24} />}>
          <p>Không tìm thấy “{query}” trong kho từ của Vườn Từ.</p>
          {looksEnglish && (
            <div className="btn-row center">
              <SpeakButton text={query.trim()} />
              <a
                className="btn ghost"
                href={`https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(query.trim().toLowerCase())}`}
                target="_blank"
                rel="noreferrer"
              >
                Tra trên Cambridge <ExternalLink size={16} />
              </a>
            </div>
          )}
        </Empty>
      )}

      {results.length > 0 && (
        <div className="lookup">
          <div className="card list lookup-results">
            {results.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`list-row ${selected?.id === w.id ? 'active' : ''}`}
                onClick={() => setParams({ q: query, w: w.id }, { replace: true })}
              >
                <MasteryDot wordId={w.id} />
                <span className="list-main">
                  <b>{w.word}</b>
                  <span className="muted small">{w.meaningVi}</span>
                </span>
                <span className={`tag cefr cefr-${w.cefr}`}>{w.cefr}</span>
              </button>
            ))}
          </div>
          <div className="card lookup-detail">{selected && <WordDetail word={selected} showTopic />}</div>
        </div>
      )}

      {!query.trim() && (
        <Empty icon={<BookA size={24} />}>
          <p>Mỗi từ có phiên âm, nghĩa, câu ví dụ kèm dịch. Bấm loa để nghe, bấm sao để lưu vào “Từ đã lưu”.</p>
        </Empty>
      )}
    </div>
  );
}
