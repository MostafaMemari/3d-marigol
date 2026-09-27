import type { ReactNode } from 'react';

interface Props {
  label: string;
  icon: ReactNode;
  checked: boolean;
  onChange: () => void;
}

export default function Toggle({ label, icon, checked, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-1 py-1.5 transition-colors hover:bg-gray-100/70"
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
        <span className="text-gray-400">{icon}</span>
        {label}
      </span>
      <span
        className={`relative h-[22px] w-[38px] rounded-full transition-colors duration-200 ${
          checked ? 'bg-gray-900' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
            checked ? 'left-[19px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );
}
