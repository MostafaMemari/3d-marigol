import type { ReactNode } from 'react';
import { Aperture, Lightbulb, Moon, Package, RotateCcw, Scan, X } from 'lucide-react';
import SliderRow from '../ui/SliderRow';
import Toggle from '../ui/Toggle';
import { BACKGROUND_OPTIONS, PRESET_ORDER, SCENE_PRESETS } from '../../lib/constants';
import type { BackgroundOption, ScenePresetName, SceneSettings } from '../../types/model';

interface Props {
  settings: SceneSettings;
  open: boolean;
  onApplyPreset: (name: ScenePresetName) => void;
  onUpdate: (patch: Partial<SceneSettings>) => void;
  onResetScene: () => void;
  onClose: () => void;
  /** Panel heading — material preview labels it after its own controls. */
  title?: string;
  /** Extra sections rendered above the scene settings. */
  children?: ReactNode;
}

const PRESET_META: Record<ScenePresetName, { icon: typeof Scan; hint: string }> = {
  studio: { icon: Scan, hint: 'Soft daylight' },
  product: { icon: Package, hint: 'Warm showcase' },
  dark: { icon: Moon, hint: 'Moody stage' },
  wireframe: { icon: Aperture, hint: 'Mesh inspect' },
};

const BG_SWATCH: Record<BackgroundOption, string> = {
  white: '#f4f4f5',
  gray: '#8e939e',
  dark: '#101218',
  transparent: 'conic-gradient(#cbd5e1 25%, #ffffff 0 50%, #cbd5e1 0 75%, #ffffff 0)',
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 text-[10.5px] font-bold tracking-[0.14em] text-gray-400 uppercase">
      {children}
    </p>
  );
}

export default function SettingsPanel({
  settings,
  open,
  onApplyPreset,
  onUpdate,
  onResetScene,
  onClose,
  title = 'Scene Settings',
  children,
}: Props) {
  return (
    <aside
      className={`pointer-events-auto absolute top-16 right-3 z-30 flex max-h-[calc(100%-7.5rem)] w-[224px] max-w-[calc(100vw-4.5rem)] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/78 shadow-[0_24px_60px_-16px_rgba(17,24,39,0.35)] backdrop-blur-2xl transition-all duration-300 ease-out sm:right-4 sm:w-[248px] ${
        open
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none translate-x-6 opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="text-[13.5px] font-bold tracking-tight text-gray-900">{title}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onResetScene}
            title="Reset scene"
            aria-label="Reset scene settings"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3.5">
        {children}

        <div>
          <SectionTitle>Preset</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PRESET_ORDER.map((name) => {
              const Icon = PRESET_META[name].icon;
              const active = settings.preset === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onApplyPreset(name)}
                  className={`group flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all duration-200 active:scale-95 ${
                    active
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="text-[12.5px] font-bold capitalize">{name}</span>
                  <span className={`text-[10.5px] leading-tight ${active ? 'text-white/60' : 'text-gray-400'}`}>
                    {name === 'studio'
                      ? SCENE_PRESETS.studio.background
                      : PRESET_META[name].hint}
                  </span>
                </button>
              );
            })}
          </div>
          {settings.preset === 'custom' && (
            <p className="mt-1.5 px-1 text-[11px] font-medium text-brand">
              Custom mix — pick a preset to restart
            </p>
          )}
        </div>

        <div>
          <SectionTitle>Lighting</SectionTitle>
          <div className="mt-1">
            <Toggle
              label="Shadows"
              icon={<Moon className="h-3.5 w-3.5" />}
              checked={settings.shadows}
              onChange={() => onUpdate({ shadows: !settings.shadows })}
            />
            <Toggle
              label="Wireframe"
              icon={<Aperture className="h-3.5 w-3.5" />}
              checked={settings.wireframe}
              onChange={() => onUpdate({ wireframe: !settings.wireframe })}
            />
          </div>
          <div className="mt-1 space-y-1">
            <SliderRow
              label="Main Light"
              value={settings.mainLight}
              min={0}
              max={3}
              step={0.05}
              onChange={(v) => onUpdate({ mainLight: v })}
            />
            <SliderRow
              label="Ambient Light"
              value={settings.ambientLight}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => onUpdate({ ambientLight: v })}
            />
          </div>
          <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl px-1 py-1.5 transition-colors hover:bg-gray-100/70">
            <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
              <Lightbulb className="h-3.5 w-3.5 text-gray-400" />
              Light Color
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-gray-400 uppercase">
                {settings.lightColor}
              </span>
              <span
                className="h-6 w-6 overflow-hidden rounded-full border border-gray-200 shadow-inner"
                style={{ background: settings.lightColor }}
              >
                <input
                  type="color"
                  value={settings.lightColor}
                  onChange={(e) => onUpdate({ lightColor: e.target.value })}
                  className="h-full w-full cursor-pointer opacity-0"
                  aria-label="Light color"
                />
              </span>
            </span>
          </label>
        </div>

        <div>
          <SectionTitle>Render &amp; Environment</SectionTitle>
          <div className="mt-1">
            <SliderRow
              label="Exposure"
              value={settings.exposure}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => onUpdate({ exposure: v })}
            />
          </div>
          <p className="mt-1.5 mb-1.5 px-1 text-[13px] font-medium text-gray-700">Background</p>
          <div className="grid grid-cols-4 gap-1.5 px-1">
            {BACKGROUND_OPTIONS.map((bg) => {
              const active = settings.background === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => onUpdate({ background: bg })}
                  title={`${bg} background`}
                  aria-label={`${bg} background`}
                  aria-pressed={active}
                  className={`h-9 cursor-pointer rounded-lg border-2 transition-all duration-200 active:scale-90 ${
                    active
                      ? 'border-gray-900 shadow-md'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ background: BG_SWATCH[bg] }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
