import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import HolographicEarth from './components/HolographicEarth';
import HUDLayer from './components/HUDLayer';
import FloatingPanel from './components/FloatingPanel';
import SystemController from './components/SystemController';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For skeletal drawing
  
  // Shared Mutable State (Refs) for Performance
  const earthRotationTarget = useRef({ x: 0, y: 0 });
  const earthZoomTarget = useRef(1.2); // Initial Zoom
  const panelPositionTarget = useRef({ x: window.innerWidth - 200, y: 200 });
  const isDraggingRef = useRef(false);

  // React State for UI updates (lower frequency)
  const [activeRegion, setActiveRegion] = useState("SYSTEM INITIALIZING...");
  const [panelPos, setPanelPos] = useState({ x: window.innerWidth - 250, y: 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [fps, setFps] = useState(0);
  const [handDetected, setHandDetected] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  // Camera Setup
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 1280, 
            height: 720,
            facingMode: 'user' 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setStreamReady(true);
          };
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Camera access is required for J.A.R.V.I.S. protocol.");
      }
    };
    startCamera();
  }, []);

  // Sync Ref to State for the Floating Panel (needs React re-render for style updates)
  useEffect(() => {
    let animId: number;
    const syncLoop = () => {
      if (isDraggingRef.current) {
        // Lerp position for smoothness
        setPanelPos(prev => ({
          x: prev.x + (panelPositionTarget.current.x - prev.x) * 0.2,
          y: prev.y + (panelPositionTarget.current.y - prev.y) * 0.2
        }));
      }
      animId = requestAnimationFrame(syncLoop);
    };
    syncLoop();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans">
      
      {/* 1. Background Video Feed (Processed) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] opacity-50 brightness-50 contrast-125 saturate-50"
        playsInline
        muted
      />

      {/* 2. Skeletal Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none z-10 opacity-60"
      />

      {/* 3. 3D Holographic Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00FFFF" />
          <HolographicEarth 
            rotationTarget={earthRotationTarget} 
            zoomTarget={earthZoomTarget}
            onRegionChange={setActiveRegion}
          />
        </Canvas>
      </div>

      {/* 4. HUD UI Layer */}
      <HUDLayer fps={fps} handDetected={handDetected} />

      {/* 5. Floating Panel */}
      <FloatingPanel 
        position={panelPos} 
        activeRegion={activeRegion} 
        isDragging={isDragging} 
      />

      {/* 6. System Logic Controller */}
      {streamReady && (
        <SystemController
          videoRef={videoRef}
          canvasRef={canvasRef}
          earthRotationTarget={earthRotationTarget}
          earthZoomTarget={earthZoomTarget}
          panelPositionTarget={panelPositionTarget}
          isDraggingRef={isDraggingRef}
          onFpsUpdate={setFps}
          onHandDetected={setHandDetected}
          onDragStateChange={setIsDragging}
        />
      )}

      {/* Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};

export default App;
