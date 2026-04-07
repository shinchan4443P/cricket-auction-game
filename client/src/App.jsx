import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Auction from './pages/Auction';
import Match from './pages/Match';
import Results from './pages/Results';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-dark via-emerald-950 to-cricket-dark">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Lobby />} />
        <Route path="/room/:roomId/auction" element={<Auction />} />
        <Route path="/room/:roomId/match" element={<Match />} />
        <Route path="/room/:roomId/results" element={<Results />} />
      </Routes>
    </div>
  );
}
