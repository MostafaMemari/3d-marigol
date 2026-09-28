import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CaptureBridge, ExposureSetter, RoomEnvironmentMap } from './SceneBridges';
import {
  AUTOROTATE_RESUME_MS,
  BACKGROUND_CANVAS_COLOR,
  MATERIAL_AUTOROTATE_SPEED,
  MATERIAL_CAMERA_FOV,
  MATERIAL_CAMERA_POSITION,
  MATERIAL_DEFAULT_ENV_INTENSITY,
  MATERIAL_DEFAULT_ROUGHNESS,
  MATERIAL_DISPLACEMENT_SCALE,
  MATERIAL_PLANE_SEGMENTS,
  MATERIAL_PLANE_SIZE,
  MATERIAL_PREVIEW_RADIUS,
  MATERIAL_PREVIEW_SEGMENTS,
  MATERIAL_PREVIEW_SIZE,
  MATERIAL_TARGET,
} from '../../lib/constants';
import type { MaterialMapKind, MaterialShape, MaterialTextures } from '../../types/material';
import type { SceneSettings, ViewerHandle } from '../../types/model';

export type MaterialViewerHandle = ViewerHandle;

interface Props {
  textures: MaterialTextures | null;
  shape: MaterialShape;
  tile: number;
  relief: number;
  solo: MaterialMapKind | null;
  autoRotateEnabled: boolean;
  settings: SceneSettings;
  materialId: string | null;
  onReady: () => void;
}

function createPreviewGeometry(shape: MaterialShape): THREE.BufferGeometry {
  if (shape === 'cube') {
    const size = MATERIAL_PREVIEW_SIZE;
    const segment = MATERIAL_PREVIEW_SEGMENTS / 4;
    return new THREE.BoxGeometry(size, size, size, segment, segment, segment);
  }
  if (shape === 'plane') {
    return new THREE.PlaneGeometry(
      MATERIAL_PLANE_SIZE,
      MATERIAL_PLANE_SIZE,
      MATERIAL_PLANE_SEGMENTS,
      MATERIAL_PLANE_SEGMENTS,
    );
  }
  return new THREE.SphereGeometry(
    MATERIAL_PREVIEW_RADIUS,
    MATERIAL_PREVIEW_SEGMENTS,
    MATERIAL_PREVIEW_SEGMENTS / 2,
  );
}

/** Channel isolation view: a single map shown flat, everything else off. */
function applySolo(
  material: THREE.MeshPhysicalMaterial,
  textures: MaterialTextures,
  solo: MaterialMapKind,
): void {
  material.map = textures[solo] ?? null;
  material.normalMap = null;
  material.roughnessMap = null;
  material.metalnessMap = null;
  material.aoMap = null;
  material.displacementMap = null;
  material.displacementScale = 0;
  material.roughness = 1;
  material.metalness = 0;
}

function applyPbr(
  material: THREE.MeshPhysicalMaterial,
  textures: MaterialTextures,
  relief: number,
): void {
  const { basecolor, normal, roughness, metallic, ao, height } = textures;
  material.map = basecolor ?? null;
  material.normalMap = normal ?? null;
  material.roughnessMap = roughness ?? null;
  material.metalnessMap = metallic ?? null;
  material.aoMap = ao ?? null;
  material.displacementMap = height ?? null;
  // Packed channels multiply the scalar factor, so a map takes full control.
  material.roughness = roughness ? 1 : MATERIAL_DEFAULT_ROUGHNESS;
  material.metalness = metallic ? 1 : 0;
  material.displacementScale = height ? relief * MATERIAL_DISPLACEMENT_SCALE : 0;
}

const NO_MAPS: MaterialTextures = {};

function PreviewObject({
  textures,
  shape,
  tile,
  relief,
  solo,
  wireframe,
  onReady,
}: {
  textures: MaterialTextures | null;
  shape: MaterialShape;
  tile: number;
  relief: number;
  solo: MaterialMapKind | null;
  wireframe: boolean;
  onReady: () => void;
}) {
  const pbr = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: MATERIAL_DEFAULT_ROUGHNESS,
        // The preview orbits freely, so the wall/floor plane must stay visible
        // from behind as well.
        side: THREE.DoubleSide,
      }),
    [],
  );
  const geometry = useMemo(() => createPreviewGeometry(shape), [shape]);
  const maps = textures ?? NO_MAPS;

  // Tiling lives on the textures, everything else on the material instance.
  useEffect(() => {
    Object.values(maps).forEach((texture) => {
      if (texture) texture.repeat.set(tile, tile);
    });
  }, [maps, tile]);

  useEffect(() => {
    if (solo) {
      applySolo(pbr, maps, solo);
    } else {
      applyPbr(pbr, maps, relief);
    }
    pbr.wireframe = wireframe;
    pbr.needsUpdate = true;
  }, [pbr, maps, solo, relief, wireframe]);

  // Disposal per resource: a shape change must not release the material.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => pbr.dispose(), [pbr]);

  const notified = useRef(false);
  useEffect(() => {
    if (!notified.current) {
      notified.current = true;
      requestAnimationFrame(() => requestAnimationFrame(onReady));
    }
  }, [onReady]);

  return <mesh geometry={geometry} material={pbr} castShadow receiveShadow />;
}

