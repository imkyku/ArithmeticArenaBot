import type { OperationType } from '@arena/shared';

export interface CalculatorInput {
  operationType: OperationType;
  operand: string;
}
