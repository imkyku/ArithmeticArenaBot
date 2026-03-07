<<<<<<< HEAD
import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

const MainMenuPage = lazy(() => import('../pages/MainMenuPage'));
const MatchPage = lazy(() => import('../pages/MatchPage'));

export const App = () => (
=======
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { MainMenuPage } from '../pages/MainMenuPage';
import { MatchPage } from '../pages/MatchPage';

export const App = (): JSX.Element => (
>>>>>>> main
  <BrowserRouter>
    <nav className="p-2 flex gap-3 text-sm bg-slate-900">
      <Link to="/">Menu</Link>
      <Link to="/match">Match</Link>
    </nav>
<<<<<<< HEAD
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Routes>
        <Route path="/" element={<MainMenuPage />} />
        <Route path="/match" element={<MatchPage />} />
      </Routes>
    </Suspense>
=======
    <Routes>
      <Route path="/" element={<MainMenuPage />} />
      <Route path="/match" element={<MatchPage />} />
    </Routes>
>>>>>>> main
  </BrowserRouter>
);
