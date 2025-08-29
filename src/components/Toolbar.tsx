import React, { useState, useRef, useEffect } from "react";
import { Tool, Units } from "../types";
import { colorToAlpha, fillToColor } from "../utils/geometry";

// SVG Icons for tools
const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
    <path d="M13 13l6 6"></path>
  </svg>
);

const HandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
  </svg>
);

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const RectangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </svg>
);

const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"></circle>
  </svg>
);

const TextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,7 4,4 20,4 20,7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
);

// Draw tool icons (similar but visually distinct)
const DrawLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 12l12 0"></path>
    <path d="M3 12l1 0"></path>
    <path d="M20 12l1 0"></path>
  </svg>
);

const DrawRectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="1" ry="1"></rect>
  </svg>
);

const DrawCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"></circle>
  </svg>
);

const DropdownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);

const ZoomResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="M21 21l-4.35-4.35"></path>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const FitToImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,8 4,4 8,4"></polyline>
    <polyline points="16,4 20,4 20,8"></polyline>
    <polyline points="20,16 20,20 16,20"></polyline>
    <polyline points="8,20 4,20 4,16"></polyline>
    <line x1="9" y1="9" x2="15" y2="15"></line>
    <line x1="15" y1="9" x2="9" y2="15"></line>
  </svg>
);

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  fill: string;
  setFill: (fill: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  unit: Units;
  setUnit: (unit: Units) => void;
  selectedId: string | null;
  onDelete: () => void;
  onStartCalibration: () => void;
  onResetZoom: () => void;
  onFitToImage: () => void;
  scale: number;
  calibrationPPM: number | null;
  shiftDown?: boolean;
  onUpdateSelectedEntity?: (updates: any) => void;
}

