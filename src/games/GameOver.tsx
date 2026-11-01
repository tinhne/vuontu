import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { IconTile } from '../components/ui';
import type { Word } from '../types';

interface Props {
  title: string;
  detail: ReactNode;
  xp: number;
  record: boolean;
  onAgain: () => void;
}

export default function GameOver({ title, detail, xp, record, onAgain }: Props) {
  return (
    <div className="card summary">
      <IconTile tone="amber" size="lg">
        <Trophy size={30} />
      </IconTile>
      <h1>{title}</h1>
      <p className="muted">{detail}</p>
      {record && <p className="record">🏆 Kỷ lục mới!</p>}
      <p className="big-number">+{xp} XP</p>
      <div className="btn-row center">
        <button type="button" className="btn" onClick={onAgain} autoFocus>
          Chơi lại
        </button>
        <Link to="/games" className="btn ghost">
          Trò chơi khác
        </Link>
      </div>
    </div>
  );
}

export interface GameProps {
  pool: Word[];
  gameId: string;
  onAgain: () => void;
}
