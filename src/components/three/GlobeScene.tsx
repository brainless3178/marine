import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

function GlobeInner() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  const nodes = useMemo(
    () => [
      { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
      { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
      { lat: 1.2848, lng: 103.8515, label: 'Singapore' },
      { lat: 51.9244, lng: 4.4777, label: 'Rotterdam' },
    ],
    []
  )

  const latLngToPosition = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    const x = -radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
  }

  const radius = 2.8
  const nodePositions = nodes.map((n) => latLngToPosition(n.lat, n.lng, radius))

  // Connection lines between nodes
  const lines = useMemo(() => {
    const pairs: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3],
    ]
    return pairs.map(([i, j]) => ({
      from: nodePositions[i],
      to: nodePositions[j],
    }))
  }, [nodePositions])

  return (
    <group ref={groupRef}>
      {/* Globe sphere */}
      <Sphere ref={meshRef} args={[radius, 64, 64]}>
        <meshPhongMaterial
          color="#0A1628"
          emissive="#0EA5E9"
          emissiveIntensity={0.08}
          wireframe={false}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[radius * 1.001, 32, 32]}>
        <meshBasicMaterial color="#1E3A5F" wireframe transparent opacity={0.3} />
      </Sphere>

      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -radius * 1.05, 0]}>
        <ringGeometry args={[radius * 0.8, radius * 1.1, 64]} />
        <meshBasicMaterial color="#0EA5E9" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Connection lines */}
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.from, line.to]}
          color="#0EA5E9"
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      ))}

      {/* Node dots */}
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#0EA5E9" />
        </mesh>
      ))}

      {/* Glow halos on nodes */}
      {nodePositions.map((pos, i) => (
        <mesh key={`glow-${i}`} position={pos}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#0EA5E9" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  )
}

export default function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <GlobeInner />
    </Canvas>
  )
}
