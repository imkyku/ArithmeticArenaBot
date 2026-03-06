import clsx from 'clsx';

type Variant = 'digit' | 'operator' | 'action' | 'confirm';

interface Props {
  label: string;
  onClick: () => void;
  variant?: Variant;
  disabled?: boolean;
}

export const CalculatorButton = ({ label, onClick, variant = 'digit', disabled }: Props) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'h-16 rounded-2xl text-2xl font-semibold transition active:scale-95 disabled:opacity-40',
        variant === 'digit' && 'bg-slate-800 text-white',
        variant === 'operator' && 'bg-amber-500 text-slate-950',
        variant === 'action' && 'bg-slate-700 text-slate-200 text-lg',
        variant === 'confirm' && 'bg-emerald-500 text-slate-950',
      )}
    >
      {label}
    </button>
  );
};
