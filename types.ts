export enum HandType {
  Left = 'Left',
  Right = 'Right',
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface SharedState {
  // Earth Control (Left Hand)
  earthRotation: { x: number; y: number };
  earthZoom: number;
  
  // Panel Control (Right Hand)
  panelPosition: { x: number; y: number };
  isDraggingPanel: boolean;
  
  // System Status
  activeRegion: string; // e.g., "North America", "Asia"
  fps: number;
  handDetected: boolean;
}

// Coordinate relative to screen center (0,0) -> (-1 to 1)
export interface NormalizedCoord {
  x: number;
  y: number;
}