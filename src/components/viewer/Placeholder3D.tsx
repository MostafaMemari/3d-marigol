import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingShape() {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.9) * 0.22;
      group.current.rotation.y = t * 0.35;
    }
    if (wire.current) {
      wire.current.rotation.x = t * 0.25;
      wire.current.rotation.z = Math.sin(t * 0.4) * 0.2;
    }
    if (core.current) {
      core.current.rotation.y = -t * 0.5;
      const s = 1 + Math.sin(t * 1.4) * 0.04;
      core.current.scale.setScalar(s);
    }
    if (ring.current) {
      ring.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.5) * 0.15;
      ring.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={wire}>
        <boxGeometry args={[1.7, 1.7, 1.7]} />
        <meshBasicMaterial color="#ce004f" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial
          color="#ff4d8d"
          roughness={0.25}
          metalness={0.55}
          flatShading
        />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[1.25, 0.028, 12, 64]} />
        <meshBasicMaterial color="#ffd6e5" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/** Lightweight animated 3D placeholder shown while the GLB downloads. */
export default function Placeholder3D() {
  return (
    <div className="anim-float-y relative h-44 w-44 sm:h-52 sm:w-52">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-soft via-white to-brand-mist blur-[1px]" />
      <div className="absolute -inset-3 rounded-[2.2rem] bg-brand-to/25 blur-2xl" />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 4.4], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        className="!absolute !inset-0"
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 5, 4]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#ffd6e5" />
        <FloatingShape />
      </Canvas>
      {/* soft ground shadow */}
      <div className="absolute -bottom-3 left-1/2 h-4 w-28 -translate-x-1/2 rounded-full bg-brand-from/15 blur-md" />
    </div>
  );
}
