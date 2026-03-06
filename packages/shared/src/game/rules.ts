import { absDistanceBigInt, digitLength, isExactDivision } from './math.js';
import type { OperationType } from '../types/game.js';

const MAX_RESULT_DIGITS = 18;

export const getOperationCost = (type: OperationType, operand: number): number => {
  if (type === 'add' || type === 'sub') {
    if (operand <= 9_999) return 1;
    if (operand <= 499_999) return 2;
    return 3;
  }
  if (type === 'mul') {
    if (operand <= 3) return 1;
    if (operand <= 6) return 2;
    if (operand <= 8) return 3;
    return 4;
  }
  if (operand <= 3) return 1;
  if (operand <= 5) return 2;
  if (operand <= 7) return 3;
  if (operand <= 9) return 4;
  return 5;
};

export const validateOperationRange = (type: OperationType, operand: number): boolean => {
  if (type === 'add' || type === 'sub') return operand >= 1 && operand <= 3_000_000;
  return operand >= 2 && operand <= 10;
};

export const applyOperation = (
  currentValue: bigint,
  targetValue: bigint,
  type: OperationType,
  operand: bigint,
): { nextValue: bigint; nextDistance: bigint } => {
  let nextValue: bigint;
  if (type === 'add') nextValue = currentValue + operand;
  else if (type === 'sub') nextValue = currentValue - operand;
  else if (type === 'mul') nextValue = currentValue * operand;
  else {
    if (!isExactDivision(currentValue, operand)) {
      throw new Error('division_not_exact');
    }
    nextValue = currentValue / operand;
  }

  if (nextValue < 0n) throw new Error('negative_result');
  if (digitLength(nextValue) > MAX_RESULT_DIGITS) throw new Error('digit_limit_exceeded');

  return { nextValue, nextDistance: absDistanceBigInt(nextValue, targetValue) };
};

export const computeElixir = (
  storedElixir: number,
  lastElixirUpdateAt: number,
  now: number,
  cap = 10,
): { value: number; recalculatedAt: number } => {
  if (now <= lastElixirUpdateAt) {
    return { value: Math.min(cap, storedElixir), recalculatedAt: lastElixirUpdateAt };
  }
  const regenerated = Math.floor((now - lastElixirUpdateAt) / 2000);
  const value = Math.min(cap, storedElixir + regenerated);
  const recalculatedAt = lastElixirUpdateAt + regenerated * 2000;
  return { value, recalculatedAt };
};

export const resolveByDistance = (
  targetValue: bigint,
  playerAValue: bigint,
  playerBValue: bigint,
): 'playerA' | 'playerB' | 'draw' => {
  const da = absDistanceBigInt(targetValue, playerAValue);
  const db = absDistanceBigInt(targetValue, playerBValue);
  if (da === db) return 'draw';
  return da < db ? 'playerA' : 'playerB';
};
