import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

function FloatingOrb({ position, color, speed, distort, size }: {
  position: [number, number, number];
  color: string;
  speed: number;
  distort: number;
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5} floatingRange={[-0.3, 0.3]}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 8]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={distort}
          speed={speed * 2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#34d399"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function NeuralRings() {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef1.current) {
      ringRef1.current.rotation.x = t * 0.15;
      ringRef1.current.rotation.z = t * 0.1;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = t * 0.12;
      ringRef2.current.rotation.x = Math.PI / 3 + t * 0.08;
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.z = t * 0.1;
      ringRef3.current.rotation.y = Math.PI / 4 + t * 0.06;
    }
  });

  return (
    <group>
      <mesh ref={ringRef1}>
        <torusGeometry args={[3, 0.01, 16, 100]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[3.5, 0.008, 16, 100]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.12} />
      </mesh>
      <mesh ref={ringRef3}>
        <torusGeometry args={[4, 0.006, 16, 100]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

export function HeroScene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#34d399" />
        <pointLight position={[-3, 2, 4]} intensity={0.4} color="#34d399" />
        <pointLight position={[3, -2, -4]} intensity={0.2} color="#0ea5e9" />

        {/* Central orbs */}
        <FloatingOrb position={[0, 0, 0]} color="#34d399" speed={1} distort={0.4} size={1.8} />
        <FloatingOrb position={[-2.5, 1.5, -2]} color="#0ea5e9" speed={0.7} distort={0.3} size={0.8} />
        <FloatingOrb position={[2.8, -1, -1.5]} color="#34d399" speed={0.9} distort={0.5} size={0.6} />
        <FloatingOrb position={[-1.5, -2, 1]} color="#6366f1" speed={0.5} distort={0.35} size={0.5} />
        <FloatingOrb position={[1.8, 2.2, -3]} color="#34d399" speed={0.6} distort={0.25} size={0.4} />

        {/* Neural rings */}
        <NeuralRings />

        {/* Particle field */}
        <ParticleField />

        {/* Background stars */}
        <Stars radius={15} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
      </Canvas>
    </div>
  );
}
