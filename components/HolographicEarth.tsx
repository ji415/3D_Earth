import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Color, AdditiveBlending, Mesh, BackSide } from 'three';
import { EARTH_TEXTURE_URL } from '../constants';

interface HolographicEarthProps {
  rotationTarget: React.MutableRefObject<{ x: number; y: number }>;
  zoomTarget: React.MutableRefObject<number>;
  onRegionChange: (region: string) => void;
}

const HolographicEarth: React.FC<HolographicEarthProps> = ({ rotationTarget, zoomTarget, onRegionChange }) => {
  const earthRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const ringsRef = useRef<Mesh>(null);
  
  // Load Texture
  const [earthMap] = useLoader(TextureLoader, [EARTH_TEXTURE_URL]);

  // Determine active region based on rotation (Simplified longitude calculation)
  const determineRegion = (rotY: number) => {
    // Normalize rotation to 0 - 2PI
    let normalizedRot = rotY % (Math.PI * 2);
    if (normalizedRot < 0) normalizedRot += Math.PI * 2;
    
    // Convert to degrees for easier mapping (0-360)
    // Three.js rotation is counter-clockwise.
    // 0 is Prime Meridian (Europe/Africa)
    const degrees = (normalizedRot * 180) / Math.PI;

    // Approximate mapping
    if (degrees > 330 || degrees <= 30) return "欧洲 / 非洲 (EURO/AFR)";
    if (degrees > 30 && degrees <= 150) return "美洲 (AMERICAS)";
    if (degrees > 150 && degrees <= 240) return "太平洋 (PACIFIC)";
    if (degrees > 240 && degrees <= 330) return "亚洲 / 澳洲 (ASIA/AUS)";
    return "未知区域 (UNKNOWN)";
  };

  useFrame((state, delta) => {
    if (earthRef.current && cloudsRef.current && ringsRef.current) {
      // Smooth interpolation for rotation
      const targetX = rotationTarget.current.x;
      const targetY = rotationTarget.current.y;
      
      // Interpolate current rotation towards target
      earthRef.current.rotation.x += (targetX - earthRef.current.rotation.x) * 0.1;
      earthRef.current.rotation.y += (targetY - earthRef.current.rotation.y) * 0.1;

      // Report region
      const region = determineRegion(earthRef.current.rotation.y);
      onRegionChange(region);

      // Auto-rotate clouds slightly faster
      cloudsRef.current.rotation.y += delta * 0.05;
      
      // Rotate rings
      ringsRef.current.rotation.z += delta * 0.1;
      ringsRef.current.rotation.x = Math.PI / 3;

      // Smooth zoom
      const targetScale = zoomTarget.current;
      const currentScale = earthRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      
      earthRef.current.scale.set(newScale, newScale, newScale);
      cloudsRef.current.scale.set(newScale * 1.1, newScale * 1.1, newScale * 1.1);
      ringsRef.current.scale.set(newScale * 1.5, newScale * 1.5, newScale * 1.5);
    }
  });

  return (
    <group position={[-1.5, 0, 0]}> {/* Shifted to left side as requested */}
      {/* Main Earth Sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          map={earthMap}
          color="#00FFFF"
          emissive="#004444"
          emissiveIntensity={0.5}
          blending={AdditiveBlending}
          transparent={true}
          opacity={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Overlay / Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshBasicMaterial 
          color="#00FFFF"
          wireframe={true}
          transparent={true}
          opacity={0.15}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Glow Halo */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#00FFFF"
          transparent
          opacity={0.1}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Orbital Rings */}
      <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00FFFF" transparent opacity={0.6} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
};

export default HolographicEarth;
