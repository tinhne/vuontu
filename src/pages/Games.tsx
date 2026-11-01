import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookMarked, Info, Lightbulb, Play, Trophy } from 'lucide-react';
import { IconTile, Modal, formatNumber } from '../components/ui';
import { GAMES, type GameInfo } from '../games/catalog';
import { deckInfo, deckWords, sourceDeckIds } from '../lib/decks';
import { useProgress } from '../lib/progress';
import { canSpeak } from '../lib/speech';

function GuideModal({ game, onClose, playHref }: { game: GameInfo; onClose: () => void; playHref: string }) {
  return (
    <Modal
      title={game.name}
      onClose={onClose}
      icon={
        <IconTile tone={game.tone} size="sm">
          <game.icon size={20} />
        </IconTile>
      }
    >
      <p className="muted">{game.desc}</p>
      <h3>Cách chơi</h3>
      <ol className="rich" style={{ paddingLeft: 20, marginTop: 0 }}>
        {game.rules.map((r) => (
          <li key={r} style={{ margin: '6px 0' }}>
            {r}
          </li>
        ))}
      </ol>
      <p className="small">
        <b>Rèn luyện:</b> {game.skill}
      </p>
      <Link to={playHref} className="btn wide">
        <Play size={18} fill="currentColor" /> Chơi ngay
      </Link>
    </Modal>
  );
}

export default function Games() {
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const deck = params.get('deck') ?? 'all';
  const info = deckInfo(deck, p) ?? deckInfo('all', p)!;
  const size = deckWords(info.id, p).length;
  const [guide, setGuide] = useState<GameInfo | null>(null);
  const href = (g: GameInfo) => `/games/${g.id}?deck=${encodeURIComponent(info.id)}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Trò chơi từ vựng</h1>
          <p>Vừa chơi vừa nhớ từ. Mỗi câu đúng đều cộng XP cho cây của bạn, và kỷ lục của từng trò được lưu lại.</p>
        </div>
      </div>

      <div className="source-bar">
        <BookMarked size={20} />
        <span>
          Đang dùng: <b>{info.title}</b> · {formatNumber(size)} từ
        </span>
        <span className="spacer" />
        <select value={info.id} onChange={(e) => setParams({ deck: e.target.value }, { replace: true })} aria-label="Nguồn từ vựng">
          {sourceDeckIds(p).map((id) => (
            <option key={id} value={id}>
              {deckInfo(id, p)?.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid" style={{ gap: 14 }}>
        {GAMES.map((g) => {
          const best = p.games[g.id];
          const disabled = size < 6 || (g.needsSpeech && !canSpeak);
          return (
            <div key={g.id} className={`game-card tone-${g.tone} ${disabled ? 'disabled' : ''}`}>
              <IconTile tone={g.tone} size="lg">
                <g.icon size={30} />
              </IconTile>
              <div className="game-card-body">
                <h3>
                  {g.name} <span className={`tag loud tone-${g.tone}`}>{g.tag}</span>
                </h3>
                <p>{g.desc}</p>
                {best !== undefined && (
                  <p className="best">
                    <Trophy size={14} /> Kỷ lục: {best} {g.unit}
                  </p>
                )}
                {g.needsSpeech && !canSpeak && <p className="small">Trình duyệt này không hỗ trợ đọc phát âm.</p>}
              </div>
              <div className="game-card-actions">
                <button type="button" className="btn ghost" onClick={() => setGuide(g)}>
                  <Info size={18} /> Hướng dẫn
                </button>
                <Link to={href(g)} className="btn tone" aria-disabled={disabled}>
                  <Play size={18} fill="currentColor" /> Chơi ngay
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {size < 6 && <p className="muted center">Bộ này có ít hơn 6 từ. Hãy chọn nguồn từ vựng lớn hơn.</p>}

      <section className="card science">
        <h3>
          <Lightbulb size={20} /> Vì sao chơi giúp nhớ từ lâu hơn?
        </h3>
        <ul>
          <li>
            <b>Nhớ chủ động:</b> phải tự lục trí nhớ để trả lời giúp từ “bám” lâu hơn nhiều so với chỉ đọc lại.
          </li>
          <li>
            <b>Nhiều giác quan:</b> nhìn chữ, nghe phát âm và tự gõ lại tạo nhiều đường dẫn tới cùng một từ trong trí nhớ.
          </li>
          <li>
            <b>Áp lực thời gian vừa phải:</b> trò tốc độ và đúng/sai rèn khả năng nhận ra nghĩa ngay khi đọc, rất có ích trong IELTS Reading.
          </li>
          <li>
            <b>Chơi ngắn, chơi thường xuyên:</b> vài lượt mỗi ngày hiệu quả hơn một buổi dài mỗi tuần.
          </li>
        </ul>
      </section>

      {guide && <GuideModal game={guide} playHref={href(guide)} onClose={() => setGuide(null)} />}
    </div>
  );
}
