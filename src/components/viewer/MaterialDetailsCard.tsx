import { X } from 'lucide-react';
import MaterialMapList from './MaterialMapList';
import { cn } from '../../lib/utils';
import type { MaterialMapKind, MaterialVariant } from '../../types/material';

interface Props {
  variant: MaterialVariant | null;
  thumbnails: Record<string, string>;
  extraImages: string[];
  solo: MaterialMapKind | null;
  onClose: () => void;
  onSolo: (kind: MaterialMapKind) => void;
  /** Layout override — the phone strip gives the card the full width. */
  className?: string;
}

/**
 * What the visitor just picked: the material's name plus the maps it ships.
 * Revealed after every selection, then dismissed, so a tap always answers
 * "which material is this, and what is in it?" without opening the settings.
 */
export default function MaterialDetailsCard({
  variant,
  thumbnails,
  extraImages,
  solo,
  onClose,
  onSolo,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-white/60 bg-white/90 p-3 shadow-[0_24px_60px_-16px_rgba(17,24,39,0.4)] backdrop-blur-2xl',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2.5">
        <p className="min-w-0 truncate text-[13.5px] font-bold tracking-tight text-gray-900">
          {variant?.name ?? 'Material'}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close material details"
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <MaterialMapList
        variant={variant}
        thumbnails={thumbnails}
        extraImages={extraImages}
        solo={solo}
        onSolo={onSolo}
      />
    </div>
  );
}
