import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Move, RotateCcw, Image as ImageIcon, Upload, Sparkles, Type, X, FileJson, Import } from 'lucide-react';
import { BlendMode, SpiralSettings, TextOverlay, ExportedSettings } from '../types';
import { Slider, Toggle, Select } from './ControlPanel';

const MAX_CANVAS_SIZE = 2048;

interface HypnoEditorProps {
  imageSrc: string | null;
  onReset: () => void;
}

const DEFAULT_SETTINGS: SpiralSettings = {
  centerX: 0.5,
  centerY: 0.5,
  spacing: 20,
  thickness: 10,
  rotation: 0,
  color: '#000000',
  opacity: 0.8,
  blendMode: BlendMode.NORMAL,
  isConcentric: false,
  
  aspectRatio: 'original',

  blur: 0,
  antiAliasing: true,

  isDouble: false,
  secondaryColor: '#ffffff',
  
  deformationAmount: 0,
  deformationFrequency: 10,

  sparkleAmount: 500,
  sparkleSize: 1.5,
  sparkleOpacity: 0.7,
  sparkleColor: '#ffffff',
  sparkleBlur: 0,
};

const DEFAULT_TEXT: Omit<TextOverlay, 'id' | 'x' | 'y'> = {
  text: 'TG:\nRFV34D',
  fontSize: 32,
  color: '#000000',
  backgroundColor: '#ffffff',
  padding: 16,
  borderRadius: 12,
  lineHeight: 1.2,
};


