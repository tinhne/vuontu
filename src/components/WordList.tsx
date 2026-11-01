import { useState, type ReactNode } from 'react';
import WordDetail, { MasteryDot } from './WordDetail';
import { SpeakButton, StarButton } from './ui';
import type { Word } from '../types';

const PAGE = 60;

/** Expandable word rows, shown a page at a time so decks with thousands of words stay fast. */
export default function WordList({ items, actions }: { items: Word[]; actions?: (w: Word) => ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const shown = items.slice(0, limit);

  return (
    <div className="card word-table">
      {shown.map((w) => (
        <div key={w.id} className={`word-row ${open === w.id ? 'open' : ''}`}>
          <button type="button" className="word-row-head" onClick={() => setOpen(open === w.id ? null : w.id)} aria-expanded={open === w.id}>
            <MasteryDot wordId={w.id} />
            <span className="word-row-word">{w.word}</span>
            <span className="ipa hide-sm">{w.ipa}</span>
            <span className="word-row-meaning">{w.meaningVi}</span>
            <span className={`tag cefr cefr-${w.cefr}`}>{w.cefr}</span>
          </button>
          <span className="word-row-actions">
            <SpeakButton text={w.word} />
            <StarButton wordId={w.id} />
            {actions?.(w)}
          </span>
          {open === w.id && (
            <div className="word-row-body">
              <WordDetail word={w} showTopic />
            </div>
          )}
        </div>
      ))}
      {items.length > limit && (
        <div className="more-row">
          <button type="button" className="btn ghost sm" onClick={() => setLimit(limit + PAGE * 2)}>
            Xem thêm ({(items.length - limit).toLocaleString('vi-VN')} từ nữa)
          </button>
        </div>
      )}
    </div>
  );
}
