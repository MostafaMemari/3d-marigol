import { useCallback, useState } from 'react';
import { DEFAULT_SCENE_SETTINGS, SCENE_PRESETS } from '../lib/constants';
import type { ScenePresetName, SceneSettings } from '../types/model';

/** Owns the scene-settings panel state; any manual tweak marks preset as custom. */
export function useSceneSettings() {
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SCENE_SETTINGS);

  const applyPreset = useCallback((name: ScenePresetName) => {
    setSettings(SCENE_PRESETS[name]);
  }, []);

  const update = useCallback((patch: Partial<SceneSettings>) => {
    setSettings((s) => ({ ...s, ...patch, preset: 'custom' as const }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SCENE_SETTINGS);
  }, []);

  return { settings, applyPreset, update, reset };
}
