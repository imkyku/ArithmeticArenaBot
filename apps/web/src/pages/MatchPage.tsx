import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io((import.meta.env.VITE_WS_URL ?? 'http://localhost:3000') + '/match', { autoConnect: false });

export const MatchPage = (): JSX.Element => {
  const [value, setValue] = useState('100000000000000');
  const [target] = useState('999');
  const [elixir, setElixir] = useState(10);

  useEffect(() => {
    socket.connect();
    socket.emit('match:join', { matchId: 'demo' });
    socket.on('match:state', (payload: { currentValue: string; storedElixir: number }) => {
      setValue(payload.currentValue);
      setElixir(payload.storedElixir);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const canAct = useMemo(() => elixir > 0, [elixir]);

  return (
    <section className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Match</h2>
      <p>Target: {target}</p>
      <p>Your value: {value}</p>
      <p>Elixir: {elixir}/10</p>
      <button
        disabled={!canAct}
        className="rounded bg-violet-700 disabled:bg-slate-700 px-4 py-2"
        onClick={() =>
          socket.emit('match:operation', {
            matchId: 'demo',
            seq: Date.now(),
            operationType: 'add',
            operand: '5',
            currentValue: value,
            targetValue: target,
            storedElixir: elixir,
            lastElixirUpdateAt: Date.now(),
          })
        }
      >
        +5
      </button>
    </section>
  );
};
