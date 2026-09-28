import { MousePointer2 } from 'lucide-react';
import ViewerControls from '../viewer/ViewerControls';
import { TooltipProvider } from '../ui/tooltip';
import { getInteractionHint } from '../../lib/constants';
import type { AssetType } from '../../types/model';
import { cn } from '../../lib/utils';

interface Props {
  assetType: AssetType;
  ready: boolean;
  isDarkUi: boolean;
  autoRotate: boolean;
  showGrid: boolean;
  settingsOpen: boolean;
  onToggleRotate: () => void;
  onToggleGrid: () => void;
  onToggleSettings: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  onScreenshot: () => void;
  showGridControl?: boolean;
}

/** Interaction hint pill plus the floating action toolbar. */
export default function BottomBar({
  assetType,
  ready,
  isDarkUi,
  autoRotate,
  showGrid,
  settingsOpen,
  onToggleRotate,
  onToggleGrid,
  onToggleSettings,
  onReset,
  onFullscreen,
  onScreenshot,
  showGridControl = true,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex flex-col items-center gap-2.5 px-3 sm:bottom-5 sm:px-4">
      {ready && (
        <span
          className={cn(
            'anim-fade-up pointer-events-none hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold backdrop-blur-xl sm:inline-flex',
            isDarkUi
              ? 'border border-white/15 bg-black/35 text-white/80'
              : 'bg-surface border-surface-border text-muted-foreground shadow-sm',
          )}
        >
          <MousePointer2 className="size-3" />
          {getInteractionHint(assetType)}
        </span>
      )}
      {/* The provider lives with its only consumer, keeping Radix's tooltip
          machinery out of the first-load bundle. */}
      <TooltipProvider>
        <ViewerControls
          autoRotate={autoRotate}
          showGrid={showGrid}
          settingsOpen={settingsOpen}
          onToggleRotate={onToggleRotate}
          onToggleGrid={onToggleGrid}
          onToggleSettings={onToggleSettings}
          onReset={onReset}
          onFullscreen={onFullscreen}
          onScreenshot={onScreenshot}
          showGridControl={showGridControl}
        />
      </TooltipProvider>
    </div>
  );
}
