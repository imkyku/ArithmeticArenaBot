import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

const MainMenuPage = lazy(() => import('../pages/MainMenuPage'));
const MatchPage = lazy(() => import('../pages/MatchPage'));

export const App = () => (
  <BrowserRouter>
    <nav className="p-2 flex gap-3 text-sm bg-slate-900">
      <Link to="/">Menu</Link>
      <Link to="/match">Match</Link>
    </nav>
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Routes>
        <Route path="/" element={<MainMenuPage />} />
        <Route path="/match" element={<MatchPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
