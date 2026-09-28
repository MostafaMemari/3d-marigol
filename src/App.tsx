import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Download, MousePointer2 } from "lucide-react";
import { useModelUrl } from "./hooks/useModelUrl";
import { useModelLoader } from "./hooks/useModelLoader";
import { useMaterialLoader } from "./hooks/useMaterialLoader";
import { useMaterialView } from "./hooks/useMaterialView";
import { useVariantTextures } from "./hooks/useVariantTextures";
import { useSceneSettings } from "./hooks/useSceneSettings";
import LoadingScreen from "./components/viewer/LoadingScreen";
import ErrorState from "./components/viewer/ErrorState";
import ViewerControls from "./components/viewer/ViewerControls";
import SettingsDrawer from "./components/layout/SettingsDrawer";
import MaterialControls from "./components/viewer/MaterialControls";
import MaterialSwitcher from "./components/viewer/MaterialSwitcher";
import type { ViewerHandle } from "./types/model";
import type { MaterialVariant } from "./types/material";
import { BACKGROUND_CSS, buildProductUrl, getInteractionHint } from "./lib/constants";

const ModelViewer = lazy(() => import("./components/viewer/ModelViewer"));
const MaterialViewer = lazy(() => import("./components/viewer/MaterialViewer"));

const EMPTY_VARIANTS: MaterialVariant[] = [];

/** Wording for the shared error screen when the asset is a material package. */
const MATERIAL_ERROR_COPY = {
  "missing-id": {
    title: "Material ID is missing",
    body: "No material was specified. Add a material ID to the URL, for example ?type=material&id=523, then reload the viewer.",
  },
  "not-found": {
    title: "Material not found",
    body: "We could not find a material package with this ID. It may have been removed or the link may be incorrect.",
  },
  network: {
    title: "Unable to load this material",
    body: "Something interrupted the download. Check your connection and try again — your material is safe.",
  },
};

