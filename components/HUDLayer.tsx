import React, { useState, useEffect } from 'react';
import { HEX_CHARS } from '../constants';
import { Cpu, Radio, ShieldCheck } from 'lucide-react';

interface HUDLayerProps {
  fps: number;
  handDetected: boolean;
}

const HUDLayer: React.FC<HUDLayerProps> = ({ fps, handDetected }) => {
  const [time, setTime] = useState(new Date());
  const [hexCode, setHexCode] = useState('');

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Matrix-style hex rain effect generator
  useEffect(() => {
    const interval = setInterval(() => {
      let code = '';
      for (let i = 0; i < 24; i++) {
        code += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
        if (i % 2 === 1) code += ' ';
      }
      setHexCode(code);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        
        {/* Top Left: System Status */}
        <div className="flex flex-col gap-2">
          <div className="border border-jarvis-cyan/50 p-2 bg-black/40 backdrop-blur-md w-64">
             <div className="flex items-center justify-between text-jarvis-cyan mb-2">
               <span className="font-mono text-xs">CPU_LOAD</span>
               <Cpu size={14} className="animate-pulse" />
             </div>
             <div className="w-full bg-gray-900 h-1 mb-1">
               <div className="bg-jarvis-cyan h-full w-[45%] animate-pulse"></div>
             </div>
             <div className="font-mono text-xs text-jarvis-cyan/70 break-all leading-tight">
                {hexCode}
             </div>
          </div>
          
          <div className="text-jarvis-cyan/80 font-mono text-xs mt-2">
             FPS: <span className="text-white font-bold">{Math.round(fps)}</span>
          </div>
        </div>

        {/* Top Right: Header */}
        <div className="text-right">
          <h1 className="text-5xl font-sans font-bold text-jarvis-cyan tracking-widest hud-text-shadow">
            J.A.R.V.I.S.
          </h1>
          <div className="text-xl font-mono text-white mt-1">
            {time.toLocaleTimeString()} <span className="text-xs text-jarvis-cyan/60 ml-2">SYS.ONLINE</span>
          </div>
          <div className="flex justify-end mt-2 gap-1">
             <div className="w-8 h-1 bg-jarvis-cyan/80"></div>
             <div className="w-2 h-1 bg-jarvis-cyan/50"></div>
             <div className="w-2 h-1 bg-jarvis-cyan/30"></div>
          </div>
        </div>
      </div>

      {/* Center Scanline Effect (CSS handled in index.html, just placeholder div if needed) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-jarvis-cyan/20 blur-sm animate-scanline pointer-events-none"></div>

      {/* Bottom Area */}
      <div className="flex justify-between items-end">
        
        {/* Bottom Left: Hand Tracking Status */}
        <div className="bg-black/40 border-l-4 border-jarvis-cyan p-4 backdrop-blur-sm">
           <h3 className="text-jarvis-cyan font-bold font-sans text-lg mb-2 flex items-center gap-2">
             <ShieldCheck size={18} /> 生物识别 / BIOMETRICS
           </h3>
           <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${handDetected ? 'bg-jarvis-cyan shadow-[0_0_10px_#00FFFF]' : 'bg-red-500'}`}></div>
             <span className="font-mono text-sm text-gray-300">
               {handDetected ? "TARGET ACQUIRED" : "SEARCHING..."}
             </span>
           </div>
           <div className="mt-2 text-xs font-mono text-jarvis-cyan/50">
             L-HAND: ROTATE/ZOOM <br/>
             R-HAND: INTERFACE DRAG
           </div>
        </div>

        {/* Bottom Right decoration */}
        <div className="flex flex-col items-end gap-1 opacity-60">
           <Radio className="text-jarvis-cyan animate-pulse" />
           <span className="text-[10px] font-mono text-jarvis-cyan">ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </div>
  );
};

export default HUDLayer;
