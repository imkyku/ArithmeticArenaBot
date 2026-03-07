<<<<<<< HEAD
import type { OperationType } from '../types/game.js';
import { applyOperation } from './rules.js';
=======
import type { OperationType } from '../types/game';
import { applyOperation } from './rules';
>>>>>>> main

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const randomStart = (): bigint => {
  const first = Math.floor(Math.random() * 9) + 1;
  const rest = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  return BigInt(`${first}${rest}`);
};

export interface TargetGenerationResult {
  startNumber: string;
  targetNumber: string;
  hiddenOperations: { operationType: OperationType; operand: string }[];
}

export const generateReachableNumbers = (): TargetGenerationResult => {
  const opCount = 5 + Math.floor(Math.random() * 3);
  const start = randomStart();
  let current = start;
  const sequence: { operationType: OperationType; operand: string }[] = [];
  for (let i = 0; i < opCount; i += 1) {
    const operations: OperationType[] = ['add', 'sub', 'mul', 'div'];
    let applied = false;

    while (!applied && operations.length > 0) {
      const operationType = pick(operations);
      const idx = operations.indexOf(operationType);
      operations.splice(idx, 1);

      const operand =
        operationType === 'add' || operationType === 'sub'
          ? BigInt(1 + Math.floor(Math.random() * 3_000_000))
          : BigInt(2 + Math.floor(Math.random() * 9));

      try {
        const { nextValue } = applyOperation(current, current, operationType, operand);
        current = nextValue;
        sequence.push({ operationType, operand: operand.toString() });
        applied = true;
      } catch {
        // try another
      }
    }
  }

  return {
    startNumber: start.toString(),
    targetNumber: current.toString(),
    hiddenOperations: sequence,
  };
};
