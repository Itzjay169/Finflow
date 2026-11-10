import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { HeroFallback } from './HeroFallback'

function Coin({ position, rotation = [0, 0, 0], scale = 1, color = "#f59e0b" }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.015
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.002
  })

  return (
    <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
      {/* Coin body cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.18, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      {/* Coin outer rim */}
      <mesh>
        <torusGeometry args={[1, 0.08, 16, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}

function FloatingScene() {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    // Smooth mouse tilt
    const targetX = state.pointer.x * 0.35
    const targetY = state.pointer.y * 0.35
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05
    groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.05
  })

  return (
    <group ref={groupRef}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow />
      <pointLight position={[-5, -5, -5]} color="#6366f1" intensity={2} />
      <pointLight position={[5, -2, 2]} color="#06b6d4" intensity={2} />

      {/* Floating Coin Stack */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Coin position={[0, 0.3, 0]} color="#f59e0b" scale={1.2} />
        <Coin position={[0, 0.6, 0]} color="#fbbf24" scale={1.2} />
        <Coin position={[0, 0.9, 0]} color="#f59e0b" scale={1.2} />
        
        {/* Orbiting Satellite Coins */}
        <Coin position={[-2, 1.2, -0.5]} rotation={[0.4, 0.2, 0]} color="#6366f1" scale={0.7} />
        <Coin position={[2.2, -0.4, 0.5]} rotation={[-0.3, 0.5, 0]} color="#06b6d4" scale={0.8} />
        <Coin position={[-1.6, -1.2, 0.2]} rotation={[0.2, -0.4, 0]} color="#10b981" scale={0.65} />
      </Float>

      {/* 3D Dynamic financial chart pillars */}
      <group position={[0, -1.8, -1]}>
        <mesh position={[-1.5, 0.8, 0]}>
          <boxGeometry args={[0.4, 1.6, 0.4]} />
          <meshStandardMaterial color="#6366f1" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.75, 1.2, 0]}>
          <boxGeometry args={[0.4, 2.4, 0.4]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.4, 3.2, 0.4]} />
          <meshStandardMaterial color="#06b6d4" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.75, 2.0, 0]}>
          <boxGeometry args={[0.4, 4.0, 0.4]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

export default function HeroScene() {
  const [shouldRender3D, setShouldRender3D] = useState(true)

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Check mobile screen
    const isMobile = window.innerWidth < 768
    if (prefersReducedMotion || isMobile) {
      setShouldRender3D(false)
    }
  }, [])

  if (!shouldRender3D) {
    return <HeroFallback />
  }

  return (
    <div className="w-full h-[360px] sm:h-[460px] relative">
      <Suspense fallback={<HeroFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <FloatingScene />
        </Canvas>
      </Suspense>
    </div>
  )
}
