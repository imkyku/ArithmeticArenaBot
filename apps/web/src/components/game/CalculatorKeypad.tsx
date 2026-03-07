import { CalculatorButton } from '../../ui/CalculatorButton';

interface Props {
  onDigit: (value: string) => void;
  onOperator: (value: '+' | '−' | '×' | '÷') => void;
  onSubmit: () => void;
  onClear: () => void;
  onBackspace: () => void;
  activeOperator: '+' | '−' | '×' | '÷';
  canSubmit: boolean;
}

export const CalculatorKeypad = ({
  onDigit,
  onOperator,
  onSubmit,
  onClear,
  onBackspace,
  activeOperator,
  canSubmit,
}: Props) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {['7', '8', '9'].map((n) => (
        <CalculatorButton key={n} label={n} onClick={() => onDigit(n)} />
      ))}
      <CalculatorButton label="÷" onClick={() => onOperator('÷')} variant="operator" disabled={activeOperator === '÷'} />

      {['4', '5', '6'].map((n) => (
        <CalculatorButton key={n} label={n} onClick={() => onDigit(n)} />
      ))}
      <CalculatorButton label="×" onClick={() => onOperator('×')} variant="operator" disabled={activeOperator === '×'} />

      {['1', '2', '3'].map((n) => (
        <CalculatorButton key={n} label={n} onClick={() => onDigit(n)} />
      ))}
      <CalculatorButton label="−" onClick={() => onOperator('−')} variant="operator" disabled={activeOperator === '−'} />

      <CalculatorButton label="C" onClick={onClear} variant="action" />
      <CalculatorButton label="0" onClick={() => onDigit('0')} />
      <CalculatorButton label="⌫" onClick={onBackspace} variant="action" />
      <CalculatorButton label="+" onClick={() => onOperator('+')} variant="operator" disabled={activeOperator === '+'} />

      <div className="col-span-4">
        <CalculatorButton label="=" onClick={onSubmit} variant="confirm" disabled={!canSubmit} />
      </div>
    </div>
  );
};
