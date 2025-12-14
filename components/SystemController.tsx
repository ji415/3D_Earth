import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { VISION_MODEL_URL, PINCH_THRESHOLD, ZOOM_SENSITIVITY, ROTATION_SENSITIVITY } from '../constants';

interface SystemControllerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  // Refs to update parent state without re-rendering logic
  earthRotationTarget: React.MutableRefObject<{ x: number; y: number }>;
  earthZoomTarget: React.MutableRefObject<number>;
  panelPositionTarget: React.MutableRefObject<{ x: number; y: number }>;
  isDraggingRef: React.MutableRefObject<boolean>;
  
  // Callbacks for UI updates
  onFpsUpdate: (fps: number) => void;
  onHandDetected: (detected: boolean) => void;
  onDragStateChange: (isDragging: boolean) => void;
}

const SystemController: React.FC<SystemControllerProps> = ({
  videoRef,
  canvasRef,
  earthRotationTarget,
  earthZoomTarget,
  panelPositionTarget,
  isDraggingRef,
  onFpsUpdate,
  onHandDetected,
  onDragStateChange
}) => {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(0);

  useEffect(() => {
    const initMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: VISION_MODEL_URL,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      startDetectionLoop();
    };

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const processHands = (result: HandLandmarkerResult) => {
    if (result.handedness.length > 0) {
      onHandDetected(true);
    } else {
      onHandDetected(false);
      isDraggingRef.current = false;
      onDragStateChange(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Iterate through detected hands
    for (let i = 0; i < result.handedness.length; i++) {
      const hand = result.handedness[i][0]; // categoryName is "Left" or "Right"
      const landmarks = result.landmarks[i];

      // Note: MediaPipe "Left" hand usually appears on the Right side of the screen if mirrored.
      // We will rely on the label. 
      // Assumption: "Left" category = User's actual Left Hand.
      // In mirrored selfie mode: "Left" hand is on screen Left. "Right" hand is on screen Right.
      
      const isLeftHand = hand.categoryName === "Left"; // Controls Earth
      const isRightHand = hand.categoryName === "Right"; // Controls Panel

      if (isLeftHand) {
        // --- EARTH CONTROL ---
        
        // 1. Rotation: Based on hand centroid (approx using wrist [0], index[5], pinky[17])
        // Normalize coordinates from 0-1 to -1 to 1 range
        const centerX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
        const centerY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;

        // Map X (0..1) to Rotation Y (-PI..PI)
        // Map Y (0..1) to Rotation X (-PI/2..PI/2)
        const targetRotY = (centerX - 0.5) * ROTATION_SENSITIVITY * Math.PI;
        const targetRotX = (centerY - 0.5) * ROTATION_SENSITIVITY * Math.PI;

        earthRotationTarget.current = { x: targetRotX, y: targetRotY };

        // 2. Zoom: Distance between Thumb Tip (4) and Index Tip (8)
        const pinchDist = calculateDistance(landmarks[4], landmarks[8]);
        // Map distance (approx 0.02 to 0.3) to scale (0.5 to 2.5)
        const zoom = Math.max(0.5, Math.min(2.5, pinchDist * ZOOM_SENSITIVITY * 4));
        earthZoomTarget.current = zoom;

      } else if (isRightHand) {
        // --- PANEL CONTROL ---
        
        // Check for Pinch (Thumb 4, Index 8)
        const pinchDist = calculateDistance(landmarks[4], landmarks[8]);
        const isPinching = pinchDist < PINCH_THRESHOLD;

        // Update drag state logic
        if (isPinching !== isDraggingRef.current) {
          isDraggingRef.current = isPinching;
          onDragStateChange(isPinching);
        }

        if (isPinching) {
          // Map hand center to screen pixels
          // Index tip is a good cursor
          const cursorX = landmarks[8].x * window.innerWidth;
          const cursorY = landmarks[8].y * window.innerHeight;
          
          panelPositionTarget.current = { x: cursorX, y: cursorY };
        }
      }
    }
  };

  const drawSkeleton = (result: HandLandmarkerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cyberpunk Style Drawing
    const drawingUtils = new DrawingUtils(ctx);
    
    for (const landmarks of result.landmarks) {
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#00FFFF",
        lineWidth: 2
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FFFFFF",
        fillColor: "#003333",
        radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, .1, 5, 1)
      });
    }
  };

  const startDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && video.readyState >= 2 && handLandmarkerRef.current && canvas) {
      // Resize canvas to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const currentTime = performance.now();
      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        
        const result = handLandmarkerRef.current.detectForVideo(video, currentTime);
        processHands(result);
        drawSkeleton(result);

        // FPS Calculation
        frameCountRef.current++;
        if (currentTime - lastFpsTimeRef.current >= 1000) {
          onFpsUpdate(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = currentTime;
        }
      }
    }
    requestRef.current = requestAnimationFrame(startDetectionLoop);
  };

  return null; // Logic only component
};

export default SystemController;
