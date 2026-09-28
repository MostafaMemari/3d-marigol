import { forwardRef, type KeyboardEvent } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import type { MaterialVariant } from '../../types/material';

export type SwatchSize = 'sm' | 'md';

interface Props {
  variant: MaterialVariant;
  /** Decoded preview of the base colour map, if the package produced one. */
  thumb?: string;
  active: boolean;
  /** Spins on the active swatch while its maps are still being decoded. */
  pending?: boolean;
  size?: SwatchSize;
  onSelect: () => void;
}

const SIZES: Record<SwatchSize, { box: string; thumb: string }> = {
  sm: { box: 'w-[62px]', thumb: 'h-12 w-12' },
  md: { box: 'w-[68px]', thumb: 'h-14 w-14' },
};

/**
 * One material as a tappable swatch. The name is deliberately not printed: the
 * thumbnail is what sells a texture, and the name arrives on the card that
 * opens after a pick (plus the native tooltip on hover).
 */
const MaterialSwatch = forwardRef<HTMLButtonElement, Props>(function MaterialSwatch(
  { variant, thumb, active, pending = false, size = 'md', onSelect },
  ref,
) {
  const dims = SIZES[size];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Enter/space already activate a button; arrows only move focus.
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowRight') return;
    const items = Array.from(
      event.currentTarget.closest('[data-materials]')?.querySelectorAll('button') ?? [],
    );
    const next = items[(items.indexOf(event.currentTarget) + 1) % items.length];
    next?.focus();
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-pressed={active}
      aria-label={`Show ${variant.name}`}
      title={variant.name}
      className={`group relative flex ${dims.box} shrink-0 cursor-pointer items-center justify-center rounded-xl border p-1 transition-all duration-200 active:scale-95 ${
        active
          ? 'border-brand/60 bg-brand-to/10 shadow-md ring-2 ring-brand/15'
          : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className={`${dims.thumb} rounded-lg border border-gray-200 bg-gray-100 object-cover transition-transform duration-200 group-hover:scale-105`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={`flex ${dims.thumb} items-center justify-center rounded-lg bg-gray-100`}>
          <Layers className="h-4 w-4 text-gray-300" />
        </span>
      )}
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" aria-hidden="true" />
          </span>
        </span>
      )}
    </button>
  );
});

export default MaterialSwatch;
