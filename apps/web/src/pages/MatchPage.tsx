<<<<<<< HEAD
import { useMemo } from 'react';
import { CalculatorKeypad } from '../components/game/CalculatorKeypad';
import { useCalculator } from '../game/useCalculator';
import { useMatchRealtime } from '../hooks/useMatchRealtime';

const MATCH_ID = 'demo';

export default function MatchPage() {
  const { connected, error, currentValue, targetValue, elixir, submitOperation } = useMatchRealtime(MATCH_ID);
  const { operand, operationType, operatorSymbol, isOperandValid, cost, setOperatorSymbol, pushDigit, clear, backspace } =
    useCalculator();

  const canSubmit = useMemo(() => isOperandValid && cost !== null && elixir >= cost, [cost, elixir, isOperandValid]);

  return (
    <section className="mx-auto max-w-md p-4 space-y-4">
      <header className="rounded-2xl bg-slate-900 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{connected ? '🟢 Online' : '🟠 Reconnecting...'}</span>
          <span>Elixir: {elixir}/10</span>
        </div>
        <p className="text-slate-400 text-sm">Target</p>
        <p className="text-2xl font-bold text-emerald-400 tracking-wide">{targetValue}</p>
        <p className="text-slate-400 text-sm">Your value</p>
        <p className="text-xl font-semibold tracking-wide">{currentValue}</p>
        <p className="text-slate-400 text-sm">Input</p>
        <p className="text-2xl font-bold">{operatorSymbol + (operand || '0')}</p>
        {cost !== null ? <p className="text-xs text-slate-400">Elixir cost: {cost}</p> : null}
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </header>

      <CalculatorKeypad
        onDigit={pushDigit}
        onOperator={setOperatorSymbol}
        onSubmit={() =>
          submitOperation({
            matchId: MATCH_ID,
            seq: Date.now(),
            operationType,
            operand,
            currentValue,
            targetValue,
=======
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
>>>>>>> main
            storedElixir: elixir,
            lastElixirUpdateAt: Date.now(),
          })
        }
<<<<<<< HEAD
        onClear={clear}
        onBackspace={backspace}
        activeOperator={operatorSymbol}
        canSubmit={canSubmit}
      />
    </section>
  );
}
=======
      >
        +5
      </button>
    </section>
  );
};
>>>>>>> main