/**
 * Soft grounding blob under the preview object. A contact-shadow render pass
 * would fill its whole plane with opaque grey here, which reads as a hard slab
 * when the object floats on a clean backdrop.
 */
function SoftGroundShadow({
  visible,
  isDark,
  y,
}: {
  visible: boolean;
  isDark: boolean;
  y: number;
}) {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(30,27,58,0.5)');
      gradient.addColorStop(0.5, 'rgba(30,27,58,0.2)');
      gradient.addColorStop(1, 'rgba(30,27,58,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    return canvasTexture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  if (!visible) return null;

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[MATERIAL_PREVIEW_SIZE * 2.4, MATERIAL_PREVIEW_SIZE * 2.4]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        opacity={isDark ? 0.85 : 0.65}
      />
    </mesh>
  );
}

const MaterialViewer = forwardRef<MaterialViewerHandle, Props>(function MaterialViewer(
  {
    textures,
    shape,
    tile,
    relief,
    solo,
    autoRotateEnabled,
    settings,
    materialId,
    onReady,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  // Same smart auto-rotation as the model viewer: manual manipulation pauses
  // it and it resumes gently once the user has been idle for a moment.
  const [spinPaused, setSpinPaused] = useState(false);
  const interactingRef = useRef(false);
  const idleTimer = useRef<number | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const pauseSpin = useCallback(() => {
    clearIdleTimer();
    setSpinPaused(true);
  }, [clearIdleTimer]);

  const scheduleResume = useCallback(() => {
    clearIdleTimer();
    idleTimer.current = window.setTimeout(() => {
      if (!interactingRef.current) setSpinPaused(false);
    }, AUTOROTATE_RESUME_MS);
  }, [clearIdleTimer]);

  useEffect(() => clearIdleTimer, [clearIdleTimer]);

  useEffect(() => {
    if (!autoRotateEnabled) {
      pauseSpin();
    } else {
      scheduleResume();
    }
  }, [autoRotateEnabled, pauseSpin, scheduleResume]);

  const handleControlStart = useCallback(() => {
    interactingRef.current = true;
    pauseSpin();
  }, [pauseSpin]);

  const handleControlEnd = useCallback(() => {
    interactingRef.current = false;
    if (autoRotateEnabled) scheduleResume();
  }, [autoRotateEnabled, scheduleResume]);

  const resetCamera = useCallback(() => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(...MATERIAL_CAMERA_POSITION);
      camera.fov = MATERIAL_CAMERA_FOV;
      camera.updateProjectionMatrix();
    }
    if (controls) {
      controls.target.set(...MATERIAL_TARGET);
      controls.update();
    }
  }, []);

  const capture = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    const url = gl.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `marigol-material-${materialId ?? 'material'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [materialId]);

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => undefined);
  }, []);

  useImperativeHandle(ref, () => ({ resetCamera, capture, enterFullscreen }), [
    resetCamera,
    capture,
    enterFullscreen,
  ]);

  const bg = settings.background;
  const canvasColor = BACKGROUND_CANVAS_COLOR[bg];
  const isDark = bg === 'dark' || bg === 'transparent';
  const spinning = autoRotateEnabled && !spinPaused;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas
        shadows={settings.shadows}
        dpr={[1, 2]}
        camera={{
          position: MATERIAL_CAMERA_POSITION,
          fov: MATERIAL_CAMERA_FOV,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: bg === 'transparent', preserveDrawingBuffer: true }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
      >
        <CaptureBridge store={glRef} />
        <ExposureSetter value={settings.exposure} />
        <RoomEnvironmentMap intensity={MATERIAL_DEFAULT_ENV_INTENSITY} />
        {canvasColor && <color attach="background" args={[canvasColor]} />}

        {/* Inspection lighting — the image-based probe does the heavy lifting,
            these shape the highlights so roughness reads at a glance. */}
        <ambientLight intensity={settings.ambientLight} />
        <hemisphereLight args={['#ffffff', isDark ? '#3a3f52' : '#d8d4e8', 0.45]} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={settings.mainLight}
          color={settings.lightColor}
          castShadow={settings.shadows}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-5, 2, -4]}
          intensity={settings.mainLight * 0.3}
          color={isDark ? '#8ea2ff' : '#dbe4ff'}
        />
        <directionalLight position={[0, 2, 6]} intensity={0.25} color="#fff4e0" />

        <PreviewObject
          textures={textures}
          shape={shape}
          tile={tile}
          relief={relief}
          solo={solo}
          wireframe={settings.wireframe}
          onReady={onReady}
        />

        <SoftGroundShadow
          visible={settings.shadows && shape !== 'plane'}
          isDark={isDark}
          y={-MATERIAL_PREVIEW_SIZE / 2 - 0.02}
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={MATERIAL_TARGET}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.9}
          minDistance={1.6}
          maxDistance={9}
          maxPolarAngle={Math.PI * 0.98}
          autoRotate={spinning}
          autoRotateSpeed={MATERIAL_AUTOROTATE_SPEED}
          enablePan={false}
          enableZoom
          onStart={handleControlStart}
          onEnd={handleControlEnd}
        />
      </Canvas>
    </div>
  );
});

export default MaterialViewer;
