import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Vocab from './pages/Vocab';
import DeckDetail from './pages/DeckDetail';
import Decks from './pages/Decks';
import Review from './pages/Review';
import Study from './pages/Study';
import Practice from './pages/Practice';
import Grammar from './pages/Grammar';
import GrammarLesson from './pages/GrammarLesson';
import Games from './pages/Games';
import GamePage from './pages/GamePage';
import Lookup from './pages/Lookup';
import History from './pages/History';
import SettingsPage from './pages/Settings';

function OldTopicLink() {
  const { topicId } = useParams();
  return <Navigate to={`/deck/topic:${topicId}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="vocab" element={<Vocab />} />
        <Route path="vocab/:topicId" element={<OldTopicLink />} />
        <Route path="deck/:deckId" element={<DeckDetail />} />
        <Route path="decks" element={<Decks />} />
        <Route path="review" element={<Review />} />
        <Route path="study" element={<Study />} />
        <Route path="practice" element={<Practice />} />
        <Route path="grammar" element={<Grammar />} />
        <Route path="grammar/:lessonId" element={<GrammarLesson />} />
        <Route path="games" element={<Games />} />
        <Route path="games/:gameId" element={<GamePage />} />
        <Route path="lookup" element={<Lookup />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
