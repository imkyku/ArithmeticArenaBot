import { describe, expect, it } from 'vitest';
import { applyOperation, calculateElo, computeElixir, getOperationCost, resolveByDistance } from '../../index';

describe('game rules', () => {
  it('calculates operation costs', () => {
    expect(getOperationCost('add', 20)).toBe(1);
    expect(getOperationCost('mul', 9)).toBe(4);
    expect(getOperationCost('div', 10)).toBe(5);
  });

  it('validates exact division in apply operation', () => {
    expect(() => applyOperation(10n, 1n, 'div', 3n)).toThrowError('division_not_exact');
    expect(applyOperation(12n, 10n, 'div', 3n).nextValue).toBe(4n);
  });

  it('regenerates elixir lazily', () => {
    const res = computeElixir(3, 0, 6100);
    expect(res.value).toBe(6);
    expect(res.recalculatedAt).toBe(6000);
  });

  it('resolves timeout by distance and draw', () => {
    expect(resolveByDistance(100n, 80n, 101n)).toBe('playerB');
    expect(resolveByDistance(100n, 98n, 102n)).toBe('draw');
  });

  it('calculates elo updates', () => {
    expect(calculateElo(1000, 1000, 1, 5)).toBe(1020);
  });
});