export default function App() {
  const { id, assetType, assetUrl, isMissing } = useModelUrl();
  const isMaterial = assetType === "material";
  const model = useModelLoader(isMaterial ? null : assetUrl);
  const material = useMaterialLoader(isMaterial ? assetUrl : null);
  // Both loaders expose the same surface, so the shell keeps one code path.
  const loader = isMaterial ? material : model;
  const { settings, applyPreset, update, reset: resetScene } = useSceneSettings();
  const {
    view: materialView,
    setShape: setMaterialShape,
    setVariant: setMaterialVariant,
    setTile: setMaterialTile,
    setRelief: setMaterialRelief,
    toggleSolo: toggleMaterialSolo,
  } = useMaterialView();
  const variants = material.material?.variants ?? EMPTY_VARIANTS;
  const activeIndex = Math.min(materialView.variant, Math.max(0, variants.length - 1));
  const variantTextures = useVariantTextures(material.material, activeIndex);
  const viewerRef = useRef<ViewerHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [spinEnabled, setSpinEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assetReady, setAssetReady] = useState(false);
  const [overlayGone, setOverlayGone] = useState(false);

  useEffect(() => {
    setAssetReady(false);
    setOverlayGone(false);
  }, [assetUrl]);

  useEffect(() => {
    if (!assetReady) return;
    const t = window.setTimeout(() => setOverlayGone(true), 750);
    return () => window.clearTimeout(t);
  }, [assetReady]);

  useEffect(() => {
    if (isMaterial && id) document.title = `Material #${id} — Marigol`;
  }, [isMaterial, id]);

  const handleReady = useCallback(() => setAssetReady(true), []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => undefined);
  }, []);

  const resetView = useCallback(() => viewerRef.current?.resetCamera(), []);

  const showError = !isMissing && loader.state.status === "error";
  const showCanvas = !isMissing && !showError && loader.hasAsset;
  const loadingVisible = !isMissing && !showError && (!assetReady || !overlayGone);
  const isDarkUi = settings.background === "dark" || settings.background === "transparent";

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden" style={{ background: BACKGROUND_CSS[settings.background] }}>
      {/* transparent-bg checkerboard */}
      {settings.background === "transparent" && <div className="checker-bg pointer-events-none absolute inset-0 opacity-60" />}

      {/* 3D canvas — the hero, fills the viewport */}
      <div className="absolute inset-0" onDoubleClick={isMaterial ? resetView : undefined}>
        {showCanvas && (
          <div className={assetReady ? "anim-viewer-in h-full w-full" : "h-full w-full opacity-0"}>
            <Suspense fallback={null}>
              {isMaterial
                ? material.material && (
                    <MaterialViewer
                      ref={viewerRef}
                      textures={variantTextures.textures}
                      shape={materialView.shape}
                      tile={materialView.tile}
                      relief={materialView.relief}
                      solo={materialView.solo}
                      autoRotateEnabled={spinEnabled}
                      settings={settings}
                      materialId={id}
                      onReady={handleReady}
                    />
                  )
                : model.blobUrl && (
                    <ModelViewer
                      ref={viewerRef}
                      blobUrl={model.blobUrl}
                      autoRotateEnabled={spinEnabled}
                      showGrid={showGrid}
                      settings={settings}
                      modelId={id}
                      onReady={handleReady}
                    />
                  )}
            </Suspense>
          </div>
        )}
      </div>

      {/* loading + error overlays */}
      {!isMissing && !showError && !loader.hasAsset && (
        <LoadingScreen
          progress={loader.state.progress}
          loadedBytes={loader.state.loadedBytes}
          totalBytes={loader.state.totalBytes}
          modelId={id}
          leaving={false}
          assetType={assetType}
        />
      )}
      {showCanvas && loadingVisible && (
        <LoadingScreen
          progress={assetReady ? 100 : loader.state.progress}
          loadedBytes={loader.state.loadedBytes}
          totalBytes={loader.state.totalBytes}
          modelId={id}
          leaving={assetReady}
          assetType={assetType}
        />
      )}
      {isMissing && (
        <ErrorState
          kind="missing-id"
          modelId={null}
          onRetry={() => window.location.reload()}
          copy={isMaterial ? MATERIAL_ERROR_COPY : undefined}
        />
      )}
      {showError && (
        <ErrorState
          kind={loader.state.errorKind ?? "network"}
          modelId={id}
          onRetry={loader.retry}
          copy={isMaterial ? MATERIAL_ERROR_COPY : undefined}
        />
      )}

      {/* top floating bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="anim-fade-up pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-white/50 bg-white/75 py-2 pr-4 pl-2.5 shadow-lg shadow-gray-900/8 backdrop-blur-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from via-brand to-brand-to shadow-md shadow-brand/25">
            {" "}
            {/* <Box className="h-4 w-4 text-white" strokeWidth={2.4} /> */}
            <img src="./logo.webp" alt="Marigol" className="h-4 w-4 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-bold tracking-tight text-gray-900">Marigol 3D</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              {isMaterial && (
                <span className="rounded-full bg-brand-to/15 px-1.5 py-px text-[9px] font-bold tracking-[0.12em] text-brand-from uppercase">
                  Material
                </span>
              )}
              <span className="font-mono text-[10.5px] font-medium text-gray-400">
                {id ? `#${id}` : "viewer"}
              </span>
            </span>
          </span>
        </div>

        <div className="anim-fade-up stagger-1 pointer-events-auto flex items-center gap-2">
          {id && (
            <a
              href={buildProductUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-[13.5px] font-bold text-white shadow-xl shadow-gray-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:shadow-brand/35 active:translate-y-0"
            >
              <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Get</span>
            </a>
          )}
        </div>
      </div>

      {/* on-canvas material switcher — visible without opening the settings */}
      {showCanvas && isMaterial && material.material && (
        <MaterialSwitcher
          variants={variants}
          activeIndex={activeIndex}
          thumbnails={material.material.thumbnails}
          extraImages={material.material.extraImages}
          solo={materialView.solo}
          pending={variantTextures.status === "decoding"}
          onVariant={setMaterialVariant}
          onSolo={toggleMaterialSolo}
        />
      )}

      {/* right floating settings panel (a bottom sheet on phones) */}
      {showCanvas && (
        <SettingsDrawer
          settings={settings}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onApplyPreset={applyPreset}
          onUpdate={update}
          onResetScene={resetScene}
          title={isMaterial ? "Material Settings" : undefined}
        >
          {isMaterial && material.material && (
            <MaterialControls
              active={variants[activeIndex] ?? null}
              shape={materialView.shape}
              tile={materialView.tile}
              relief={materialView.relief}
              onShape={setMaterialShape}
              onTile={setMaterialTile}
              onRelief={setMaterialRelief}
            />
          )}
        </SettingsDrawer>
      )}

      {/* bottom floating toolbar */}
      {showCanvas && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2.5 px-4 sm:bottom-5">
          {assetReady && (
            <span
              className={`anim-fade-up pointer-events-none hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold backdrop-blur-xl sm:inline-flex ${
                isDarkUi
                  ? "border border-white/15 bg-black/35 text-white/80"
                  : "border border-white/60 bg-white/75 text-gray-500 shadow-lg shadow-gray-900/5"
              }`}
            >
              <MousePointer2 className="h-3 w-3" />
              {getInteractionHint(assetType)}
            </span>
          )}
          <ViewerControls
            autoRotate={spinEnabled}
            showGrid={showGrid}
            settingsOpen={settingsOpen}
            onToggleRotate={() => setSpinEnabled((v) => !v)}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onToggleSettings={() => setSettingsOpen((v) => !v)}
            onReset={resetView}
            onFullscreen={toggleFullscreen}
            onScreenshot={() => viewerRef.current?.capture()}
            showGridControl={!isMaterial}
          />
        </div>
      )}
    </div>
  );
}
