import React, { useEffect, useState } from 'react';
import { Activity, Globe, Wifi, Lock } from 'lucide-react';

interface FloatingPanelProps {
  position: { x: number; y: number };
  activeRegion: string;
  isDragging: boolean;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ position, activeRegion, isDragging }) => {
  // Generate fake data for the panel
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const next = [...prev, Math.random() * 100];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`absolute w-80 pointer-events-none transition-all duration-75 ease-out backdrop-blur-sm border border-jarvis-cyan/30 bg-black/40`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)', // Center on cursor
        boxShadow: isDragging ? '0 0 20px rgba(0, 255, 255, 0.6)' : '0 0 10px rgba(0, 255, 255, 0.2)',
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-2 border-b border-jarvis-cyan/30 ${isDragging ? 'bg-jarvis-cyan/20' : 'bg-jarvis-cyan/10'}`}>
        <span className="text-jarvis-cyan font-mono text-sm tracking-wider flex items-center gap-2">
           <Globe size={14} /> 地理情报分析 (GEO-INTEL)
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-jarvis-cyan animate-pulse"></div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Region Info */}
        <div>
          <h3 className="text-xs text-jarvis-cyan/60 uppercase font-mono mb-1">目标区域 / TARGET ZONE</h3>
          <div className="text-xl text-white font-bold hud-text-shadow font-sans tracking-wide">
            {activeRegion}
          </div>
        </div>

        {/* Fake Charts */}
        <div>
          <h3 className="text-xs text-jarvis-cyan/60 uppercase font-mono mb-1 flex items-center gap-2">
            <Activity size={12} /> 数据流 / STREAM
          </h3>
          <div className="flex items-end gap-[2px] h-12 border-b border-l border-jarvis-cyan/20 p-1">
            {dataPoints.map((val, i) => (
              <div 
                key={i} 
                className="w-2 bg-jarvis-cyan/60 hover:bg-jarvis-cyan transition-colors"
                style={{ height: `${val}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-jarvis-cyan/80">
            <Wifi size={12} /> 信号: 98%
          </div>
          <div className="flex items-center gap-2 text-jarvis-cyan/80">
            <Lock size={12} /> 加密: AES-256
          </div>
        </div>
      </div>

      {/* Decoration corners */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-jarvis-cyan"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-jarvis-cyan"></div>
    </div>
  );
};

export default FloatingPanel;
