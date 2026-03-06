import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { MainMenuPage } from '../pages/MainMenuPage';
import { MatchPage } from '../pages/MatchPage';

export const App = (): JSX.Element => (
  <BrowserRouter>
    <nav className="p-2 flex gap-3 text-sm bg-slate-900">
      <Link to="/">Menu</Link>
      <Link to="/match">Match</Link>
    </nav>
    <Routes>
      <Route path="/" element={<MainMenuPage />} />
      <Route path="/match" element={<MatchPage />} />
    </Routes>
  </BrowserRouter>
);
