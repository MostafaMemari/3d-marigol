import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Download, MousePointer2 } from "lucide-react";
import { useModelUrl } from "./hooks/useModelUrl";
import { useModelLoader } from "./hooks/useModelLoader";
import { useSceneSettings } from "./hooks/useSceneSettings";
import LoadingScreen from "./components/viewer/LoadingScreen";
import ErrorState from "./components/viewer/ErrorState";
import ViewerControls from "./components/viewer/ViewerControls";
import SettingsPanel from "./components/viewer/SettingsPanel";
import type { ModelViewerHandle } from "./components/viewer/ModelViewer";
import { BACKGROUND_CSS, buildProductUrl } from "./lib/constants";

const ModelViewer = lazy(() => import("./components/viewer/ModelViewer"));

export default function App() {
  const { id, modelUrl, isMissing } = useModelUrl();
  const loader = useModelLoader(isMissing ? null : modelUrl);
  const { settings, applyPreset, update, reset: resetScene } = useSceneSettings();
  const viewerRef = useRef<ModelViewerHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [spinEnabled, setSpinEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [overlayGone, setOverlayGone] = useState(false);

  useEffect(() => {
    setModelReady(false);
    setOverlayGone(false);
  }, [modelUrl]);

  useEffect(() => {
    if (!modelReady) return;
    const t = window.setTimeout(() => setOverlayGone(true), 750);
    return () => window.clearTimeout(t);
  }, [modelReady]);

  const handleReady = useCallback(() => setModelReady(true), []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => undefined);
  }, []);

  const showError = !isMissing && loader.status === "error";
  const showCanvas = !isMissing && !showError && loader.blobUrl !== null;
  const loadingVisible = !isMissing && !showError && (!modelReady || !overlayGone);
  const isDarkUi = settings.background === "dark" || settings.background === "transparent";

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden" style={{ background: BACKGROUND_CSS[settings.background] }}>
      {/* transparent-bg checkerboard */}
      {settings.background === "transparent" && <div className="checker-bg pointer-events-none absolute inset-0 opacity-60" />}

      {/* 3D canvas — the hero, fills the viewport */}
      <div className="absolute inset-0">
        {showCanvas && (
          <div className={modelReady ? "anim-viewer-in h-full w-full" : "h-full w-full opacity-0"}>
            <Suspense fallback={null}>
              <ModelViewer
                ref={viewerRef}
                blobUrl={loader.blobUrl as string}
                autoRotateEnabled={spinEnabled}
                showGrid={showGrid}
                settings={settings}
                modelId={id}
                onReady={handleReady}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* loading + error overlays */}
      {!isMissing && !showError && loader.blobUrl === null && (
        <LoadingScreen
          progress={loader.progress}
          loadedBytes={loader.loadedBytes}
          totalBytes={loader.totalBytes}
          modelId={id}
          leaving={false}
        />
      )}
      {showCanvas && loadingVisible && loader.blobUrl !== null && (
        <LoadingScreen
          progress={modelReady ? 100 : loader.progress}
          loadedBytes={loader.loadedBytes}
          totalBytes={loader.totalBytes}
          modelId={id}
          leaving={modelReady}
        />
      )}
      {isMissing && <ErrorState kind="missing-id" modelId={null} onRetry={() => window.location.reload()} />}
      {showError && <ErrorState kind={loader.errorKind ?? "network"} modelId={id} onRetry={loader.retry} />}

      {/* top floating bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="anim-fade-up pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-white/50 bg-white/75 py-2 pr-4 pl-2.5 shadow-lg shadow-gray-900/8 backdrop-blur-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 shadow-md shadow-indigo-600/25">
            {/* <Box className="h-4 w-4 text-white" strokeWidth={2.4} /> */}
            <img src="./logo.webp" alt="Marigol" className="h-4 w-4 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-bold tracking-tight text-gray-900">Marigol 3D</span>
            <span className="block font-mono text-[10.5px] font-medium text-gray-400">{id ? `#${id}` : "viewer"}</span>
          </span>
        </div>

        <div className="anim-fade-up stagger-1 pointer-events-auto flex items-center gap-2">
          {id && (
            <a
              href={buildProductUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-[13.5px] font-bold text-white shadow-xl shadow-gray-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/35 active:translate-y-0"
            >
              <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Get</span>
            </a>
          )}
        </div>
      </div>

      {/* right floating settings panel */}
      {showCanvas && (
        <SettingsPanel
          settings={settings}
          open={settingsOpen}
          onApplyPreset={applyPreset}
          onUpdate={update}
          onResetScene={resetScene}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* bottom floating toolbar */}
      {showCanvas && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2.5 px-4 sm:bottom-5">
          {modelReady && (
            <span
              className={`anim-fade-up pointer-events-none hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold backdrop-blur-xl sm:inline-flex ${
                isDarkUi
                  ? "border border-white/15 bg-black/35 text-white/80"
                  : "border border-white/60 bg-white/75 text-gray-500 shadow-lg shadow-gray-900/5"
              }`}
            >
              <MousePointer2 className="h-3 w-3" />
              Drag to rotate · Scroll to zoom · Right-drag to pan
            </span>
          )}
          <ViewerControls
            autoRotate={spinEnabled}
            showGrid={showGrid}
            settingsOpen={settingsOpen}
            onToggleRotate={() => setSpinEnabled((v) => !v)}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onToggleSettings={() => setSettingsOpen((v) => !v)}
            onReset={() => viewerRef.current?.resetCamera()}
            onFullscreen={toggleFullscreen}
            onScreenshot={() => viewerRef.current?.capture()}
          />
        </div>
      )}
    </div>
  );
}
