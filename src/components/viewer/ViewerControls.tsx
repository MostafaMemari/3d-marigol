import { Camera, Grid3x3, Maximize, Pause, Play, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  autoRotate: boolean;
  showGrid: boolean;
  settingsOpen: boolean;
  onToggleRotate: () => void;
  onToggleGrid: () => void;
  onToggleSettings: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  onScreenshot: () => void;
}

function BarButton({
  tip,
  label,
  active,
  onClick,
  children,
}: {
  tip: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tip={tip}
      aria-label={label}
      aria-pressed={active}
      className={`tip flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 active:scale-90 sm:h-10 sm:w-10 ${
        active
          ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
          : 'text-gray-500 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
      }`}
    >
      <span className="transition-transform duration-200">{children}</span>
    </button>
  );
}

export default function ViewerControls({
  autoRotate,
  showGrid,
  settingsOpen,
  onToggleRotate,
  onToggleGrid,
  onToggleSettings,
  onReset,
  onFullscreen,
  onScreenshot,
}: Props) {
  const icon = 'h-[18px] w-[18px]';
  return (
    <div className="anim-fade-up stagger-3 pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/60 bg-white/85 p-1.5 shadow-[0_16px_45px_-12px_rgba(17,24,39,0.28)] backdrop-blur-xl">
      <BarButton tip="Reset camera" label="Reset camera" onClick={onReset}>
        <RotateCcw className={`${icon} transition-transform duration-300 hover:-rotate-90`} />
      </BarButton>

      <div className="hidden h-6 w-px shrink-0 bg-gray-200/80 sm:block" />

      <BarButton
        tip={autoRotate ? 'Pause rotation' : 'Auto-rotate'}
        label="Toggle auto-rotate"
        active={autoRotate}
        onClick={onToggleRotate}
      >
        {autoRotate ? <Pause className={icon} /> : <Play className={icon} />}
      </BarButton>

      <BarButton
        tip={showGrid ? 'Hide grid' : 'Show grid'}
        label="Toggle grid"
        active={showGrid}
        onClick={onToggleGrid}
      >
        <Grid3x3 className={icon} />
      </BarButton>

      <BarButton
        tip="Scene settings"
        label="Toggle scene settings"
        active={settingsOpen}
        onClick={onToggleSettings}
      >
        <SlidersHorizontal className={icon} />
      </BarButton>

      <div className="hidden h-6 w-px shrink-0 bg-gray-200/80 sm:block" />

      <BarButton tip="Save screenshot" label="Take screenshot" onClick={onScreenshot}>
        <Camera className={icon} />
      </BarButton>

      <BarButton tip="Fullscreen" label="Enter fullscreen" onClick={onFullscreen}>
        <Maximize className={icon} />
      </BarButton>
    </div>
  );
}
