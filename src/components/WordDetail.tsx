import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { posLabel, type Word } from '../types';
import { topicById } from '../data';
import { addToReview, useProgress } from '../lib/progress';
import { formatInterval, mastery, MASTERY_VI, dayNumber } from '../lib/srs';
import { SpeakButton, StarButton } from './ui';

export function MasteryDot({ wordId }: { wordId: string }) {
  const card = useProgress().cards[wordId];
  const m = mastery(card);
  return <span className={`dot dot-${m}`} title={MASTERY_VI[m]} />;
}

export function SourceTag({ word }: { word: Word }) {
  const p = useProgress();
  if (word.topicId.startsWith('custom:')) {
    const deck = p.decks[word.topicId.slice(7)];
    return deck ? (
      <Link to={`/deck/custom:${deck.id}`} className="tag">
        {deck.icon} {deck.name}
      </Link>
    ) : null;
  }
  const topic = topicById.get(word.topicId);
  return topic ? (
    <Link to={`/deck/topic:${topic.id}`} className="tag">
      {topic.icon} {topic.nameVi}
    </Link>
  ) : null;
}

export default function WordDetail({ word, showTopic = false }: { word: Word; showTopic?: boolean }) {
  const card = useProgress().cards[word.id];
  const m = mastery(card);
  const today = dayNumber();

  return (
    <div className="word-detail">
      <div className="word-title">
        {word.word}
        <SpeakButton text={word.word} />
        <SpeakButton text={word.word} slow />
        <StarButton wordId={word.id} />
      </div>
      <div className="word-meta">
        {word.ipa && <span className="ipa">{word.ipa}</span>}
        <span className="tag">{posLabel(word)}</span>
        <span className={`tag cefr cefr-${word.cefr}`}>{word.cefr}</span>
        {showTopic && <SourceTag word={word} />}
      </div>

      <p className="meaning">{word.meaningVi}</p>

      {word.example && (
        <div className="example">
          <div className="example-en">
            {word.example}
            <SpeakButton text={word.example} label="Nghe câu ví dụ" />
          </div>
          {word.exampleVi && <div className="example-vi">{word.exampleVi}</div>}
        </div>
      )}

      {word.collocations.length > 0 && (
        <div className="chips-row">
          <span className="chips-label">Cụm từ hay đi kèm</span>
          {word.collocations.map((c) => (
            <span key={c} className="chip plain">
              {c}
            </span>
          ))}
        </div>
      )}
      {word.synonyms.length > 0 && (
        <div className="chips-row">
          <span className="chips-label">Từ đồng nghĩa</span>
          {word.synonyms.map((s) => (
            <span key={s} className="chip plain">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="word-foot">
        {card ? (
          <span className="muted">
            <Check size={14} /> {MASTERY_VI[m]} · ôn lại {card.due <= today ? 'hôm nay' : `sau ${formatInterval(card.due - today)}`}
          </span>
        ) : (
          <button type="button" className="btn sm soft" onClick={() => addToReview(word.id)}>
            <Plus size={16} /> Thêm vào ôn tập
          </button>
        )}
      </div>
    </div>
  );
}
