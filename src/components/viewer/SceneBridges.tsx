import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Publishes the active renderer for imperative screenshot capture. */
export function CaptureBridge({ store }: { store: MutableRefObject<THREE.WebGLRenderer | null> }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    store.current = gl as unknown as THREE.WebGLRenderer;
  }, [gl, store]);
  return null;
}

/** ACES tone mapping with the exposure from the scene settings. */
export function ExposureSetter({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
}

/**
 * Image-based lighting from the built-in room probe — what makes PBR materials
 * read correctly (reflections, roughness response).
 */
export function RoomEnvironmentMap({ intensity = 0.55 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = intensity;
    room.dispose();
    pmrem.dispose();

    return () => {
      const env = scene.environment;
      if (env) {
        (env as THREE.Texture | null)?.dispose?.();
        scene.environment = null;
      }
    };
  }, [gl, scene, intensity]);

  return null;
}
