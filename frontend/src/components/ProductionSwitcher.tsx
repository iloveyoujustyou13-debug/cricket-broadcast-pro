import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Video, RefreshCw, Layers } from 'lucide-react';

interface CameraFeed {
  id: string;
  name: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function ProductionSwitcher() {
  const [cameras] = useState<CameraFeed[]>([
    { id: 'cam1', name: 'Main Ground View', videoRef: useRef<HTMLVideoElement>(null) },
    { id: 'cam2', name: 'Batsman View', videoRef: useRef<HTMLVideoElement>(null) },
    { id: 'cam3', name: 'Bowler View', videoRef: useRef<HTMLVideoElement>(null) },
    { id: 'cam4', name: 'Boundary/Score', videoRef: useRef<HTMLVideoElement>(null) },
  ]);

  const [previewId, setPreviewId] = useState<string>('cam1');
  const [programId, setProgramId] = useState<string>('cam2');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [overlayActive, setOverlayActive] = useState<boolean>(true);
  
  const programCanvasRef = useRef<HTMLCanvasElement>(null);
  const transitionAlpha = useRef<number>(1.0);

  // Simulated Scoreboard State
  const [score] = useState({
    team: 'IND', runs: 145, wickets: 4, overs: '17.3', crr: '8.28', rrr: '10.00', target: 170
  });

  useEffect(() => {
    const canvas = programCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const programCam = cameras.find(c => c.id === programId);
      if (programCam?.videoRef.current && programCam.videoRef.current.readyState >= 2) {
        ctx.globalAlpha = transitionAlpha.current;
        ctx.drawImage(programCam.videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback Graphic Placeholder
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.fillText(`PROGRAM: ${programCam?.name} (NO INPUT)`, 50, 50);
      }

      // Render Dynamic Television Broadcast Graphics Interface Overlay
      if (overlayActive) {
        ctx.globalAlpha = 1.0;
        
        // Lower Third Scoreboard Wrapper Container
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(40, canvas.height - 100, 450, 60);
        
        // Brand Highlight Accent Tab
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(40, canvas.height - 100, 10, 60);

        // Core Score Output Data
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${score.team} ${score.runs}/${score.wickets}`, 70, canvas.height - 62);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Overs: ${score.overs}`, 260, canvas.height - 62);
        ctx.fillText(`CRR: ${score.crr}`, 380, canvas.height - 62);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [programId, overlayActive, score]);

  const executeCut = () => {
    const currentPreview = previewId;
    setPreviewId(programId);
    setProgramId(currentPreview);
    transitionAlpha.current = 1.0;
  };

  const executeFade = () => {
    let alpha = 0;
    const targetCam = previewId;
    const currentProg = programId;
    
    const fadeInterval = setInterval(() => {
      alpha += 0.1;
      if (alpha >= 1) {
        clearInterval(fadeInterval);
        setProgramId(targetCam);
        setPreviewId(currentProg);
        transitionAlpha.current = 1.0;
      } else {
        transitionAlpha.current = 1.0 - alpha;
      }
    }, 30);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black tracking-wider text-rose-500">CRICKET BROADCAST PRO</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition ${isStreaming ? 'bg-red-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {isStreaming ? <Square size={18} /> : <Play size={18} />}
            {isStreaming ? 'STOP STREAM' : 'GO LIVE'}
          </button>
        </div>
      </header>

      {/* Primary Production Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PREVIEW WINDOW */}
        <div className="bg-slate-900 border-2 border-green-500 rounded overflow-hidden">
          <div className="bg-green-500 text-slate-950 text-xs font-bold px-2 py-1 uppercase tracking-widest">Preview</div>
          <div className="aspect-video bg-black flex items-center justify-center relative">
            <span className="text-slate-500 text-sm">Preview Monitor [{previewId}]</span>
          </div>
        </div>

        {/* PROGRAM WINDOW (MASTER TEXTURE RE-STREAM ENGINE) */}
        <div className="bg-slate-900 border-2 border-red-600 rounded overflow-hidden">
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">Program (Master Live Output)</div>
          <canvas 
            ref={programCanvasRef} 
            width={1280} 
            height={720} 
            className="w-full aspect-video bg-black block"
          />
        </div>
      </div>

      {/* TRANSITION CONTROL SYSTEM CORNER */}
      <div className="flex justify-center gap-4 mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <button onClick={executeCut} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded font-black text-sm tracking-widest">CUT</button>
        <button onClick={executeFade} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded font-black text-sm tracking-widest">FADE</button>
        <button onClick={() => setOverlayActive(!overlayActive)} className={`px-6 py-3 rounded font-black text-sm tracking-widest flex items-center gap-2 ${overlayActive ? 'bg-blue-600' : 'bg-slate-800'}`}>
          <Layers size={16}/> OVERLAY {overlayActive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* MULTI-CAM INGEST MONITOR SLOTS */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Wireless Source Feeds</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cameras.map((cam) => (
          <div 
            key={cam.id} 
            onClick={() => setPreviewId(cam.id)}
            className={`cursor-pointer rounded overflow-hidden border bg-slate-900 transition-all ${previewId === cam.id ? 'border-green-500 ring-2 ring-green-500/30' : programId === cam.id ? 'border-red-600' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="p-2 text-xs font-bold flex justify-between items-center bg-slate-950">
              <span className="truncate">{cam.name}</span>
              <Video size={14} className={programId === cam.id ? 'text-red-500' : 'text-slate-400'} />
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <video 
                ref={cam.videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover hidden" 
              />
              <div className="text-center p-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1 animate-ping" />
                <span className="text-[10px] text-slate-500 block">WebRTC Connected</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950 text-[10px] flex justify-between text-slate-400">
              <span>🔋 94%</span>
              <span>📶 54 Mbps</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
8n
