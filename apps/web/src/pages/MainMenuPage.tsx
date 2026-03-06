import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/use-t';
import { matchmakingSocket } from '../services/socket';

export default function MainMenuPage() {
  const t = useT();
  const navigate = useNavigate();

  const startMatchmaking = () => {
    if (!matchmakingSocket.connected) {
      matchmakingSocket.connect();
    }
    matchmakingSocket.emit('matchmaking:join', { rating: 1000 });
    navigate('/match');
  };

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold">
        {t.title}
      </motion.h1>
      <p className="text-slate-400">PvP cybersport calculator inside Telegram Mini App.</p>
      <div className="grid gap-3">
        <button className="rounded-xl bg-indigo-500 p-4 text-lg font-semibold" onClick={startMatchmaking}>
          {t.playRanked}
        </button>
        <button className="rounded-xl bg-slate-700 p-4 text-lg font-semibold">{t.friendMatch}</button>
        <button className="rounded-xl bg-emerald-600 p-4 text-lg font-semibold">{t.leaderboard}</button>
      </div>
    </main>
  );
}
