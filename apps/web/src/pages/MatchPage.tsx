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
            storedElixir: elixir,
            lastElixirUpdateAt: Date.now(),
          })
        }
        onClear={clear}
        onBackspace={backspace}
        activeOperator={operatorSymbol}
        canSubmit={canSubmit}
      />
    </section>
  );
}
