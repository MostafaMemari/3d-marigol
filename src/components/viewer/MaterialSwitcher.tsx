import { useEffect, useRef, useState } from 'react';
import MaterialSwatch, { type SwatchSize } from './MaterialSwatch';
import MaterialDetailsCard from './MaterialDetailsCard';
import { useIsWide } from '../../hooks/useMediaQuery';
import { MATERIAL_DETAILS_TIMEOUT } from '../../lib/constants';
import { cn } from '../../lib/utils';
import type { MaterialMapKind, MaterialVariant } from '../../types/material';

interface Props {
  variants: MaterialVariant[];
  activeIndex: number;
  thumbnails: Record<string, string>;
  extraImages: string[];
  solo: MaterialMapKind | null;
  /** True while the chosen material's maps are still being decoded. */
  pending: boolean;
  onVariant: (index: number) => void;
  onSolo: (kind: MaterialMapKind) => void;
}

/**
 * Material switcher that lives on the canvas instead of inside the settings
 * panel — most visitors never open the panel, so the package's materials would
 * otherwise stay invisible to them.
 *
 * One presentation per form factor: a rail down the left edge on tablets and
 * desktops, a strip above the toolbar on phones, where a rail would eat the
 * canvas. Only one is mounted, matching how the settings surface is split.
 */
export default function MaterialSwitcher({
  variants,
  activeIndex,
  thumbnails,
  extraImages,
  solo,
  pending,
  onVariant,
  onSolo,
}: Props) {
  const isWide = useIsWide();
  const listRef = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const active = variants[activeIndex] ?? null;

  // Keeps the active material visible when the list is longer than the rail.
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex, variants, isWide]);

  // The card answers the tap and then gets out of the way — unless a channel is
  // isolated, which is a deliberate inspection the user has to end.
  useEffect(() => {
    if (!detailsOpen || solo) return;
    const timer = window.setTimeout(() => setDetailsOpen(false), MATERIAL_DETAILS_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [detailsOpen, solo, activeIndex]);

  if (variants.length < 2) return null;

  /** A new pick always reveals; tapping the current one puts the card away. */
  const select = (index: number) => {
    onVariant(index);
    setDetailsOpen((open) => (index === activeIndex ? !open : true));
  };

  const swatchSize: SwatchSize = isWide ? 'md' : 'sm';
  const list = (
    <div
      ref={listRef}
      data-materials
      role="group"
      aria-label="Materials in this package"
      className={cn(
        'flex gap-1.5',
        isWide
          ? 'flex-col items-center overflow-y-auto overscroll-y-contain p-2'
          : 'min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth',
      )}
    >
      {variants.map((variant, index) => (
        <MaterialSwatch
          key={variant.name}
          variant={variant}
          thumb={variant.maps.basecolor ? thumbnails[variant.maps.basecolor] : undefined}
          active={index === activeIndex}
          pending={pending && index === activeIndex}
          size={swatchSize}
          onSelect={() => select(index)}
        />
      ))}
    </div>
  );

  const card = (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        detailsOpen
          ? 'visible translate-y-0 scale-100 opacity-100'
          : 'invisible translate-y-3 scale-[0.97] opacity-0',
      )}
    >
      <MaterialDetailsCard
        variant={active}
        thumbnails={thumbnails}
        extraImages={extraImages}
        solo={solo}
        onClose={() => setDetailsOpen(false)}
        onSolo={onSolo}
        className={isWide ? undefined : 'w-full'}
      />
    </div>
  );

  if (!isWide) {
    return (
      <>
        <div className="anim-fade-up pointer-events-auto absolute inset-x-3 bottom-[4.75rem] z-30 rounded-2xl border border-white/60 bg-white/85 p-1.5 shadow-[0_16px_45px_-12px_rgba(17,24,39,0.28)] backdrop-blur-xl">
          {list}
        </div>
        <div className="pointer-events-auto absolute inset-x-3 bottom-40 z-30">{card}</div>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-auto absolute top-1/2 left-3 z-30 -translate-y-1/2 sm:left-4">
        <div className="anim-fade-up stagger-2 flex max-h-[calc(100dvh-13rem)] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/78 shadow-[0_24px_60px_-16px_rgba(17,24,39,0.35)] backdrop-blur-2xl">
          {list}
        </div>
      </div>
      <div className="pointer-events-auto absolute top-1/2 left-[7.25rem] z-30 -translate-y-1/2">
        {card}
      </div>
    </>
  );
}
