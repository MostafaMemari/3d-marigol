import { Eye, Grid2x2 } from 'lucide-react';
import { TEXTURE_MAP_LABELS, TEXTURE_MAP_ORDER } from '../../lib/materialMaps';
import type { MaterialMapKind, MaterialVariant } from '../../types/material';

interface Props {
  variant: MaterialVariant | null;
  thumbnails: Record<string, string>;
  /** Images in the package that no material claimed. */
  extraImages: string[];
  solo: MaterialMapKind | null;
  onSolo: (kind: MaterialMapKind) => void;
}

/**
 * Channels the package provides for one material, each tappable to isolate it
 * in the preview. Shared by the settings panel and by the card that pops up
 * after a pick, so both always describe the material the same way.
 */
export default function MaterialMapList({
  variant,
  thumbnails,
  extraImages,
  solo,
  onSolo,
}: Props) {
  const maps = variant?.maps ?? {};
  const provided = TEXTURE_MAP_ORDER.filter((kind) => maps[kind]);
  const missing = TEXTURE_MAP_ORDER.length - provided.length;

  if (provided.length === 0) {
    return (
      <p className="px-1 text-[11.5px] leading-snug font-medium text-gray-400">
        This material has no texture maps in the package.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {provided.map((kind) => {
          const fileName = maps[kind];
          const thumb = fileName ? thumbnails[fileName] : undefined;
          const isActive = solo === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onSolo(kind)}
              aria-pressed={isActive}
              title={`Isolate ${TEXTURE_MAP_LABELS[kind]}`}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'border-brand/40 bg-brand-to/10 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-gray-100 object-cover"
                />
              ) : (
                <span className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] leading-tight font-bold text-gray-800">
                  {TEXTURE_MAP_LABELS[kind]}
                </span>
                <span className="block truncate font-mono text-[10.5px] text-gray-400">
                  {fileName}
                </span>
              </span>
              <Eye className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand' : 'text-gray-300'}`} />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-gray-400">
        <Grid2x2 className="h-3.5 w-3.5" />
        {provided.length} of {TEXTURE_MAP_ORDER.length} maps
        {missing > 0 && <span>· no {missing} provided</span>}
      </div>
      {extraImages.length > 0 && (
        <p className="mt-1.5 px-1 text-[11px] leading-snug font-medium text-gray-400">
          + {extraImages.length} more image{extraImages.length === 1 ? '' : 's'} in the package,
          e.g. {extraImages[0]}
        </p>
      )}
      {solo && (
        <p className="mt-1.5 px-1 text-[11px] font-medium text-brand">
          Channel view — tap the map again for the full PBR preview
        </p>
      )}
    </>
  );
}
