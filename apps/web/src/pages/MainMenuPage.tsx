import { motion } from 'framer-motion';
import { useT } from '../i18n/use-t';

export const MainMenuPage = (): JSX.Element => {
  const t = useT();
  return (
    <main className="p-4">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-4">
        {t.title}
      </motion.h1>
      <div className="grid gap-3">
        <button className="rounded bg-indigo-500 p-3">{t.playRanked}</button>
        <button className="rounded bg-slate-700 p-3">{t.friendMatch}</button>
        <button className="rounded bg-emerald-600 p-3">{t.leaderboard}</button>
      </div>
    </main>
  );
};