export const HypnoEditor: React.FC<HypnoEditorProps> = ({ imageSrc, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<SpiralSettings>(DEFAULT_SETTINGS);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Interaction states
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [hoveringTextId, setHoveringTextId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState<Omit<TextOverlay, 'id' | 'x' | 'y'>>(DEFAULT_TEXT);
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [settingsJson, setSettingsJson] = useState('');
  const importJsonRef = useRef<HTMLTextAreaElement>(null);


  const parseAspectRatio = (ratioStr: string): number | null => {
    if (ratioStr === 'original') return null;
    const parts = ratioStr.split(':');
    if (parts.length !== 2) return null;
    return parseInt(parts[0], 10) / parseInt(parts[1], 10);
  }

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImageElement(img);
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!imageElement) return;

    if (settings.aspectRatio === '1280:1063') {
        setCanvasSize({ width: 1280, height: 1063 });
        setSettings(prev => ({ ...prev, centerX: 0.5, centerY: 0.5 }));
        return;
    }

    const targetRatio = parseAspectRatio(settings.aspectRatio) ?? imageElement.width / imageElement.height;
    let w = imageElement.width;
    let h = imageElement.height;

    if (w > MAX_CANVAS_SIZE || h > MAX_CANVAS_SIZE) {
        const ratio = w / h;
        if (w > h) {
          w = MAX_CANVAS_SIZE;
          h = MAX_CANVAS_SIZE / ratio;
        } else {
          h = MAX_CANVAS_SIZE;
          w = MAX_CANVAS_SIZE * ratio;
        }
    }
    
    const currentRatio = w / h;
    if (Math.abs(currentRatio - targetRatio) > 0.01) {
       if (currentRatio > targetRatio) {
          w = h * targetRatio;
       } else {
          h = w / targetRatio;
       }
    }

    setCanvasSize({ width: Math.round(w), height: Math.round(h) });
    setSettings(prev => ({ ...prev, centerX: 0.5, centerY: 0.5 }));
  }, [imageElement, settings.aspectRatio]);

  const getTextOverlayBbox = useCallback((overlay: TextOverlay, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { x: number, y: number, width: number, height: number } => {
    const lines = overlay.text.split('\n');
    const scaledFontSize = overlay.fontSize * (canvas.width / 1080);
    const scaledPadding = overlay.padding * (canvas.width / 1080);
    
    ctx.font = `800 ${scaledFontSize}px Inter, sans-serif`;
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });

    const textHeight = scaledFontSize * overlay.lineHeight;
    const totalTextHeight = (textHeight * lines.length) - (scaledFontSize * (overlay.lineHeight - 1));
    
    const rectWidth = maxWidth + scaledPadding * 2;
    const rectHeight = totalTextHeight + scaledPadding * 2;
    const rectX = overlay.x * canvas.width - rectWidth / 2;
    const rectY = overlay.y * canvas.height - rectHeight / 2;
    
    return { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageElement) return;

    ctx.imageSmoothingEnabled = settings.antiAliasing;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.filter = `blur(${settings.blur}px)`;

    const imgRatio = imageElement.width / imageElement.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx, sy, sWidth, sHeight;

    if (imgRatio > canvasRatio) {
        sHeight = imageElement.height;
        sWidth = sHeight * canvasRatio;
        sx = (imageElement.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = imageElement.width;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = (imageElement.height - sHeight) / 2;
    }
    ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const cx = settings.centerX * canvas.width;
    const cy = settings.centerY * canvas.height;
    const maxRadius = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

    ctx.globalAlpha = settings.opacity;
    ctx.globalCompositeOperation = settings.blendMode as GlobalCompositeOperation;
    ctx.lineWidth = settings.thickness;
    ctx.lineCap = 'round';

    const drawSet = (isSecondary: boolean) => {
        ctx.strokeStyle = isSecondary ? settings.secondaryColor : settings.color;
        ctx.beginPath();
        
        if (settings.isConcentric) {
            const radiusOffset = isSecondary && settings.isDouble ? settings.spacing / 2 : 0;
            for (let r = radiusOffset; r < maxRadius; r += settings.spacing) {
                if (r <= 0) continue;
                const step = Math.PI / 180;
                ctx.moveTo(cx + r, cy);
                for (let angle = step; angle <= Math.PI * 2 + step; angle += step) {
                    const deform = settings.deformationAmount * Math.sin(angle * settings.deformationFrequency + r * 0.1);
                    ctx.lineTo(cx + (r + deform) * Math.cos(angle), cy + (r + deform) * Math.sin(angle));
                }
            }
        } else {
            const rotationOffset = isSecondary && settings.isDouble ? Math.PI : 0;
            const b = settings.spacing / (2 * Math.PI);
            const step = 0.1;
            const maxTheta = maxRadius / b;
            
            ctx.moveTo(cx, cy);
            for (let theta = 0; theta < maxTheta; theta += step) {
                const r = b * theta;
                const deform = settings.deformationAmount * Math.sin(theta * settings.deformationFrequency * 0.1);
                const deformedR = r + deform;
                const angle = theta + settings.rotation + rotationOffset;
                ctx.lineTo(cx + deformedR * Math.cos(angle), cy + deformedR * Math.sin(angle));
            }
        }
        ctx.stroke();
    };

    drawSet(false);
    if (settings.isDouble) {
        drawSet(true);
    }

    if (settings.sparkleAmount > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = settings.sparkleColor;
      ctx.globalAlpha = settings.sparkleOpacity;
      ctx.filter = `blur(${settings.sparkleBlur}px)`;
      for (let i = 0; i < settings.sparkleAmount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * settings.sparkleSize;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';

    textOverlays.forEach(overlay => {
      const { x, y, width, height } = getTextOverlayBbox(overlay, canvas, ctx);
      const lines = overlay.text.split('\n');
      const scaledFontSize = overlay.fontSize * (canvas.width / 1080);
      const scaledBorderRadius = overlay.borderRadius * (canvas.width / 1080);
      const scaledPadding = overlay.padding * (canvas.width / 1080);

      ctx.fillStyle = overlay.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, scaledBorderRadius);
      ctx.fill();

      ctx.fillStyle = overlay.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${scaledFontSize}px Inter, sans-serif`;
      const textHeight = scaledFontSize * overlay.lineHeight;
      lines.forEach((line, index) => {
        const lineY = y + scaledPadding + (textHeight / 2) + (index * textHeight);
        ctx.fillText(line, x + width / 2, lineY);
      });
    });
    ctx.restore();


    if (isDraggingCenter) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.filter = 'none';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx, cy + 15);
      ctx.stroke();
    }

  }, [imageElement, settings, isDraggingCenter, textOverlays, getTextOverlayBbox]);

  useEffect(() => {
    draw();
  }, [draw]);
  
  const updateTextOverlayPosition = (id: string, x: number, y: number) => {
    setTextOverlays(prev => prev.map(o => o.id === id ? { ...o, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } : o));
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!containerRef.current || !canvas || !ctx) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on a text overlay
    for (const overlay of [...textOverlays].reverse()) {
        const bbox = getTextOverlayBbox(overlay, canvas, ctx);
        if (mouseX >= bbox.x && mouseX <= bbox.x + bbox.width && mouseY >= bbox.y && mouseY <= bbox.y + bbox.height) {
            setDraggingTextId(overlay.id);
            const offsetX = mouseX - (overlay.x * canvasSize.width);
            const offsetY = mouseY - (overlay.y * canvasSize.height);
            setDragStartOffset({ x: offsetX, y: offsetY });
            return;
        }
    }
    
    // If not, drag the center
    setIsDraggingCenter(true);
    updateCenter(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!containerRef.current || !canvas || !ctx) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingTextId) {
      const newXPixels = mouseX - dragStartOffset.x;
      const newYPixels = mouseY - dragStartOffset.y;
      updateTextOverlayPosition(draggingTextId, newXPixels / canvasSize.width, newYPixels / canvasSize.height);
    } else if (isDraggingCenter) {
      updateCenter(e);
    } else {
        // Hover check
        let isHovering = false;
        for (const overlay of textOverlays) {
            const bbox = getTextOverlayBbox(overlay, canvas, ctx);
            if (mouseX >= bbox.x && mouseX <= bbox.x + bbox.width && mouseY >= bbox.y && mouseY <= bbox.y + bbox.height) {
                setHoveringTextId(overlay.id);
                isHovering = true;
                break;
            }
        }
        if (!isHovering) setHoveringTextId(null);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingCenter(false);
    setDraggingTextId(null);
  };

  const updateCenter = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSettings(prev => ({ ...prev, centerX: x, centerY: y }));
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'hypno-edit.png';
    link.href = canvas.toDataURL('image/png', 0.9);
    link.click();
  };

  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      ...newText,
      id: Date.now().toString(),
      x: 0.5,
      y: 0.5,
    };
    setTextOverlays(prev => [...prev, newOverlay]);
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(o => o.id !== id));
  };
  
  const handleExport = () => {
      const dataToExport: ExportedSettings = {
          spiral: settings,
          text: textOverlays.map(({ id, ...rest }) => rest),
      };
      setSettingsJson(JSON.stringify(dataToExport, null, 2));
      setShowExportModal(true);
  };
  
  const handleImport = () => {
      const jsonString = importJsonRef.current?.value;
      if (!jsonString) {
          alert("Paste settings into the text area first.");
          return;
      }
      try {
          const data = JSON.parse(jsonString) as ExportedSettings;
          if (data && data.spiral && Array.isArray(data.text)) {
              setSettings(s => ({...s, ...data.spiral}));
              const newTextOverlays = data.text.map((t, i) => ({
                  ...DEFAULT_TEXT,
                  ...t,
                  id: `${Date.now()}-${i}`,
              }));
              setTextOverlays(newTextOverlays);
              setShowImportModal(false);
          } else {
              alert("Invalid settings format.");
          }
      } catch (error) {
          alert("Error parsing JSON. Please check the format.");
          console.error(error);
      }
  };

  const getCursor = () => {
      if (draggingTextId) return 'grabbing';
      if (hoveringTextId) return 'grab';
      if (isDraggingCenter) return 'crosshair';
      return 'crosshair';
  }

  if (!imageSrc) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-950 text-zinc-200 overflow-hidden">
      
      <div className="flex-1 relative flex items-center justify-center bg-[#121214] p-4 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative shadow-2xl shadow-black/50 max-h-full max-w-full"
          style={{ 
            aspectRatio: canvasSize.width && canvasSize.height ? canvasSize.width / canvasSize.height : 1,
            width: canvasSize.width ? `${canvasSize.width}px` : 'auto',
            height: canvasSize.height ? `${canvasSize.height}px` : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            cursor: getCursor(),
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
           <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="w-full h-full block touch-none"
          />
          {!isDraggingCenter && !draggingTextId && (
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-xs px-3 py-1 rounded-full pointer-events-none border border-white/10 text-white/70">
              Drag on image to move center, or drag text to move it.
             </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-[40vh] lg:h-full">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900 z-10">
          <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Effect Controls
          </h2>
          <div className="flex gap-1">
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors" title="Import Settings"><Import size={18} className="text-zinc-400" /></button>
            <button onClick={handleExport} className="p-2 hover:bg-zinc-800 rounded-full transition-colors" title="Export Settings"><FileJson size={18} className="text-zinc-400" /></button>
            <button onClick={onReset} className="p-2 hover:bg-zinc-800 rounded-full transition-colors" title="Upload New Image"><Upload size={18} className="text-zinc-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <section>
             <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3 tracking-wider">Canvas</h3>
             <Select 
              label="Aspect Ratio"
              value={settings.aspectRatio}
              onChange={(v) => setSettings(s => ({ ...s, aspectRatio: v }))}
              options={[
                { label: 'Original', value: 'original' },
                { label: 'Custom (1280x1063)', value: '1280:1063' },
                { label: '1:1 (Square)', value: '1:1' },
                { label: '3:4 (Portrait)', value: '3:4' },
                { label: '4:3 (Landscape)', value: '4:3' },
                { label: '9:16 (Story)', value: '9:16' },
                { label: '16:9 (Widescreen)', value: '16:9' },
              ]}
             />
          </section>

          <hr className="border-zinc-800" />
          
          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3 tracking-wider">Pattern Style</h3>
             <div className="flex gap-2 mb-4 p-1 bg-zinc-800 rounded-lg">
                <button 
                  onClick={() => setSettings(s => ({...s, isConcentric: false}))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!settings.isConcentric ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                  Spiral
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, isConcentric: true}))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${settings.isConcentric ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                  Ripple
                </button>
             </div>

             <Toggle label="Double Spiral" checked={settings.isDouble} onChange={(v) => setSettings(s => ({...s, isDouble: v}))} />

             <div className="grid grid-cols-2 gap-3 mb-4">
               <div>
                 <label className="block text-xs text-zinc-400 mb-1">Color {settings.isDouble ? '1' : ''}</label>
                 <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded border border-zinc-700">
                   <input 
                    type="color" 
                    value={settings.color} 
                    onChange={(e) => setSettings(s => ({...s, color: e.target.value}))}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                   />
                   <span className="text-xs font-mono">{settings.color}</span>
                 </div>
               </div>
                {settings.isDouble ? (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Color 2</label>
                    <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded border border-zinc-700">
                      <input 
                        type="color" 
                        value={settings.secondaryColor} 
                        onChange={(e) => setSettings(s => ({...s, secondaryColor: e.target.value}))}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono">{settings.secondaryColor}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Blend Mode</label>
                    <select 
                        value={settings.blendMode}
                        onChange={(e) => setSettings(s => ({...s, blendMode: e.target.value as BlendMode}))}
                        className="w-full h-8 bg-zinc-800 text-xs border border-zinc-700 rounded px-1 outline-none focus:border-indigo-500"
                      >
                        {Object.values(BlendMode).map(m => (
                          <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                        ))}
                      </select>
                  </div>
                )}
             </div>
             {settings.isDouble && (
                <div>
                 <label className="block text-xs text-zinc-400 mb-1">Blend Mode</label>
                 <select 
                    value={settings.blendMode}
                    onChange={(e) => setSettings(s => ({...s, blendMode: e.target.value as BlendMode}))}
                    className="w-full h-8 bg-zinc-800 text-xs border border-zinc-700 rounded px-1 outline-none focus:border-indigo-500"
                  >
                    {Object.values(BlendMode).map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
               </div>
             )}
          </section>

          <hr className="border-zinc-800" />

          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3 tracking-wider">Geometry</h3>
            <Slider label="Density / Spacing" value={settings.spacing} min={5} max={100} onChange={(v) => setSettings(s => ({...s, spacing: v}))} />
            <Slider label="Line Thickness" value={settings.thickness} min={1} max={settings.spacing * 1.5} onChange={(v) => setSettings(s => ({...s, thickness: v}))} />
            {!settings.isConcentric && (
              <Slider label="Rotation" value={settings.rotation} min={0} max={Math.PI * 2} step={0.1} onChange={(v) => setSettings(s => ({...s, rotation: v}))} />
            )}
             <div className="flex justify-between items-center pt-2">
                 <button onClick={() => setSettings(s => ({...s, rotation: 0, centerX: 0.5, centerY: 0.5}))} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                   <RotateCcw size={12} /> Reset Position
                 </button>
             </div>
          </section>

          <hr className="border-zinc-800" />
          
          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3 tracking-wider">Deformation</h3>
            <Slider label="Amount" value={settings.deformationAmount} min={0} max={settings.spacing} step={0.5} onChange={(v) => setSettings(s => ({...s, deformationAmount: v}))} />
            <Slider label="Frequency" value={settings.deformationFrequency} min={1} max={50} onChange={(v) => setSettings(s => ({...s, deformationFrequency: v}))} />
          </section>

           <hr className="border-zinc-800" />

          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3 tracking-wider">Composition</h3>
            <Slider label="Pattern Opacity" value={settings.opacity} min={0} max={1} step={0.05} onChange={(v) => setSettings(s => ({...s, opacity: v}))} />
            <Slider label="Background Blur" value={settings.blur} min={0} max={20} step={0.5} onChange={(v) => setSettings(s => ({...s, blur: v}))} />
            <Toggle label="Smooth Lines (Anti-alias)" checked={settings.antiAliasing} onChange={(v) => setSettings(s => ({...s, antiAliasing: v}))} />
          </section>
          
          <hr className="border-zinc-800" />

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Type size={14} className="text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Text Overlays</h3>
            </div>
            <div className="bg-zinc-800/50 p-3 rounded-lg space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Text Content</label>
                <textarea 
                  value={newText.text}
                  onChange={(e) => setNewText(t => ({...t, text: e.target.value}))}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs text-zinc-400 mb-1">Text Color</label>
                   <input type="color" value={newText.color} onChange={(e) => setNewText(t => ({ ...t, color: e.target.value }))} className="w-full h-8 rounded cursor-pointer border-zinc-700 bg-zinc-900"/>
                </div>
                 <div>
                   <label className="block text-xs text-zinc-400 mb-1">BG Color</label>
                   <input type="color" value={newText.backgroundColor} onChange={(e) => setNewText(t => ({ ...t, backgroundColor: e.target.value }))} className="w-full h-8 rounded cursor-pointer border-zinc-700 bg-zinc-900"/>
                </div>
              </div>
              <Slider label="Font Size" value={newText.fontSize} min={8} max={128} onChange={(v) => setNewText(t => ({...t, fontSize: v}))} />
              <button onClick={addTextOverlay} className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-md text-sm hover:bg-indigo-500 transition-colors">
                Add Text
              </button>
            </div>
            {textOverlays.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className='text-xs text-zinc-500 mb-2'>Click and drag text on the image to move it.</p>
                {textOverlays.map(overlay => (
                   <div key={overlay.id} className="text-xs bg-zinc-800/50 p-2 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-mono whitespace-pre-wrap break-words text-zinc-300 w-full mr-2">{overlay.text}</p>
                        <button onClick={() => removeTextOverlay(overlay.id)} className="p-1 text-zinc-500 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                      <Slider label="Position X" value={overlay.x} min={0} max={1} step={0.01} onChange={(v) => updateTextOverlayPosition(overlay.id, v, overlay.y)} />
                      <Slider label="Position Y" value={overlay.y} min={0} max={1} step={0.01} onChange={(v) => updateTextOverlayPosition(overlay.id, overlay.x, v)} />
                   </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-zinc-800" />

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sparkle Effect</h3>
            </div>
             <div className="mb-4">
                 <label className="block text-xs text-zinc-400 mb-1">Color</label>
                 <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded border border-zinc-700">
                   <input 
                    type="color" 
                    value={settings.sparkleColor} 
                    onChange={(e) => setSettings(s => ({...s, sparkleColor: e.target.value}))}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                   />
                   <span className="text-xs font-mono">{settings.sparkleColor}</span>
                 </div>
               </div>
            <Slider label="Amount" value={settings.sparkleAmount} min={0} max={5000} step={50} onChange={(v) => setSettings(s => ({...s, sparkleAmount: v}))} />
            <Slider label="Size" value={settings.sparkleSize} min={0.1} max={5} step={0.1} onChange={(v) => setSettings(s => ({...s, sparkleSize: v}))} />
            <Slider label="Opacity" value={settings.sparkleOpacity} min={0} max={1} step={0.05} onChange={(v) => setSettings(s => ({...s, sparkleOpacity: v}))} />
            <Slider label="Blur" value={settings.sparkleBlur} min={0} max={10} step={0.1} onChange={(v) => setSettings(s => ({...s, sparkleBlur: v}))} />
          </section>

        </div>

        <div className="p-4 bg-zinc-900 border-t border-zinc-800 mt-auto">
          <button onClick={downloadImage} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5">
            <Download size={18} />
            Save Image
          </button>
        </div>
      </div>
      
      {/* Modals */}
      {(showImportModal || showExportModal) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => {setShowImportModal(false); setShowExportModal(false)}}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">{showImportModal ? 'Import Settings' : 'Export Settings'}</h3>
              <button onClick={() => {setShowImportModal(false); setShowExportModal(false)}} className="p-1 text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-3">
                {showImportModal ? 'Paste your saved JSON settings below to apply them.' : 'Copy the JSON below to save your current settings.'}
              </p>
              <textarea 
                ref={importJsonRef}
                readOnly={showExportModal}
                defaultValue={showExportModal ? settingsJson : ''}
                placeholder={showImportModal ? 'Paste settings JSON here...' : ''}
                className="w-full h-48 bg-zinc-950 border border-zinc-700 text-zinc-300 font-mono text-xs rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
              />
            </div>
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => {setShowImportModal(false); setShowExportModal(false)}} className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">Cancel</button>
              {showImportModal ? (
                <button onClick={handleImport} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">Apply</button>
              ) : (
                <button onClick={() => navigator.clipboard.writeText(settingsJson)} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">Copy to Clipboard</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
