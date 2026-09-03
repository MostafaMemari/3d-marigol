import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Cuboid, MousePointer2, Move3d, ZoomIn } from 'lucide-react';
import { useModelUrl } from './hooks/useModelUrl';
import { useModelLoader } from './hooks/useModelLoader';
import LoadingScreen from './components/viewer/LoadingScreen';
import ErrorState from './components/viewer/ErrorState';
import ViewerControls from './components/viewer/ViewerControls';
import type { ModelViewerHandle } from './components/viewer/ModelViewer';
import { APP_NAME, APP_TAGLINE, APP_TITLE, formatBytes } from './lib/constants';

const ModelViewer = lazy(() => import('./components/viewer/ModelViewer'));

function Header({ modelId }: { modelId: string | null }) {
  return (
    <header className="anim-fade-up sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 shadow-lg shadow-indigo-600/25">
            <Box className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-gray-900">
              {APP_NAME} <span className="font-medium text-gray-400">·</span>{' '}
              <span className="font-semibold text-gray-600">{APP_TITLE}</span>
            </p>
            <p className="text-[12px] font-medium text-gray-400">{APP_TAGLINE}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {modelId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-[12px] font-semibold text-gray-700">
              <Cuboid className="h-3.5 w-3.5 text-indigo-500" />
              #{modelId}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700">
              No model selected
            </span>
          )}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
      </div>
    </header>
  );
}

function HintPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-500 shadow-sm">
      {icon}
      {label}
    </span>
  );
}

export default function App() {
  const { id, modelUrl, isMissing } = useModelUrl();
  const loader = useModelLoader(isMissing ? null : modelUrl);
  const viewerRef = useRef<ModelViewerHandle>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [overlayGone, setOverlayGone] = useState(false);

  // Reset reveal state whenever a new model starts loading
  useEffect(() => {
    setModelReady(false);
    setOverlayGone(false);
  }, [modelUrl]);

  // After the 3D scene signals ready, keep the loader for a beat then fade it out
  useEffect(() => {
    if (!modelReady) return;
    const t = window.setTimeout(() => setOverlayGone(true), 750);
    return () => window.clearTimeout(t);
  }, [modelReady]);

  const handleReady = useCallback(() => setModelReady(true), []);

  const showError = !isMissing && loader.status === 'error';
  const showCanvas = !isMissing && !showError && loader.blobUrl !== null;
  const loadingVisible = !isMissing && !showError && (!modelReady || !overlayGone);

  return (
    <div className="flex min-h-full flex-col bg-[#f7f7f8]">
      <Header modelId={id} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
        {/* Viewer card */}
        <section className="anim-fade-up stagger-1 relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-[0_30px_80px_-30px_rgba(79,70,229,0.3)]">
          {/* top gradient hairline */}
          <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

          <div className="relative h-[62vh] min-h-[420px] w-full sm:h-[68vh] lg:h-[70vh]">
            {isMissing && (
              <ErrorState kind="missing-id" modelId={null} onRetry={() => window.location.reload()} />
            )}

            {showError && (
              <ErrorState
                kind={loader.errorKind ?? 'network'}
                modelId={id}
                onRetry={loader.retry}
              />
            )}

            {!isMissing && !showError && loader.blobUrl === null && (
              <LoadingScreen
                progress={loader.progress}
                loadedBytes={loader.loadedBytes}
                totalBytes={loader.totalBytes}
                modelId={id}
                leaving={false}
              />
            )}

            {showCanvas && (
              <div className={modelReady ? 'anim-viewer-in h-full w-full' : 'h-full w-full opacity-0'}>
                <Suspense fallback={null}>
                  <ModelViewer
                    ref={viewerRef}
                    blobUrl={loader.blobUrl as string}
                    autoRotate={autoRotate}
                    showGrid={showGrid}
                    modelId={id}
                    onReady={handleReady}
                  />
                </Suspense>
              </div>
            )}

            {showCanvas && loadingVisible && (
              <LoadingScreen
                progress={modelReady ? 100 : loader.progress}
                loadedBytes={loader.loadedBytes}
                totalBytes={loader.totalBytes}
                modelId={id}
                leaving={modelReady}
              />
            )}

            {/* floating top chips */}
            {showCanvas && modelReady && (
              <>
                <div className="anim-fade-up stagger-2 pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-gray-700 shadow-lg shadow-gray-900/5 backdrop-blur-xl">
                    <MousePointer2 className="h-3.5 w-3.5 text-indigo-500" />
                    Drag to explore
                  </span>
                </div>
                <div className="anim-fade-up stagger-3 pointer-events-none absolute top-4 right-4 z-20 hidden sm:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 font-mono text-[11.5px] font-medium text-gray-500 shadow-lg shadow-gray-900/5 backdrop-blur-xl tabular-nums">
                    {loader.totalBytes ? formatBytes(loader.totalBytes) : 'GLB'} · 60 FPS
                  </span>
                </div>
              </>
            )}

            {/* floating control toolbar */}
            {showCanvas && (
              <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
                <ViewerControls
                  autoRotate={autoRotate}
                  showGrid={showGrid}
                  onToggleRotate={() => setAutoRotate((v) => !v)}
                  onToggleGrid={() => setShowGrid((v) => !v)}
                  onReset={() => viewerRef.current?.resetCamera()}
                  onFullscreen={() => viewerRef.current?.enterFullscreen()}
                  onScreenshot={() => viewerRef.current?.capture()}
                />
              </div>
            )}
          </div>
        </section>

        {/* helper strip */}
        <div className="anim-fade-up stagger-2 mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <HintPill icon={<MousePointer2 className="h-3.5 w-3.5 text-indigo-500" />} label="Drag to rotate" />
            <HintPill icon={<ZoomIn className="h-3.5 w-3.5 text-violet-500" />} label="Scroll to zoom" />
            <HintPill icon={<Move3d className="h-3.5 w-3.5 text-fuchsia-500" />} label="Right-drag to pan" />
          </div>
          <p className="hidden font-mono text-[11.5px] text-gray-400 lg:block">
            marigol · arvan object storage · webgl
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-[12px] text-gray-400 sm:flex-row sm:px-6">
          <p>
            <span className="font-semibold text-gray-500">{APP_NAME} Viewer</span> — premium 3D product
            preview
          </p>
          <p className="font-mono text-[11px]">?id=13994 · noindex · cloudflare pages</p>
        </div>
      </footer>
    </div>
  );
}
