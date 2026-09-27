import { Box, Circle, Eye, Grid2x2, Square } from 'lucide-react';
import type { ComponentType } from 'react';
import SliderRow from '../ui/SliderRow';
import { MATERIAL_RELIEF_RANGE, MATERIAL_SHAPES, MATERIAL_TILE_RANGE } from '../../lib/constants';
import { TEXTURE_MAP_LABELS, TEXTURE_MAP_ORDER } from '../../lib/materialMaps';
import type { MaterialMapKind, MaterialShape, MaterialSourceFile } from '../../types/material';

interface Props {
  files: MaterialSourceFile[];
  extraImages: string[];
  shape: MaterialShape;
  tile: number;
  relief: number;
  solo: MaterialMapKind | null;
  onShape: (shape: MaterialShape) => void;
  onTile: (tile: number) => void;
  onRelief: (relief: number) => void;
  onSolo: (kind: MaterialMapKind) => void;
}

const SHAPE_META: Record<MaterialShape, { icon: ComponentType<{ className?: string }>; label: string }> = {
  sphere: { icon: Circle, label: 'Sphere' },
  cube: { icon: Box, label: 'Cube' },
  plane: { icon: Square, label: 'Wall' },
};

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="px-1 text-[10.5px] font-bold tracking-[0.14em] text-gray-400 uppercase">
      {children}
    </p>
  );
}

/** Material-only controls, slotted above the shared scene settings. */
export default function MaterialControls({
  files,
  extraImages,
  shape,
  tile,
  relief,
  solo,
  onShape,
  onTile,
  onRelief,
  onSolo,
}: Props) {
  const hasHeight = files.some((file) => file.kind === 'height');
  const missing = TEXTURE_MAP_ORDER.length - files.length;

  return (
    <>
      <div>
        <SectionTitle>Preview Shape</SectionTitle>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MATERIAL_SHAPES.map((value) => {
            const { icon: Icon, label } = SHAPE_META[value];
            const active = shape === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onShape(value)}
                title={label}
                aria-label={`${label} preview`}
                aria-pressed={active}
                className={`group flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition-all duration-200 active:scale-95 ${
                  active
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-[11.5px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle>Texture</SectionTitle>
        <div className="mt-1 space-y-1">
          <SliderRow
            label="Tiling"
            value={tile}
            min={MATERIAL_TILE_RANGE.min}
            max={MATERIAL_TILE_RANGE.max}
            step={MATERIAL_TILE_RANGE.step}
            onChange={onTile}
          />
          {hasHeight && (
            <SliderRow
              label="Relief"
              value={relief}
              min={MATERIAL_RELIEF_RANGE.min}
              max={MATERIAL_RELIEF_RANGE.max}
              step={MATERIAL_RELIEF_RANGE.step}
              onChange={onRelief}
            />
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Detected Maps</SectionTitle>
        <div className="mt-2 space-y-1.5">
          {files.map((file) => {
            const active = solo === file.kind;
            return (
              <button
                key={file.kind}
                type="button"
                onClick={() => onSolo(file.kind)}
                aria-pressed={active}
                title={`Isolate ${TEXTURE_MAP_LABELS[file.kind]}`}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-brand/40 bg-brand-to/10 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <img
                  src={file.url}
                  alt={TEXTURE_MAP_LABELS[file.kind]}
                  className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-gray-100 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] leading-tight font-bold text-gray-800">
                    {TEXTURE_MAP_LABELS[file.kind]}
                  </span>
                  <span className="block truncate font-mono text-[10.5px] text-gray-400">
                    {file.name}
                  </span>
                </span>
                <Eye
                  className={`h-4 w-4 shrink-0 ${active ? 'text-brand' : 'text-gray-300'}`}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-gray-400">
          <Grid2x2 className="h-3.5 w-3.5" />
          {files.length} of {TEXTURE_MAP_ORDER.length} maps
          {missing > 0 && <span>· no {missing} provided</span>}
        </div>
        {extraImages.length > 0 && (
          <p className="mt-1.5 px-1 text-[11px] leading-snug font-medium text-gray-400">
            + {extraImages.length} more image{extraImages.length === 1 ? '' : 's'} in the
            package, e.g. {extraImages[0]}
          </p>
        )}
        {solo && (
          <p className="mt-1.5 px-1 text-[11px] font-medium text-brand">
            Channel view — tap the map again for the full PBR preview
          </p>
        )}
      </div>
    </>
  );
}
