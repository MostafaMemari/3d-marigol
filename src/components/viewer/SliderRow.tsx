import type { ReactNode } from 'react';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Decimal places in the value chip; 0 renders `2` instead of `2.00`. */
  digits?: number;
}

/** Labelled slider row used by both the scene and material panels. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  digits = 2,
}: Props) {
  return (
    <div className="px-1 py-1.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-foreground text-[13px] font-medium">{label}</span>
        <span className="bg-muted text-muted-foreground inline-flex h-5 min-w-9 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold tabular-nums">
          {value.toFixed(digits)}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(next) => onChange(next[0])}
      />
    </div>
  );
}

/** Icon + label + switch row for the lighting toggles. */
export function SwitchRow({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="hover:bg-accent/60 flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 transition-colors">
      <span className="text-foreground flex items-center gap-2 text-[13px] font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground px-1 text-[10.5px] font-bold tracking-[0.14em] uppercase">
      {children}
    </p>
  );
}

export default SliderRow;
