import type { ReactNode } from 'react';
import { Sheet, SheetContent } from '../ui/sheet';
import SettingsPanel, { SettingsPanelContent } from '../viewer/SettingsPanel';
import { useIsWide } from '../../hooks/useMediaQuery';
import type { ScenePresetName, SceneSettings } from '../../types/model';

/**
 * One settings surface, two presentations: a floating aside on tablets and
 * desktops, a bottom sheet on phones where a side panel would cover the
 * canvas. Only one is mounted, so the sheet never locks desktop scrolling.
 */
interface Props {
  settings: SceneSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyPreset: (name: ScenePresetName) => void;
  onUpdate: (patch: Partial<SceneSettings>) => void;
  onResetScene: () => void;
  title?: string;
  children?: ReactNode;
}

export default function SettingsDrawer({
  settings,
  open,
  onOpenChange,
  onApplyPreset,
  onUpdate,
  onResetScene,
  title,
  children,
}: Props) {
  const isWide = useIsWide();

  const content = (
    <SettingsPanelContent
      settings={settings}
      onApplyPreset={onApplyPreset}
      onUpdate={onUpdate}
      onResetScene={onResetScene}
      onClose={() => onOpenChange(false)}
      title={title}
    >
      {children}
    </SettingsPanelContent>
  );

  if (isWide) {
    return (
      <SettingsPanel
        settings={settings}
        open={open}
        onApplyPreset={onApplyPreset}
        onUpdate={onUpdate}
        onResetScene={onResetScene}
        onClose={() => onOpenChange(false)}
        title={title}
      >
        {children}
      </SettingsPanel>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-surface border-surface-border backdrop-blur-2xl"
        aria-label="Scene settings"
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}
