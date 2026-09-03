import { Suspense, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_DEFAULT_FOV, CAMERA_DEFAULT_POSITION, TARGET_MODEL_SIZE } from '../../lib/constants';

export interface ModelViewerHandle {
  resetCamera: () => void;
  capture: () => void;
  enterFullscreen: () => void;
}

interface Props {
  blobUrl: string;
  autoRotate: boolean;
  showGrid: boolean;
  modelId: string | null;
  onReady: () => void;
}

function FramedModel({ url, onReady }: { url: string; onReady: () => void }) {
  const gltf = useGLTF(url);
  const notified = useRef(false);

  const normalized = useMemo(() => {
    const source = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_MODEL_SIZE / maxDim;
    source.scale.setScalar(scale);

    // Re-center after scaling: shift so bbox center lands at origin,
    // then lift so the bottom sits at y=0.
    const scaledBox = new THREE.Box3().setFromObject(source);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    source.position.sub(scaledCenter);
    const minY = scaledBox.min.y - scaledCenter.y;
    source.position.y -= minY;

    // Soft studio look: ensure shadows render nicely
    source.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return source;
  }, [gltf]);

  useEffect(() => {
    if (!notified.current) {
      notified.current = true;
      // Let one frame paint before fading the loader for a buttery reveal
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

const ModelViewer = forwardRef<ModelViewerHandle, Props>(function ModelViewer(
  { blobUrl, autoRotate, showGrid, modelId, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const resetCamera = useCallback(() => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(...CAMERA_DEFAULT_POSITION);
      camera.fov = CAMERA_DEFAULT_FOV;
      camera.updateProjectionMatrix();
    }
    if (controls) {
      controls.target.set(0, 0.85, 0);
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

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#fafafb]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: CAMERA_DEFAULT_POSITION, fov: CAMERA_DEFAULT_FOV, near: 0.1, far: 100 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ camera, gl, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          // Local studio reflections — no external HDR fetch, fully self-contained.
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          pmrem.dispose();
        }}
      >
        <CaptureBridge store={glRef} />
        <color attach="background" args={['#fafafb']} />
        <fog attach="fog" args={['#fafafb', 12, 26]} />

        {/* Professional product lighting */}
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#ffffff', '#d8d4e8', 0.5]} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={1.9}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0002}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.55} color="#dbe4ff" />
        <directionalLight position={[0, 4, 6]} intensity={0.35} color="#fff4e0" />
        <spotLight position={[0, 9, 0]} angle={0.5} penumbra={1} intensity={0.4} color="#ffffff" />

        <Suspense fallback={null}>
          <FramedModel url={blobUrl} onReady={onReady} />
        </Suspense>

        {showGrid ? (
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
        ) : (
          <gridHelper args={[14, 28, '#ececf1', '#f3f3f6']} position={[0, 0, 0]} />
        )}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.42} scale={11} blur={2.6} far={4.2} color="#1e1b3a" />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0.85, 0]}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.9}
          minDistance={1.2}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2 + 0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={1.4}
          enablePan
          enableZoom
        />
      </Canvas>
    </div>
  );
});

export default ModelViewer;
