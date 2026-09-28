import { Box, Circle, Eye, Grid2x2, Layers, Square } from 'lucide-react';
import type { ComponentType } from 'react';
import SliderRow from '../ui/SliderRow';
import {
  MATERIAL_RELIEF_RANGE,
  MATERIAL_SHAPES,
  MATERIAL_THUMBNAIL_SIZE,
  MATERIAL_TILE_RANGE,
} from '../../lib/constants';
import { TEXTURE_MAP_LABELS, TEXTURE_MAP_ORDER } from '../../lib/materialMaps';
import type { MaterialMapKind, MaterialShape, MaterialVariant } from '../../types/material';

interface Props {
  variants: MaterialVariant[];
  active: MaterialVariant | null;
  activeIndex: number;
  thumbnails: Record<string, string>;
  extraImages: string[];
  shape: MaterialShape;
  tile: number;
  relief: number;
  solo: MaterialMapKind | null;
  onVariant: (index: number) => void;
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

function VariantStrip({
  variants,
  activeIndex,
  thumbnails,
  onVariant,
}: Pick<Props, 'variants' | 'activeIndex' | 'thumbnails' | 'onVariant'>) {
  if (variants.length < 2) return null;

  return (
    <>
      <SectionTitle>{`Materials (${variants.length})`}</SectionTitle>
      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {variants.map((variant, index) => {
          const active = index === activeIndex;
          const thumb = variant.maps.basecolor ? thumbnails[variant.maps.basecolor] : undefined;
          return (
            <button
              key={variant.name}
              type="button"
              onClick={() => onVariant(index)}
              aria-pressed={active}
              aria-label={`Preview ${variant.name}`}
              title={variant.name}
              className={`group flex w-[60px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border p-1 transition-all duration-200 active:scale-95 ${
                active
                  ? 'border-brand/50 bg-brand-to/10 shadow-md'
                  : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={variant.name}
                  width={MATERIAL_THUMBNAIL_SIZE / 2}
                  height={MATERIAL_THUMBNAIL_SIZE / 2}
                  className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-100 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Layers className="h-4 w-4 text-gray-300" />
                </span>
              )}
              <span
                className={`w-full truncate text-center text-[9.5px] leading-tight font-bold tracking-tight ${
                  active ? 'text-brand-from' : 'text-gray-500'
                }`}
              >
                {variant.name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Material-only controls, slotted above the shared scene settings. */
export default function MaterialControls({
  variants,
  active,
  activeIndex,
  thumbnails,
  extraImages,
  shape,
  tile,
  relief,
  solo,
  onVariant,
  onShape,
  onTile,
  onRelief,
  onSolo,
}: Props) {
  const maps = active?.maps ?? {};
  const provided = TEXTURE_MAP_ORDER.filter((kind) => maps[kind]);
  const hasHeight = Boolean(maps.height);

  return (
    <>
      <div>
        <SectionTitle>Preview Shape</SectionTitle>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MATERIAL_SHAPES.map((value) => {
            const { icon: Icon, label } = SHAPE_META[value];
            const isActive = shape === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onShape(value)}
                title={label}
                aria-label={`${label} preview`}
                aria-pressed={isActive}
                className={`group flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
                />
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

      <VariantStrip
        variants={variants}
        activeIndex={activeIndex}
        thumbnails={thumbnails}
        onVariant={onVariant}
      />

      <div>
        <SectionTitle>Maps in this Material</SectionTitle>
        <div className="mt-2 space-y-1.5">
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
                    alt={TEXTURE_MAP_LABELS[kind]}
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
                <Eye
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand' : 'text-gray-300'}`}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-gray-400">
          <Grid2x2 className="h-3.5 w-3.5" />
          {provided.length} of {TEXTURE_MAP_ORDER.length} maps
          {TEXTURE_MAP_ORDER.length - provided.length > 0 && (
            <span>· no {TEXTURE_MAP_ORDER.length - provided.length} provided</span>
          )}
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
