import {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  AUTOROTATE_RESUME_MS,
  BACKGROUND_CANVAS_COLOR,
  CAMERA_DEFAULT_FOV,
  CAMERA_DEFAULT_POSITION,
  TARGET_MODEL_SIZE,
} from '../../lib/constants';
import type { SceneSettings } from '../../types/model';

export interface ModelViewerHandle {
  resetCamera: () => void;
  capture: () => void;
  enterFullscreen: () => void;
}

interface Props {
  blobUrl: string;
  autoRotateEnabled: boolean;
  showGrid: boolean;
  settings: SceneSettings;
  modelId: string | null;
  onReady: () => void;
}

const HOME_TARGET: [number, number, number] = [0, 0.85, 0];

function FramedModel({
  url,
  wireframe,
  onReady,
}: {
  url: string;
  wireframe: boolean;
  onReady: () => void;
}) {
  const gltf = useGLTF(url);
  const notified = useRef(false);

  const normalized = useMemo(() => {
    const source = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_MODEL_SIZE / maxDim;
    source.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(source);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    source.position.sub(scaledCenter);
    const minY = scaledBox.min.y - scaledCenter.y;
    source.position.y -= minY;

    source.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return source;
  }, [gltf]);

  // Wireframe / solid toggle without reloading the model
  useEffect(() => {
    normalized.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial & { wireframe?: boolean };
          if ('wireframe' in mat) mat.wireframe = wireframe;
        });
      }
    });
  }, [normalized, wireframe]);

  useEffect(() => {
    if (!notified.current) {
      notified.current = true;
      requestAnimationFrame(() => requestAnimationFrame(onReady));
    }
  }, [onReady]);

  useEffect(() => {
    return () => {
      normalized.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose?.();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const mat = m as THREE.MeshStandardMaterial & { map?: THREE.Texture | null };
            if (mat.map) mat.map.dispose();
            mat.dispose?.();
          });
        }
      });
    };
  }, [normalized]);

  return <primitive object={normalized} />;
}

function CaptureBridge({ store }: { store: MutableRefObject<THREE.WebGLRenderer | null> }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    store.current = gl as unknown as THREE.WebGLRenderer;
  }, [gl, store]);
  return null;
}

function ExposureSetter({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
}

const ModelViewer = forwardRef<ModelViewerHandle, Props>(function ModelViewer(
  { blobUrl, autoRotateEnabled, showGrid, settings, modelId, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  // ---- smart auto-rotation ----
  // Cinematic showroom spin: hover never interrupts it; only direct
  // manipulation pauses, resuming gently after a quiet moment.
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

  // Master toggle off → hard pause; back on → gentle resume
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

  // ---- imperative actions ----
  const resetCamera = useCallback(() => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(...CAMERA_DEFAULT_POSITION);
      camera.fov = CAMERA_DEFAULT_FOV;
      camera.updateProjectionMatrix();
    }
    if (controls) {
      controls.target.set(...HOME_TARGET);
      controls.update();
    }
  }, []);

  const capture = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    const url = gl.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `marigol-${modelId ?? 'model'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [modelId]);

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
        camera={{ position: CAMERA_DEFAULT_POSITION, fov: CAMERA_DEFAULT_FOV, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: bg === 'transparent', preserveDrawingBuffer: true }}
        onCreated={({ camera, gl, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          scene.environmentIntensity = 0.55;
          pmrem.dispose();
        }}
      >
        <CaptureBridge store={glRef} />
        <ExposureSetter value={settings.exposure} />
        {canvasColor && <color attach="background" args={[canvasColor]} />}
        {(bg === 'white' || bg === 'gray') && (
          <fog attach="fog" args={[canvasColor as string, 12, 26]} />
        )}

        {/* Lighting — driven by the settings panel */}
        <ambientLight intensity={settings.ambientLight} />
        <hemisphereLight args={['#ffffff', isDark ? '#3a3f52' : '#d8d4e8', 0.5]} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={settings.mainLight}
          color={settings.lightColor}
          castShadow={settings.shadows}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-5, 3, -4]}
          intensity={settings.mainLight * 0.35}
          color={isDark ? '#8ea2ff' : '#dbe4ff'}
        />
        <directionalLight position={[0, 4, 6]} intensity={0.3} color="#fff4e0" />
        {!isDark && (
          <spotLight position={[0, 9, 0]} angle={0.5} penumbra={1} intensity={0.35} color="#ffffff" />
        )}

        <Suspense fallback={null}>
          <FramedModel url={blobUrl} wireframe={settings.wireframe} onReady={onReady} />
        </Suspense>

        {showGrid &&
          (isDark ? (
            <Grid
              position={[0, 0.001, 0]}
              args={[14, 14]}
              cellSize={0.5}
              cellThickness={0.7}
              cellColor="#2b3140"
              sectionSize={2.5}
              sectionThickness={1.1}
              sectionColor="#454e63"
              fadeDistance={22}
              fadeStrength={2.5}
              infiniteGrid
            />
          ) : (
            <Grid
              position={[0, 0.001, 0]}
              args={[14, 14]}
              cellSize={0.5}
              cellThickness={0.7}
              cellColor="#d5d9e2"
              sectionSize={2.5}
              sectionThickness={1.1}
              sectionColor="#aab2c5"
              fadeDistance={22}
              fadeStrength={2.5}
              infiniteGrid
            />
          ))}
        {settings.shadows && (
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={isDark ? 0.75 : 0.42}
            scale={11}
            blur={2.6}
            far={4.2}
            color={isDark ? '#000000' : '#1e1b3a'}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={HOME_TARGET}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.9}
          minDistance={1.2}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2 + 0.08}
          autoRotate={spinning}
          autoRotateSpeed={0.8}
          enablePan
          enableZoom
          onStart={handleControlStart}
          onEnd={handleControlEnd}
        />
      </Canvas>
    </div>
  );
});

export default ModelViewer;
