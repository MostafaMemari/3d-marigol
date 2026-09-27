interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function SliderRow({ label, value, min, max, step, onChange }: Props) {
  return (
    <label className="block px-1 py-1">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-gray-700">
        {label}
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600 tabular-nums">
          {value.toFixed(2)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="scene-slider w-full"
        style={{ ['--fill' as string]: `${((value - min) / (max - min)) * 100}%` }}
        aria-label={label}
      />
    </label>
  );
}
