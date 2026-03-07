import { useMemo, useState } from 'react';
import { getOperationCost, type OperationType, validateOperationRange } from '@arena/shared';

const operatorMap: Record<string, OperationType> = {
  '+': 'add',
  '−': 'sub',
  '×': 'mul',
  '÷': 'div',
};

export const useCalculator = () => {
  const [operand, setOperand] = useState('');
  const [operatorSymbol, setOperatorSymbol] = useState<keyof typeof operatorMap>('+');

  const operationType = operatorMap[operatorSymbol];
  const operandNumber = Number(operand || '0');

  const isOperandValid = useMemo(() => {
    if (!operand || !Number.isInteger(operandNumber)) return false;
    return validateOperationRange(operationType, operandNumber);
  }, [operand, operandNumber, operationType]);

  const cost = isOperandValid ? getOperationCost(operationType, operandNumber) : null;

  const pushDigit = (digit: string) => {
    setOperand((prev) => {
      const next = prev === '0' ? digit : `${prev}${digit}`;
      return next.slice(0, 7);
    });
  };

  const clear = () => setOperand('');

  const backspace = () => setOperand((prev) => prev.slice(0, -1));

  return {
    operand,
    operationType,
    operatorSymbol,
    isOperandValid,
    cost,
    setOperatorSymbol,
    pushDigit,
    clear,
    backspace,
  };
};
