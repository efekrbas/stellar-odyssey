import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Spaceship({ fuelEmpty, positionRef, hasShield, shipColor = "#00f0ff", isPaused }) {
  const group = useRef();
  const targetX = useRef(0);
  const targetY = useRef(0);
  
  // Klavye tuş durumlarını ve klavyenin kullanılıp kullanılmadığını takip ediyoruz
  const hasUsedKeyboard = useRef(false);
  const keys = useRef({ 
    w: false, a: false, s: false, d: false 
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) {
        keys.current[key] = true;
        hasUsedKeyboard.current = true; // Oyuncu klavyeye dokunduğu an fare takibini bırakacağız
      }
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) {
        keys.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (isPaused) return;
    
    // Geminin farenin olduğu yere bakmasını sağla
    const pointer = state.pointer;
    const vec = new THREE.Vector3(pointer.x * 10, pointer.y * 10, -10);
    group.current.lookAt(vec);

    const t = state.clock.getElapsedTime();
    
    if (!fuelEmpty) {
      if (hasUsedKeyboard.current) {
        // --- KLAVYE KONTROLÜ ---
        const k = keys.current;
        const speedX = 0.25;
        const speedY = 0.15;
        
        if (k.w) targetY.current += speedY;
        if (k.s) targetY.current -= speedY;
        if (k.d) targetX.current += speedX;
        if (k.a) targetX.current -= speedX;
        
        // Geminin ekran dışına çıkmasını engelle
        targetX.current = THREE.MathUtils.clamp(targetX.current, -14, 14);
        targetY.current = THREE.MathUtils.clamp(targetY.current, -7, 7);
      } else {
        // --- FARE KONTROLÜ (Varsayılan) ---
        targetX.current = state.pointer.x * 14;
        targetY.current = state.pointer.y * 7;
      }
    }

    // X ekseninde yumuşak geçiş
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX.current, 0.05);
    
    // Y ekseninde yumuşak geçiş ve üzerine hafif sallanma (bobbing) efekti
    const bob = Math.sin(t * 2) * 0.2;
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY.current + bob, 0.05);
    
    // Çarpışma tespiti için pozisyonu kaydet
    if (positionRef) {
      positionRef.current.copy(group.current.position);
    }
    
    // Sağa sola giderken yana yatma efekti (Roll)
    const tiltZ = (targetX.current - group.current.position.x) * -0.1;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, tiltZ, 0.1);
    
    // Aşağı yukarı giderken burun kaldırma/indirme efekti (Pitch)
    const tiltX = (group.current.position.y - targetY.current) * 0.1; 
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, tiltX + Math.cos(t * 1.5) * 0.1, 0.1);
  });

  return (
    <group ref={group}>
      {/* Main Body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1, 4, 4]} />
        <meshStandardMaterial color={fuelEmpty ? "#3a1a1a" : "#1a1a3a"} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Cockpit */}
      <mesh position={[0, 0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.4, 1, 4, 8]} />
        <meshStandardMaterial color={fuelEmpty ? "#ff0000" : shipColor} metalness={0.9} roughness={0.1} emissive={fuelEmpty ? "#ff0000" : shipColor} emissiveIntensity={0.2} />
      </mesh>
      
      {/* Wings */}
      <mesh position={[1.2, 0, -1]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.2, 0, -1]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engine Glow */}
      {!fuelEmpty && (
        <mesh position={[0, 0, -2.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.8, 0.5, 16]} />
          <meshBasicMaterial color={shipColor} />
        </mesh>
      )}

      {/* Energy Shield */}
      {hasShield && (
        <mesh>
          <sphereGeometry args={[2.8, 32, 32]} />
          <meshStandardMaterial color="#00f0ff" transparent={true} opacity={0.3} depthWrite={false} emissive="#00f0ff" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