export function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  fill,
  setFill,
  strokeWidth,
  setStrokeWidth,
  unit,
  setUnit,
  selectedId,
  onDelete,
  onStartCalibration,
  onResetZoom,
  onFitToImage,
  scale,
  calibrationPPM,
  shiftDown = false,
  onUpdateSelectedEntity,
}: ToolbarProps) {
  const activeBtn = (t: Tool) => tool === t ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100";
  const iconBtn = "p-2 rounded border transition-colors duration-200 flex items-center justify-center";
  
  // Draw tools dropdown state
  const [showDrawDropdown, setShowDrawDropdown] = useState(false);
  const [selectedDrawTool, setSelectedDrawTool] = useState<'draw-line' | 'draw-rect' | 'draw-circle'>('draw-line');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          dropdownButtonRef.current && !dropdownButtonRef.current.contains(event.target as Node)) {
        setShowDrawDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const getDrawToolIcon = (drawTool: string) => {
    switch (drawTool) {
      case 'draw-line': return <DrawLineIcon />;
      case 'draw-rect': return <DrawRectIcon />;
      case 'draw-circle': return <DrawCircleIcon />;
      default: return <DrawLineIcon />;
    }
  };
  
  const getDrawToolTitle = (drawTool: string) => {
    switch (drawTool) {
      case 'draw-line': return 'Linie zeichnen';
      case 'draw-rect': return 'Rechteck zeichnen';
      case 'draw-circle': return 'Kreis zeichnen';
      default: return 'Zeichnen';
    }
  };
  
  const handleDrawToolSelect = (drawTool: 'draw-line' | 'draw-rect' | 'draw-circle') => {
    setSelectedDrawTool(drawTool);
    setTool(drawTool);
    setShowDrawDropdown(false);
  };
  
  const isDrawTool = ['draw-line', 'draw-rect', 'draw-circle'].includes(tool);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 border-t bg-white/95 backdrop-blur-sm z-40 shadow-lg flex items-center gap-2 px-3 overflow-x-auto">
      
      {/* Tool Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          className={`${iconBtn} ${activeBtn("select")}`} 
          onClick={() => setTool("select")} 
          title="Auswählen"
        >
          <SelectIcon />
        </button>
        
        <button 
          className={`${iconBtn} ${activeBtn("hand")}`} 
          onClick={() => setTool("hand")} 
          title="Hand - Verschieben"
        >
          <HandIcon />
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Drawing Tools */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          className={`${iconBtn} ${activeBtn("line")}`} 
          onClick={() => setTool("line")} 
          title={`Linie${shiftDown ? ' (Shift: gerade)' : ''}`}
        >
          <LineIcon />
        </button>
        
        <button 
          className={`${iconBtn} ${activeBtn("rect")}`} 
          onClick={() => setTool("rect")} 
          title="Rechteck"
        >
          <RectangleIcon />
        </button>
        
        <button 
          className={`${iconBtn} ${activeBtn("circle")}`} 
          onClick={() => setTool("circle")} 
          title="Kreis"
        >
          <CircleIcon />
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Draw Tools with Dropdown */}
      <div className="relative flex items-center gap-1 flex-shrink-0">
        <div className="flex">
          <button 
            ref={dropdownButtonRef}
            className={`${iconBtn} ${isDrawTool ? "bg-green-600 text-white" : "bg-white hover:bg-gray-100"} rounded-r-none border-r-0 pr-1`}
            onClick={() => {
              if (isDrawTool) {
                setShowDrawDropdown(!showDrawDropdown);
              } else {
                setTool(selectedDrawTool);
              }
            }}
            title={getDrawToolTitle(selectedDrawTool)}
          >
            {getDrawToolIcon(selectedDrawTool)}
          </button>
          
          <button 
            className={`${iconBtn} ${isDrawTool ? "bg-green-600 text-white" : "bg-white hover:bg-gray-100"} rounded-l-none border-l-0 pl-1 pr-1`}
            onClick={() => setShowDrawDropdown(!showDrawDropdown)}
            title="Zeichenwerkzeuge"
          >
            <DropdownIcon />
          </button>
        </div>
        
        {/* Dropdown Menu */}
        {showDrawDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg py-1 z-50"
          >
            <button
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${selectedDrawTool === 'draw-line' ? 'bg-green-50 text-green-700' : ''}`}
              onClick={() => handleDrawToolSelect('draw-line')}
            >
              <DrawLineIcon />
              <span className="text-sm">Linie zeichnen</span>
            </button>
            <button
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${selectedDrawTool === 'draw-rect' ? 'bg-green-50 text-green-700' : ''}`}
              onClick={() => handleDrawToolSelect('draw-rect')}
            >
              <DrawRectIcon />
              <span className="text-sm">Rechteck zeichnen</span>
            </button>
            <button
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${selectedDrawTool === 'draw-circle' ? 'bg-green-50 text-green-700' : ''}`}
              onClick={() => handleDrawToolSelect('draw-circle')}
            >
              <DrawCircleIcon />
              <span className="text-sm">Kreis zeichnen</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Text Tool */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          className={`${iconBtn} ${activeBtn("text")}`} 
          onClick={() => setTool("text")} 
          title="Text hinzufügen"
        >
          <TextIcon />
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Calibration - keep as text */}
      <button 
        className="px-3 py-1.5 rounded border text-sm bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 flex-shrink-0" 
        onClick={onStartCalibration} 
        title="Zwei-Punkt-Kalibrierung"
      >
        Kalibrieren
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          className={`${iconBtn} bg-white hover:bg-gray-100`} 
          onClick={onResetZoom} 
          title="Zoom zurücksetzen (100%)"
        >
          <ZoomResetIcon />
        </button>
        
        <button 
          className={`${iconBtn} bg-white hover:bg-gray-100`} 
          onClick={onFitToImage} 
          title="An Bild anpassen"
        >
          <FitToImageIcon />
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Style Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="text-xs text-gray-600">Farbe</label>
        <input type="color" value={color} onChange={(e) => {
          setColor(e.target.value);
          // If an entity is selected, update its color
          if (selectedId && onUpdateSelectedEntity) {
            onUpdateSelectedEntity({ stroke: e.target.value });
          }
        }} className="w-6 h-6 rounded border" />
        
        {(tool === "rect" || tool === "circle" || tool === "draw-rect" || tool === "draw-circle") && (
          <>
            <label className="text-xs text-gray-600 ml-1">Füllung</label>
            <input type="color" value={fillToColor(fill)} onChange={(e) => setFill(colorToAlpha(e.target.value, 0.12))} className="w-6 h-6 rounded border" />
          </>
        )}
        
        {(tool === "line" || tool === "rect" || tool === "circle" || tool === "draw-line" || tool === "draw-rect" || tool === "draw-circle" || selectedId) && (
          <>
            <label className="text-xs text-gray-600 ml-1">Strich</label>
            <input 
              type="number" 
              min={1} 
              max={10} 
              value={strokeWidth} 
              onChange={(e) => {
                const newWidth = parseInt(e.target.value || "1");
                setStrokeWidth(newWidth);
                // If an entity is selected, update its stroke width
                if (selectedId && onUpdateSelectedEntity) {
                  onUpdateSelectedEntity({ strokeWidth: newWidth });
                }
              }} 
              className="w-12 px-1 py-1 border rounded text-xs" 
            />
          </>
        )}
        
        <label className="text-xs text-gray-600 ml-1">Einheit</label>
        <select value={unit} onChange={(e) => setUnit(e.target.value as Units)} className="px-2 py-1 border rounded text-xs">
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="m">m</option>
        </select>
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
      
      {/* Delete Button */}
      <button
        className={`px-2 py-1.5 rounded border text-xs flex-shrink-0 ${selectedId ? 'bg-red-600 text-white hover:bg-red-700' : 'opacity-50 cursor-not-allowed bg-gray-100'}`}
        disabled={!selectedId}
        onClick={onDelete}
        title="Ausgewähltes Element löschen"
      >
        Löschen
      </button>
      
      <div className="flex-1 min-w-0" />
      
      {/* Status Info */}
      <div className="text-xs text-gray-500 flex-shrink-0">
        Zoom: {(scale*100).toFixed(0)}% | {unit} {calibrationPPM ? `| ${(calibrationPPM).toFixed(1)} px/m` : "| nicht kalibriert"}
        {((tool === "line" || tool === "calibrate") && shiftDown) && " | Shift: Gerade"}
      </div>
    </div>
  );
}
