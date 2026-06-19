import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Spaceship from './Spaceship';
import * as THREE from 'three';

function Planet({ position, color }) {
  const meshRef = useRef();
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.2;
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[2, 64, 64]} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.8} distort={0.3} speed={2} roughness={0.2} />
      </mesh>
    </Float>
  );
}

function Explosion({ position, color }) {
  const particlesRef = useRef();
  const particles = useMemo(() => Array.from({ length: 12 }).map(() => ({
    dir: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize(),
    speed: 8 + Math.random() * 8
  })), []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        child.position.addScaledVector(particles[i].dir, particles[i].speed * delta);
        if (child.scale.x > 0.01) child.scale.multiplyScalar(0.85);
      });
    }
  });

  return (
    <group ref={particlesRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Asteroid({ position, onMine, onShoot, onCrash, onExplode, fuelEmpty, shipPositionRef, gameStarted, isPaused }) {
  const meshRef = useRef();
  const [active, setActive] = useState(true);
  
  // Her taşa özel rastgele dönüş, hız ve boyut ataması (Kaotik yapı)
  const rotSpeed = useMemo(() => Math.random() * 2, []);
  const moveSpeed = useMemo(() => 15 + Math.random() * 15, []); // 15 ile 30 arası rastgele hız
  const size = useMemo(() => Math.random() * 1.5 + 0.2, []); // 0.2 ile 1.7 arası rastgele boyut

  const resetAsteroid = () => {
    if (meshRef.current) {
      meshRef.current.position.z = -50 - Math.random() * 80; 
      meshRef.current.position.x = (Math.random() - 0.5) * 50; // Geniş alan
      meshRef.current.position.y = (Math.random() - 0.5) * 20;
      setActive(true);
    }
  };

  useFrame((state, delta) => {
    if (!active || !meshRef.current || !gameStarted || isPaused) return;
    
    meshRef.current.rotation.x += delta * rotSpeed;
    meshRef.current.rotation.y += delta * rotSpeed;
    meshRef.current.position.z += delta * moveSpeed; 
    
    // Çarpışma kontrolü
    // Taşın çok hızlı gelip aradan kaynamaması (Frame-skip) için Z penceresini genişlettik
    if (meshRef.current.position.z > -3 && meshRef.current.position.z < 3) {
      if (shipPositionRef.current && !fuelEmpty) {
        const dx = meshRef.current.position.x - shipPositionRef.current.x;
        const dy = meshRef.current.position.y - shipPositionRef.current.y;
        
        // Kare kutu yerine Dairesel (Gerçekçi) çarpışma yarıçapı hesaplaması
        const hitRadius = 1.0 + size * 0.9;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hitRadius) {
          onCrash();
          if (onExplode) onExplode(meshRef.current.position.clone(), '#ff0055');
          setActive(false);
          setTimeout(resetAsteroid, 500);
          return;
        }
      }
    }

    if (meshRef.current.position.z > 5) {
      resetAsteroid();
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (!active || fuelEmpty || !gameStarted || isPaused) return;
    
    if (onShoot && meshRef.current) {
      const pos = meshRef.current.position.clone();
      onShoot(pos);
      if (onExplode) onExplode(pos, '#00f0ff'); // ORE color/laser color
    }

    onMine(Math.floor(Math.random() * 5) + 1);
    setActive(false);
    
    setTimeout(resetAsteroid, 500);
  };

  if (!active) return null;

  return (
    <mesh ref={meshRef} position={position} onClick={handleClick} onPointerOver={() => document.body.style.cursor = (fuelEmpty || !gameStarted) ? 'not-allowed' : 'crosshair'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

export default function Scene({ onMine, onCrash, fuelEmpty, gameStarted, hasShield, shipColor, isPaused }) {
  const shipPositionRef = useRef(new THREE.Vector3());
  const [lasers, setLasers] = useState([]);
  const [explosions, setExplosions] = useState([]);

  const handleExplode = useCallback((pos, color) => {
    if (isPaused) return;
    const id = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id, position: pos, color }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== id));
    }, 400);
  }, [isPaused]);

  const asteroids = useMemo(() => {
    // Sayı 120'ye çıkarıldı
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      position: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 20, -20 - Math.random() * 150]
    }));
  }, []);

  const handleShoot = (targetPos) => {
    if (isPaused) return;
    const id = Date.now() + Math.random();
    const startPos = shipPositionRef.current.clone();
    startPos.z -= 1; 

    setLasers(prev => [...prev, { id, start: startPos, end: targetPos }]);
    
    setTimeout(() => {
      setLasers(prev => prev.filter(l => l.id !== id));
    }, 100);
  };

  const handleMissedShoot = (e) => {
    if (fuelEmpty || !gameStarted || isPaused) return;
    handleShoot(e.point);
  };

  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
      <color attach="background" args={['#050510']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#00f0ff" />
      <pointLight position={[10, -10, 5]} intensity={1} color="#9d00ff" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Planet position={[-8, 2, -10]} color="#00f0ff" />
      <Planet position={[8, -2, -15]} color="#9d00ff" />
      
      {/* Boşluğa ateş edebilmek için görünmez arka plan (Missed Shots) */}
      <mesh position={[0, 0, -60]} onClick={handleMissedShoot}>
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {asteroids.map(ast => (
        <Asteroid key={ast.id} position={ast.position} onMine={onMine} onShoot={handleShoot} onCrash={onCrash} onExplode={handleExplode} fuelEmpty={fuelEmpty} shipPositionRef={shipPositionRef} gameStarted={gameStarted} isPaused={isPaused} />
      ))}

      {explosions.map(exp => (
        <Explosion key={exp.id} position={exp.position} color={exp.color === '#00f0ff' ? (shipColor || exp.color) : exp.color} />
      ))}

      {lasers.map(laser => (
        <Line 
          key={laser.id}
          points={[laser.start, laser.end]}
          color={shipColor || "#00f0ff"}
          lineWidth={4}
          transparent={true}
          opacity={0.8}
        />
      ))}

      <Spaceship fuelEmpty={fuelEmpty} positionRef={shipPositionRef} hasShield={hasShield} shipColor={shipColor} isPaused={isPaused} />

      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} minDistance={5} maxDistance={30} autoRotate={false} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  );
}
