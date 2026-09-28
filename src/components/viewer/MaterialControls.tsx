import { Box, Circle, Square } from 'lucide-react';
import type { ComponentType } from 'react';
import SliderRow from '../ui/SliderRow';
import {
  MATERIAL_RELIEF_RANGE,
  MATERIAL_SHAPES,
  MATERIAL_TILE_RANGE,
} from '../../lib/constants';
import type { MaterialShape, MaterialVariant } from '../../types/material';

interface Props {
  /** The material on the canvas; the maps it ships are listed on the page. */
  active: MaterialVariant | null;
  shape: MaterialShape;
  tile: number;
  relief: number;
  onShape: (shape: MaterialShape) => void;
  onTile: (tile: number) => void;
  onRelief: (relief: number) => void;
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
  active,
  shape,
  tile,
  relief,
  onShape,
  onTile,
  onRelief,
}: Props) {
  const hasHeight = Boolean(active?.maps.height);

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
    </>
  );
}
