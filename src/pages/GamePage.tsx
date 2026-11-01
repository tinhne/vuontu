import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { gameById } from '../games/catalog';
import { deckInfo, deckWords } from '../lib/decks';
import { getProgress } from '../lib/progress';
import MatchGame from '../games/MatchGame';
import ScrambleGame from '../games/ScrambleGame';
import SpeedGame from '../games/SpeedGame';
import DictationGame from '../games/DictationGame';
import TrueFalseGame from '../games/TrueFalseGame';

export default function GamePage() {
  const { gameId = '' } = useParams();
  const [params] = useSearchParams();
  const [round, setRound] = useState(0);
  const game = gameById.get(gameId);
  const deck = params.get('deck') ?? 'all';
  // Stable pool so a re-render mid-game doesn't reshuffle the round.
  const pool = useMemo(() => deckWords(deck, getProgress()), [deck]);
  const info = deckInfo(deck, getProgress());

  if (!game || pool.length < 6) return <Navigate to="/games" replace />;

  const props = { pool, gameId: game.id, onAgain: () => setRound((r) => r + 1) };

  return (
    <div className="page narrow">
      <div className="study-head" style={{ marginBottom: 14 }}>
        <Link to={`/games?deck=${encodeURIComponent(deck)}`} className="back">
          <ChevronLeft size={18} /> {game.name}
        </Link>
        <span className="chip plain">{info?.title}</span>
      </div>
      {game.id === 'match' && <MatchGame key={round} {...props} />}
      {game.id === 'scramble' && <ScrambleGame key={round} {...props} />}
      {game.id === 'speed' && <SpeedGame key={round} {...props} />}
      {game.id === 'truefalse' && <TrueFalseGame key={round} {...props} />}
      {game.id === 'dictation' && <DictationGame key={round} {...props} />}
    </div>
  );
}
